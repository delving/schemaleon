'use strict';

module.exports = Vocab;

function Vocab(storage) {
    this.storage = storage;
}

var P = Vocab.prototype;

function log(message) {
//    console.log(message);
}

P.getVocabularySchema = function (vocabName, receiver) {
    var s = this.storage;
    var query = [
        '<' + vocabName + '>',
        '  <Entry>' +
            '  <Label/>' +
            '  <ID/>' +
            '   { ' +
            "     doc('" + s.database + "/Schemas.xml')/Schemas/Vocabulary/" + vocabName + "/*" +
            '   }',
        '  </Entry>',
        '</' + vocabName + '>'
    ];
    s.query(query, 'get vocabulary schema ' + vocabName, receiver);
};

P.createVocabulary = function (vocabName, entryXml, receiver) {
    var s = this.storage;
    var freshVocab = "<Entries>" + entryXml + "</Entries>";
    s.add(s.vocabDocument(vocabName), freshVocab, 'create vocabulary ' + vocabName, function (result) {
        if (result) {
//            console.log("Created vocabulary " + vocabName);
            receiver(entryXml); // maybe use the result instead?
        }
        else {
            receiver(null);
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
        s.update(query, null, function (result) {
            if (result) {
                receiver(entryXml); // use the result?
            }
            else {
                s.Vocab.createVocabulary(vocabName, entryXml, receiver);
            }
        });
    }
    else {
        entry.ID = s.generateVocabId();
        entryXml = s.objectToXml(entry, 'Entry');
        query = "insert node (" + entryXml + ") into " + s.vocabPath(vocabName);
        s.update(query, null, function (result) {
            if (result) {
                receiver(entryXml); // use the result?
            }
            else {
                s.Vocab.createVocabulary(vocabName, entryXml, receiver);
            }
        });
    }
};

P.getVocabularyEntries = function (vocabName, search, receiver) {
    var s = this.storage;
    var query = [
        '<Entries>',
        '    { ' + s.vocabPath(vocabName) + "/Entry[contains(lower-case(Label), lower-case(" + s.quote(search) + "))] }",
        '</Entries>'
    ];
    s.query(query, null, function (result) {
        if (result) {
            receiver(result);
        }
        else {
            // todo: make sure there's not one already and the problem was something else
            s.Vocab.createVocabulary(vocabName, '', receiver);
        }
    });
};
