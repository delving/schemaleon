'use strict';

var _ = require('underscore');

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

var P = Document.prototype;

P.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    var query = s.schemaPath() + "/Document/" + schemaName;
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No document schema found with name ' + schemaName;
        }
    });
};

P.getAllDocumentHeaders = function (schemaName, receiver) {
    var s = this.storage;
    var query = [
        '<Headers>',
        '    { ' + s.docCollection(schemaName) + '/Document/Header }',
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

P.getAllDocuments = function (schemaName, receiver) {
    var s = this.storage;
    var query = [
        '<Documents>',
        '    { ' + s.docCollection(schemaName) + '/Document }',
        '</Documents>'
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

P.selectDocuments = function (schemaName, search, receiver) {
    var s = this.storage;
    var query = [
        '<Documents>',
        '    { ',
        '        for $doc in '+ s.docCollection(schemaName)+'/Document',
        '        where $doc/Body//*[contains(lower-case(text()), lower-case('+ s.quote(search) + '))]',
        '        order by $doc/Header/Timestamp',
        '        return $doc',
        '    }',
        '</Documents>'
    ];
    s.xquery(query, function (error, reply) {
//        console.log(query);
//        console.log(reply);
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            console.log('THROW');
            receiver('');
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
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    var hdr = _.clone(envelope.header);

    function finish() {
//        console.trace('finishing save document');
        receiver(s.objectToXml(hdr, 'Header'));
    }

    function addDocument() {
        var withIdentifier = envelope.xml.replace(IDENTIFIER, hdr.Identifier);
        var withTimesStamp = withIdentifier.replace(TIMESTAMP, time);
//        console.trace("addDocument " + hdr.SchemaName + ' ' + hdr.Identifier);
        s.add(s.docDocument(hdr.SchemaName, hdr.Identifier), withTimesStamp, function (error, reply) {
            if (reply.ok) {
                finish();
            }
            else {
                throw error + "\n" + query;
            }
        });
    }

    hdr.TimeStamp = time;
    if (hdr.Identifier === IDENTIFIER) {
        if (envelope.header.MediaObject) {
            // expects fileName, mimeType
//            console.log('save image');
//            console.log(hdr.MediaObject);
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
        s.replace(s.docDocument(hdr.SchemaName, hdr.Identifier), stamped, function (error, reply) {
            if (reply.ok) {
                finish();
            }
            else {
                throw "Unable to replace " + s.docDocument(hdr.SchemaName, hdr.Identifier);
            }
        });
    }
};
