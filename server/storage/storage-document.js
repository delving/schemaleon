'use strict';

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

var P = Document.prototype;

P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    var query = s.query(s.docSchemasPath() + schemaName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No document schema found with name ' + schemaName;
        }
    });
};

P.getDocumentList = function (schemaName, receiver) {
    var s = this.storage;
    var query = [
        '<Headers>',
        '    { ' + s.docCollection(schemaName) + '/Header }',
        '</Headers>'
    ];
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.getDocument = function (schemaName, identifier, receiver) { // todo: find usages
    var s = this.storage;
    var query = s.docPath(schemaName, identifier);
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.saveDocument = function (envelope, receiver) {
    function addDocument() {
        var header = envelope.header;
        var withIdentifier = envelope.xml.replace(IDENTIFIER, header.Identifier);
        var withTimesStamp = withIdentifier.replace(TIMESTAMP, time);
        console.log("addDocument "+ header.SchemaName +' ' + header.Identifier)
        s.add(s.docDocument(header.SchemaName, header.Identifier), withTimesStamp, function (error, reply) {
            if (reply.ok) {
                receiver(header);
            }
            else {
                throw error + "\n" + query;
            }
        });
    }

    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    envelope.header.TimeStamp = time;

    if (envelope.header.Identifier === IDENTIFIER) {
        if (envelope.header.DigitalObject) {
            // expects fileName, mimeType
            console.log('save image');
            console.log(envelope.header.DigitalObject);
            s.Image.saveImage(envelope.header.DigitalObject, function (fileName) {
                envelope.header.Identifier = fileName;
                addDocument();
            });
        }
        else {
            envelope.header.Identifier = s.generateDocumentId();
            addDocument();
        }
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        var header = envelope.header;
        s.replace(s.docDocument(header.SchemaName, header.Identifier), stamped, function (error, reply) {
            if (reply.ok) {
                receiver(header);
            }
            else {
                throw "Unable to replace " + s.docDocument(header.SchemaName, header.Identifier);
            }
        });
    }
};
