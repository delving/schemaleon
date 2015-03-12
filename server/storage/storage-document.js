/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var _ = require('underscore');
var util = require('../util');

/*
 * Here we take care of saving and searching for documents of all kinds, primary or shared.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

var P = Document.prototype;

function log(message) {
    console.log('storage-document.js: ', message);
}

// fetch a schema
P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get document schema ' + schemaName, s.schemaPath(schemaName), receiver);
};

// search the documents, sometimes globally sometimes specifically, depending on the params.
//
// Params:
//    searchQuery - what are we searching for
//    wildcards - if you want to search for wildcards too, the default is using stemming
//    startIndex, maxResults - what to return and how much
//    schemaName - optionally searching for docs from a given schema
//    groupIdentifier - optionally searching docs from a given group
//

P.searchDocuments = function (params, receiver) {
//    console.log("search", params);
    // make sure these at least defaulted
    params.searchQuery = params.searchQuery || '';
    params.startIndex = params.startIndex || 1;
    params.maxResults = params.maxResults || 8;

    var s = this.storage;
    var q = [];
    q.push('<Documents>{');
    q.push('let $all := for $doc in ' + s.dataCollection(params.schemaName, params.groupIdentifier) + '/Document');
    if (params.schemaName != 'MediaMetadata') { // if we're not searching for MM, we must exclude it
        q.push("where ($doc/Header/SchemaName/text() != 'MediaMetadata')");
    }
    if (params.searchQuery && params.searchQuery.length) {
        q.push("and (");
        if (params.wildcards) {
            q.push('$doc/Body//*[text() contains text ' + util.quote(params.searchQuery + '.+') + ' using wildcards]');
            q.push('or');
        }
        q.push('$doc/Body//*[text() contains text ' + util.quote(params.searchQuery) + ' using stemming]');
        q.push(')')
    }
    if (s.onlyPublic(params.schemaName, params.groupIdentifier)) {
        q.push("and ($doc/Header/DocumentState/text() = 'public')");
    }
    if (s.isShared(params.schemaName)) {
        q.push('order by $doc/Header/SummaryFields/Title ascending');
    }
    else {
        q.push('order by $doc/Header/TimeStamp descending');
    }
    q.push('return $doc');
    q.push('return subsequence($all, ' + params.startIndex + ', ' + params.maxResults + ')');
    q.push('}</Documents>');
    s.query('select documents: ' + JSON.stringify(params), q, receiver);
};

// get a particular document
P.getDocument = function (schemaName, groupIdentifier, identifier, receiver) {
    var s = this.storage;
    s.query('get document ' + identifier + ' ' + schemaName + ' ' + groupIdentifier,
        s.dataPath(identifier, schemaName, groupIdentifier),
        receiver
    );
};

P.getAllDocuments = function(schemaName, groupIdentifier, receiver) {
    var s = this.storage;
    s.query('get document ' + schemaName + ' ' + groupIdentifier,
        s.dataCollection(schemaName, groupIdentifier),
        receiver
    );
};

// wrap a media doc so that it's a proper reply to the client
function wrapMediaDoc(doc) {
    return {
        identifier: util.getFromXml(doc, 'Identifier'),
        mimeType: util.getFromXml(doc, 'MimeType'),
        groupIdentifier: util.getFromXml(doc, 'GroupIdentifier'),
        xml: doc
    }
}

// get a media document, which is a special kind of search using a schema name and identifier
P.getMediaDocument = function(groupIdentifier, identifier, receiver) {
    var s = this.storage;
    var schemaName = 'MediaMetadata';
    if (groupIdentifier) {
        s.query('get media document ' + identifier + ' ' + groupIdentifier,
            s.dataPath(identifier, schemaName, groupIdentifier),
            function(doc, error) {
                if (error) {
                    receiver(null, error);
                }
                else {
                    receiver(wrapMediaDoc(doc), null);
                }
            }
        );
    }
    else {
        var q = [];
        q.push('let $all := for $doc in ' + s.dataCollection(null, null) + '/Document[Header/SchemaName='+util.quote(schemaName)+']');
        q.push('where ($doc/Header/SchemaName='+util.quote(schemaName)+')');
        q.push('and ($doc/Header/Identifier='+util.quote(identifier)+')');
        q.push('return $doc');
        q.push('return subsequence($all, 1, 1)');
        s.query('get media document (no group) ' + identifier, q, function(doc, error) {
            if (error) {
                receiver(null, error);
            }
            else {
                receiver(wrapMediaDoc(doc), null);
            }
        });
    }
};

// save a document.  this is fairly complicated because it does some substitution of values in XML when identifiers
// are invented, or things are timestamped, and it also treats MediaMetadata documents specially
// by triggering functions in storage-media.js

P.saveDocument = function (envelope, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var header = _.clone(envelope.header);
    var body = _.clone(envelope.body);

    function triggerGitCommit() {
//        console.log('Should eventually trigger git add/commit');
    }

    if (!header.GroupIdentifier) {
        reportError('No group identifier');
        return;
    }
    header.TimeStamp = time;
    if (header.Identifier === IDENTIFIER) {
        if (header.SchemaName == 'MediaMetadata') {
            // expects fileName, mimeType
            s.Media.saveMedia(header, body, function (base, extension, error) {
//                console.log('save media returns ', base, extension, error); // todo
                if (error) {
                    reportError(error);
                }
                else {
                    header.Identifier = base;
//                    console.log('savedoc: header with identifier', base); // todo
                    addDocument();
                }
            });
        }
        else {
            header.Identifier = util.generateDocumentId(header.SchemaName);
            addDocument();
        }
    }
    else {
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        s.replace('replace document ' + JSON.stringify(header.SummaryFields) + ' with ' + stamped,
            s.dataDocument(header.Identifier, header.SchemaName, header.GroupIdentifier),
            stamped,
            function (header) { // todo: what about if there is an error?
                triggerGitCommit();
                receiver(header, null);
            }
        );
    }

    function reportError(error) {
        receiver(null, error);
    }

    function addDocument() {
        var xml = envelope.xml
            .replace(IDENTIFIER, header.Identifier) // header
            .replace(TIMESTAMP, time); // header
//        console.log('savedoc: add document', xml); // todo
        s.add('add document ' + header.Identifier,
            s.dataDocument(header.Identifier, header.SchemaName, header.GroupIdentifier),
            xml,
            function(header) {
                triggerGitCommit();
                receiver(header, null);
            }
        );
    }
};
