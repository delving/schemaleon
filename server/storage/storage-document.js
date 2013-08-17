'use strict';

var _ = require('underscore');

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
    var query = s.schemaPath() + '/Document/' + schemaName;
    s.query(query, 'get document schema', receiver);
};

P.getAllDocumentHeaders = function (schemaName, receiver) {
    var s = this.storage;
    var query = [
        '<Headers>',
        '    { ' + s.docCollection(schemaName) + '/Document/Header }',
        '</Headers>'
    ];
    s.query(query, 'get all document headers', receiver);
};

P.getAllDocuments = function (schemaName, receiver) {
    var s = this.storage;
    var query = [
        '<Documents>',
        '    {',
        '        for $doc in ' + s.docCollection(schemaName) + '/Document',
        '        order by $doc/Header/TimeStamp descending',
        '        return $doc',
        '    }',
        '</Documents>'
    ];
    s.query(query, 'get all documents', receiver);
};

P.selectDocuments = function (schemaName, search, receiver) {
    var s = this.storage;
    var query = [
        '<Documents>',
        '    { ',
        '        for $doc in ' + s.docCollection(schemaName) + '/Document',
        '        where $doc/Body//*[contains(lower-case(text()), lower-case(' + s.quote(search) + '))]',
        '        order by $doc/Header/TimeStamp descending',
        '        return $doc',
        '    }',
        '</Documents>'
    ];
    s.query(query, 'select documents: ' + search, receiver);
};

P.getDocument = function (schemaName, identifier, receiver) {
    var s = this.storage;
    var query = s.docPath(schemaName, identifier);
    s.query(query, 'get document ' + identifier, receiver);
};

P.saveDocument = function (envelope, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var hdr = _.clone(envelope.header);

    function addDocument() {
        var xml = envelope.xml.replace(IDENTIFIER, hdr.Identifier).replace(TIMESTAMP, time);
        log("addDocument " + hdr.SchemaName + ' ' + hdr.Identifier);
        s.add(s.docDocument(hdr.SchemaName, hdr.Identifier), xml, 'add document ' + hdr.Identifier, receiver);
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
            hdr.Identifier = s.generateDocumentId();
            addDocument();
        }
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        s.replace(s.docDocument(hdr.SchemaName, hdr.Identifier), stamped, 'replace document '+ hdr.Identifier, receiver);
    }
};
