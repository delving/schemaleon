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
            "  <Entry>{ doc('" + s.database + "/Schemas.xml')/Schemas/Vocabulary/" + vocabName + "/text() }",
                '  <Label/>',
                '  <Identifier/>',
                "  { doc('" + s.database + "/Schemas.xml')/Schemas/Vocabulary/" + vocabName + "/* }",
            '  </Entry>',
            '</' + vocabName + '>'
//            todo: look at this approach
//            '<' + vocabName + '>',
//            "  <Entry>{ " + s.schemaPath() + "/Vocabulary/" + vocabName + "/text() }",
//            '  <Label/>',
//            '  <Identifier/>',
//            "  { "+ s.schemaPath() + "/Vocabulary/" + vocabName + "/* }",
//            '  </Entry>',
//            '</' + vocabName + '>'
    ],
        receiver
    );
};

P.addVocabularyEntry = function (vocabName, entry, receiver) {
    var s = this.storage;
    var vocab = this;
    var self = this;
    var entryPath, entryXml, query;
    if (entry.Identifier) {
        entryPath = s.vocabPath(vocabName) + "/Entries[Identifier=" + util.quote(entry.Identifier) + "]";
        entryXml = util.objectToXml(entry, 'Entry');
        s.update(null,
            "replace value of node " + entryPath + " with " + entryXml,
            function (result) {
                if (result) {
                    receiver(entryXml); // use the result?
                }
                else {
                    receiver(null);
                }
            }
        );
    }
    else {
        entry.Identifier = util.generateVocabId();
        entryXml = util.objectToXml(entry, 'Entry');
        s.update('add vocab entry',
            [
                'if (' + s.vocabExists(vocabName) + ')',
                'then insert node (' + entryXml + ') into ' + s.vocabPath(vocabName) + '/Entries',
                'else '+ s.vocabAdd(vocabName, '<Entries>'+entryXml+'</Entries>')
            ],
            function (result) {
                if (result) {
                    receiver(entryXml); // use the result?
                }
                else {
                    receiver(null);
                }
            }
        );
    }
};

P.getVocabularyEntry = function (vocabName, identifier, receiver) {
    var s = this.storage;
    s.query('get vocab entry',
        s.vocabPath(vocabName) + "/Entries/Entry[Identifier=" + util.quote(identifier) + "]",
        receiver
    );
};

P.getVocabularyEntries = function (vocabName, search, lookup, receiver) {

    function getLookupXml(receiver) {
        if (lookup === 'geonames') { // eventually check a set of names
            var service = require("../" + lookup);
            service.search(search, function (list) {
                var wrap = { Entry: list };
                receiver(util.objectToXml(wrap, "Lookup"));
            })
        }
        else {
            receiver('');
        }
    }

    function doQuery(lookupXml) {
        s.query('fetch',
            [
                '<Entries>',
                '    {',
                '    if ('+ s.vocabExists(vocabName) + ')',
                '    then '+ s.vocabPath(vocabName) + "/Entries/Entry[contains(lower-case(Label), lower-case(" + util.quote(search) + "))]",
                '    else ()',
                '    }',
                lookupXml,
                '</Entries>'
            ],
            function(result) {
//                console.log('doQuery result');
//                console.log(result);
                receiver(result);
            }
        );
    }

    var s = this.storage;
    if (lookup) {
        getLookupXml(function (lookupXml) {
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
        s.vocabPath(vocabName) + '/Entries',
        function (result) {
            if (result) {
                receiver(result);
            }
            else {
                receiver('<Entries/>');
            }
        }
    );
};
