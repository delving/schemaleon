'use strict';

var _ = require('underscore');
var util = require('../util');

var MAX_RESULTS = 30;

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

P.searchDocuments = function (search, receiver) {
    var s = this.storage;
    var q = [];
    q.push('<Documents>{');
    q.push('let $all := for $doc in ' + s.dataCollection(search.schemaName, search.groupIdentifier) + '/Document');
    if (search.schemaName != 'MediaMetadata') { // if we're not searching for MM, we must exclude it
        q.push("where ($doc/Header/SchemaName/text() != 'MediaMetadata')");
    }
    if (search.query && search.query.length) {
        q.push("and (");
        if (search.wildcards) {
            q.push('$doc/Body//*[text() contains text ' + util.quote(search.query + '.+') + ' using wildcards]');
            q.push('or');
        }
        q.push('$doc/Body//*[text() contains text ' + util.quote(search.query) + ' using stemming]');
        q.push(')')
    }
    q.push('order by $doc/Header/TimeStamp descending');
    q.push('return $doc');
    q.push('return subsequence($all, 1, ' + MAX_RESULTS + ')');
    q.push('}</Documents>');
    s.query('select documents: ' + search.schemaName + ' ' + search.groupIdentifier + ' ' + JSON.stringify(search), q, receiver);
};

P.getDocument = function (schemaName, groupIdentifier, identifier, receiver) {
    var s = this.storage;
    s.query('get document ' + identifier + ' ' + schemaName + ' ' + groupIdentifier,
        s.dataPath(identifier, schemaName, groupIdentifier),
        receiver
    );
};

P.saveDocument = function (envelope, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var hdr = _.clone(envelope.header); // todo: header should optionally contain group identifier
    var body = envelope.body;

    function addDocument() {
        var xml = envelope.xml
            .replace(IDENTIFIER, hdr.Identifier) // header
            .replace(IDENTIFIER, hdr.Identifier) // maybe body
            .replace(TIMESTAMP, time); // header
        s.add('add document ' + hdr.Identifier,
            s.dataDocument(hdr.Identifier, hdr.SchemaName, hdr.GroupIdentifier),
            xml,
            receiver
        );
    }

    hdr.TimeStamp = time;
    if (hdr.Identifier === IDENTIFIER) {
        if (envelope.header.SchemaName == 'MediaMetadata') {
            // expects fileName, mimeType
            log('save media' + JSON.stringify(envelope));
            s.Media.saveMedia(body, function (fileName) {
                hdr.Identifier = fileName;
                addDocument();
            });
        }
        else {
            hdr.Identifier = util.generateDocumentId(hdr.SchemaName);
            addDocument();
        }
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        s.replace('replace document ' + hdr.Identifier,
            s.dataDocument(hdr.Identifier, hdr.SchemaName, hdr.GroupIdentifier),
            stamped,
            receiver
        );
    }
};
