'use strict';

var _ = require('underscore');
var util = require('../util');

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
    s.query('get vocabulary schema ' + vocabName,
        [
            '<' + vocabName + '>',
            "  <Entry>{ doc('" + s.database + "/Schemas.xml')/Schemas/Vocabulary/" + vocabName + "/text() }" +
                '  <Label/>' +
                '  <Identifier/>' +
                '   { ' +
                "     doc('" + s.database + "/Schemas.xml')/Schemas/Vocabulary/" + vocabName + "/*" +
                '   }',
            '  </Entry>',
            '</' + vocabName + '>'
        ],
        receiver
    );
};

P.createVocabulary = function (vocabName, entryXml, receiver) {
    var s = this.storage;
    var freshVocab = "<Entries>" + entryXml + "</Entries>";
    s.add('create vocabulary ' + vocabName,
        s.vocabDocument(vocabName),
        freshVocab,
        function (result) {
            if (result) {
//            console.log("Created vocabulary " + vocabName);
                receiver(entryXml); // maybe use the result instead?
            }
            else {
                receiver(null);
            }
        }
    );
};

P.addVocabularyEntry = function (vocabName, entry, receiver) {
    var s = this.storage;
    var vocab = this;
    var self = this;
    var entryPath, entryXml, query;
    if (entry.Identifier) {
        entryPath = s.vocabPath(vocabName) + "[Identifier=" + util.quote(entry.Identifier) + "]";
        entryXml = util.objectToXml(entry, 'Entry');
        s.update(null,
            "replace value of node " + entryPath + " with " + entryXml,
            function (result) {
                if (result) {
                    receiver(entryXml); // use the result?
                }
                else {
                    s.Vocab.createVocabulary(vocabName, entryXml, receiver);
                }
            }
        );
    }
    else {
        entry.Identifier = s.ID.generateVocabId();
        entryXml = util.objectToXml(entry, 'Entry');
        s.update(null,
            "insert node (" + entryXml + ") into " + s.vocabPath(vocabName),
            function (result) {
                if (result) {
                    receiver(entryXml); // use the result?
                }
                else {
                    s.Vocab.createVocabulary(vocabName, entryXml, receiver);
                }
            }
        );
    }
};

P.getVocabularyEntry = function (vocabName, identifier, receiver) {
    var s = this.storage;
    s.query(null,
        s.vocabPath(vocabName) + "/Entry[Identifier=" + util.quote(identifier) + "]",
        receiver
    );
};

P.getVocabularyEntries = function (vocabName, search, lookup, receiver) {

    function getLookupXml(receiver) {
        if (lookup === 'geonames') {
            var service = require("../"+lookup);
            service.search(search, function (list) {
                var wrap = { Entry: list };
                receiver(util.objectToXml(wrap, "Lookup"));
            })
        }
        else {
            console.warn('No lookup for '+lookup);
            receiver('');
        }
    }

    function doQuery(lookupXml) {
        s.query('fetch',
            [
                '<Entries>',
                '    { ' + s.vocabPath(vocabName) + "/Entry[contains(lower-case(Label), lower-case(" + util.quote(search) + "))] }",
                lookupXml,
                '</Entries>'
            ],
            function (result) {
                if (result) {
                    receiver(result);
                }
                else {
                    console.warn('creating vocabulary '+vocabName);
                    s.Vocab.createVocabulary(vocabName, '', receiver);
                }
            }
        );
    }

    var s = this.storage;
    if (lookup) {
        getLookupXml(function(lookupXml) {
//            console.log('geonames lookup xml '+lookupXml);
            doQuery(lookupXml);
        })
    }
    else {
        doQuery('');
    }
};

P.getVocabulary = function (vocabName, receiver) {
    var s = this.storage;
    s.query(null,
        s.vocabPath(vocabName),
        function (result) {
            if (result) {
                receiver(result);
            }
            else {
                s.Vocab.createVocabulary(vocabName, '', receiver);
            }
        }
    );
};
