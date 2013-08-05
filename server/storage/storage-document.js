'use strict';

module.exports = Document;

function Document(storage) {
    this.storage = storage;
}

Document.prototype.getDocumentSchema = function (schemaName, receiver) {
    var s = this.storage;
    var query = s.session.query("doc('" + s.database + "/DocumentSchemas.xml')/DocumentSchemas/" + schemaName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No document schema found with name ' + schemaName;
        }
    });
};

Document.prototype.getDocumentList = function (receiver) {
    var s = this.storage;
    var query = "xquery collection('" + s.database + "/documents')/Document/Header";
    s.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

Document.prototype.getDocument = function (identifier, receiver) {
    var s = this.storage;
    var query = "xquery " + s.docPath(identifier);
    s.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

Document.prototype.saveDocument = function (body, receiver) {
    var s = this.storage;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    body.header.TimeStamp = time;
    if (body.header.Identifier === IDENTIFIER) {
        var identifier = s.generateId("OSCR-D");
        body.header.Identifier = identifier;
        var withIdentifier = body.xml.replace(IDENTIFIER, identifier);
        var withTimesStamp = withIdentifier.replace(TIMESTAMP, time);
        s.session.add(s.docDocument(identifier), withTimesStamp, function (error, reply) {
            if (reply.ok) {
                receiver(body.header);
            }
            else {
                throw error + "\n" + query;
            }
        });
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = body.xml.replace(TIMESTAMP, time);
        s.session.replace(s.docDocument(body.header.Identifier), stamped, function (error, reply) {
            if (reply.ok) {
                receiver(body.header);
            }
            else {
                throw "Unable to replace " + self.docPath(body.header.Identifier);
            }
        });
    }
};
