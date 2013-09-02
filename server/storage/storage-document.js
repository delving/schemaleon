'use strict';

var _ = require('underscore');
var util = require('../util');

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

var P = Document.prototype;

function log(message) {
//    console.log(message);
}

P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get document schema '+schemaName,
        s.schemaPath() + '/Document/' + schemaName,
        receiver
    );
};

P.getAllDocumentHeaders = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get all document headers ' + schemaName,
        [
            '<Headers>',
            '    { ' + s.docCollection(schemaName) + '/Document/Header }',
            '</Headers>'
        ],
        receiver
    );
};

P.getAllDocuments = function (schemaName, receiver) {
    var s = this.storage;
    s.query('get all documents '+schemaName,
        [
            '<Documents>',
            '    {',
            '        for $doc in ' + s.docCollection(schemaName) + '/Document',
            '        order by $doc/Header/TimeStamp descending',
            '        return $doc',
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
            '        for $doc in ' + s.docCollection(schemaName) + '/Document',
            '        where $doc/Body//*[contains(lower-case(text()), lower-case(' + util.quote(search) + '))]',
            '        order by $doc/Header/TimeStamp descending',
            '        return $doc',
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

    function addDocument() {
        var xml = envelope.xml.replace(IDENTIFIER, hdr.Identifier).replace(TIMESTAMP, time);
        s.add('add document ' + hdr.Identifier,
            s.docDocument(hdr.SchemaName, hdr.Identifier),
            xml,
            receiver
        );
    }

    hdr.TimeStamp = time;
    if (hdr.Identifier === IDENTIFIER) {
        if (envelope.header.MediaObject) {
            // expects fileName, mimeType
            log('save image');
            log(hdr.MediaObject);
            s.Media.saveMedia(hdr.MediaObject, function (fileName) {
                hdr.Identifier = fileName;
                addDocument();
            });
        }
        else {
            hdr.Identifier = s.ID.generateDocumentId(hdr.SchemaName);
            addDocument();
        }
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        s.replace('replace document '+ hdr.Identifier,
            s.docDocument(hdr.SchemaName, hdr.Identifier),
            stamped,
            receiver
        );
    }
};
