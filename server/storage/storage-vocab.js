'use strict';

module.exports = Vocab;

function Vocab(storage) {
    this.storage = storage;
}

var P = Vocab.prototype;

P.getVocabularySchema = function (vocabName, receiver) {
    var s = this.storage;
    var query = s.query("doc('" + s.database + "/VocabularySchemas.xml')/VocabularySchemas/" + vocabName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No vocabulary schema found with name ' + vocabName;
        }
    });
};

P.createVocabulary = function (vocabName, entryXml, receiver) {
    var s = this.storage;
    var freshVocab = "<Entries>" + entryXml + "</Entries>";
    s.add(s.vocabDocument(vocabName), freshVocab, function (error, reply) {
        if (reply.ok) {
//            console.log("Created vocabulary " + vocabName);
            receiver(entryXml);
        }
        else {
            throw 'Unable to create vocabulary ' + vocabName + " with entry " + entryXml;
        }
    });
};

P.addVocabularyEntry = function (vocabName, entry, receiver) {
    var s = this.storage;
    var vocab = this;
    var self = this;
    var entryPath, entryXml, query;
    if (entry.ID) {
        entryPath = s.vocabPath(vocabName) + "[ID=" + s.quote(entry.ID) + "]";
        entryXml = s.objectToXml(entry, 'Entry');
        query = "replace value of node " + entryPath + " with " + entryXml;
        s.xquery(query, function (error, reply) {
            if (reply.ok) {
                receiver(entryXml);
            }
            else {
                s.createVocabulary(vocabName, entryXml, function (xml) {
                    receiver(xml);
                });
            }
        });
    }
    else {
        entry.ID = s.generateVocabId();
        entryXml = s.objectToXml(entry, 'Entry');
        query = "insert node " + entryXml + " into " + s.vocabPath(vocabName);
        s.xquery(query, function (error, reply) {
            if (reply.ok) {
                receiver(entryXml);
            }
            else {
                vocab.createVocabulary(vocabName, entryXml, function (xml) {
                    receiver(xml);
                });
            }
        });
    }
};

P.getVocabularyEntries = function (vocabName, search, receiver) {
    var s = this.storage;
    var query = s.vocabPath(vocabName) + "/Entry[contains(lower-case(Label), " + s.quote(search) + ")]";
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            // todo: make sure there's not one already and the problem was something else
            s.createVocabulary(vocabName, '', function (xml) {
                receiver('');
            });
        }
    });
};
