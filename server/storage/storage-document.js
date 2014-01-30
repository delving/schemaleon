'use strict';

var _ = require('underscore');
var util = require('../util');

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

var P = Document.prototype;

function log(message) {
//    console.log('storage-document.js: ', message);
}

P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get document schema ' + schemaName,
        s.schemaPath(schemaName),
        receiver
    );
};

P.searchDocuments = function (params, receiver) {

    console.log("search", params); // todo

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

P.getDocument = function (schemaName, groupIdentifier, identifier, receiver) {
    var s = this.storage;
    s.query('get document ' + identifier + ' ' + schemaName + ' ' + groupIdentifier,
        s.dataPath(identifier, schemaName, groupIdentifier),
        receiver
    );
};

function wrapMediaDoc(doc) {
    return {
        identifier: util.getFromXml(doc, 'Identifier'),
        mimeType: util.getFromXml(doc, 'MimeType'),
        groupIdentifier: util.getFromXml(doc, 'GroupIdentifier'),
        xml: doc
    }
}

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

P.saveDocument = function (envelope, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var header = _.clone(envelope.header);
    var body = _.clone(envelope.body);

    function triggerGitCommit() {
        console.log('Should eventually trigger git add/commit');
    }

    if (!header.GroupIdentifier) {
        receiver('');
        return;
    }
    header.TimeStamp = time;
    if (header.Identifier === IDENTIFIER) {
        if (header.SchemaName == 'MediaMetadata') {
            // expects fileName, mimeType
            log('save media' + JSON.stringify(envelope));
            s.Media.saveMedia(header, body, function (base, extension, error) {
                if (error) {
                    console.error(error);
                    receiver('');
                }
                else {
                    header.Identifier = base;
                    log('header with identifier ' + JSON.stringify(header));
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
            function (header) {
                triggerGitCommit();
                receiver(header);
            }
        );
    }

    function addDocument() {
        var xml = envelope.xml
            .replace(IDENTIFIER, header.Identifier) // header
            .replace(TIMESTAMP, time); // header
        s.add('add document ' + header.Identifier,
            s.dataDocument(header.Identifier, header.SchemaName, header.GroupIdentifier),
            xml,
            function(header) {
                triggerGitCommit();
                receiver(header);
            }
        );
    }
};
