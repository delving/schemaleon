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

P.getDocumentList = function (receiver) {
    var s = this.storage;
    var query = [
        '<Headers>',
        '    { ' + s.docCollection() + '/Header }',
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

P.getDocument = function (identifier, receiver) {
    var s = this.storage;
    var query = s.docPath(identifier);
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
        var withIdentifier = envelope.xml.replace(IDENTIFIER, envelope.header.Identifier);
        var withTimesStamp = withIdentifier.replace(TIMESTAMP, time);
        s.add(s.docDocument(envelope.header.Identifier), withTimesStamp, function (error, reply) {
            if (reply.ok) {
                receiver(envelope.header);
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
            console.log('header had a digital object');
            // expects fileName, mimeType
            s.Image.saveImage(envelope.header.DigitalObject, function (fileName) {
                envelope.header.Identifier = fileName;
                console.log('saved image ' + fileName);
                addDocument();
            });
        }
        else {
            console.log('header had no digital object');
            envelope.header.Identifier = s.generateDocumentId();
            addDocument();
        }
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = envelope.xml.replace(TIMESTAMP, time);
        s.replace(s.docDocument(envelope.header.Identifier), stamped, function (error, reply) {
            if (reply.ok) {
                receiver(envelope.header);
            }
            else {
                throw "Unable to replace " + self.docPath(envelope.header.Identifier);
            }
        });
    }
};
