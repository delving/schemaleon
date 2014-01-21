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

P.getAllDocuments = function (schemaName, groupIdentifier, receiver) {
    var s = this.storage;
    s.query('get all documents ' + schemaName + ' ' + groupIdentifier,
        [
            '<Documents>',
            '    {',
            '        let $all :=',
            '           for $doc in ' + s.dataCollection(schemaName, groupIdentifier) + '/Document',
            '           order by $doc/Header/TimeStamp descending',
            '           return $doc',
            '        return subsequence($all, 1, ' + MAX_RESULTS + ')',
            '    }',
            '</Documents>'
        ],
        receiver
    );
};

P.selectDocuments = function (schemaName, groupIdentifier, search, receiver) {
    var s = this.storage;
    s.query('select documents: ' + schemaName + ' ' + search + ' ' + groupIdentifier,
        [
            '<Documents>',
            '    { ',
            '        let $all :=',
            '           for $doc in ' + s.dataCollection(schemaName, groupIdentifier) + '/Document',
            '           where $doc/Body//*[text() contains text ' + util.quote(search+'.+') + ' using wildcards]',
            '           or $doc/Body//*[text() contains text ' + util.quote(search) + ' using stemming]',
            '           order by $doc/Header/TimeStamp descending',
            '           return $doc',
            '        return subsequence($all, 1, ' + MAX_RESULTS + ')',
            '    }',
            '</Documents>'
        ],
        receiver
    );
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
            s.dataDocument(hdr.Identifier, hdr.SchemaName, hdr.groupIdentifier),
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
            s.dataDocument(hdr.Identifier, hdr.SchemaName, hdr.groupIdentifier),
            stamped,
            receiver
        );
    }
};
