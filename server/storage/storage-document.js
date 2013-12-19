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
    console.log('storage-document.js: ', message);
}

P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get document schema ' + schemaName,
        s.schemaPath() + '/Document/' + schemaName,
        receiver
    );
};

P.getAllDocuments = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get all documents ' + schemaName,
        [
            '<Documents>',
            '    {',
            '        let $all :=',
            '           for $doc in ' + s.docCollection(schemaName) + '/Document',
            '           order by $doc/Header/TimeStamp descending',
            '           return $doc',
            '        return subsequence($all, 1, ' + MAX_RESULTS + ')',
            '    }',
            '</Documents>'
        ],
        receiver
    );
};

P.selectDocuments = function (schemaName, search, receiver) {
    var s = this.storage;
    s.query('select documents: ' + schemaName + ' ' + search,
        [
            '<Documents>',
            '    { ',
            '        let $all :=',
            '           for $doc in ' + s.docCollection(schemaName) + '/Document',
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

P.getDocument = function (schemaName, identifier, receiver) {
    var s = this.storage;
    s.query('get document ' + schemaName + ' ' + identifier,
        s.docPath(schemaName, identifier),
        receiver
    );
};

P.saveDocument = function (envelope, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var hdr = _.clone(envelope.header);
    var body = envelope.body;

    function addDocument() {
        var xml = envelope.xml
            .replace(IDENTIFIER, hdr.Identifier) // header
            .replace(IDENTIFIER, hdr.Identifier) // maybe body
            .replace(TIMESTAMP, time); // header
        s.add('add document ' + hdr.Identifier,
            s.docDocument(hdr.SchemaName, hdr.Identifier),
            xml,
            receiver
        );
    }

    hdr.TimeStamp = time;
    if (hdr.Identifier === IDENTIFIER) {
        if (envelope.header.SchemaName == 'MediaMetadata') {
            // expects fileName, mimeType
            log('save image');
            log(body);
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
            s.docDocument(hdr.SchemaName, hdr.Identifier),
            stamped,
            receiver
        );
    }
};
