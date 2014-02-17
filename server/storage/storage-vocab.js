// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

'use strict';

/*

    Here we handle the vocabularies, which is a very free system that creates vocabularies
    on the fly when they are not found.

    Author: Gerald de Jong <gerald@delving.eu>

 */

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

// add an entry to a given vocabulary
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

// get a particular vocabulary entry
P.getVocabularyEntry = function (vocabName, identifier, receiver) {
    var s = this.storage;
    s.query('get vocab entry',
        s.vocabPath(vocabName) + "/Entries/Entry[Identifier=" + util.quote(identifier) + "]",
        receiver
    );
};

// search through a vocabulary for an entry
P.getVocabularyEntries = function (vocabName, search, receiver) {
    var s = this.storage;
    s.query('fetch',
        [
            '<Entries>',
            '    {',
            '    if ('+ s.vocabExists(vocabName) + ')',
            '    then '+ s.vocabPath(vocabName) + "/Entries/Entry[contains(lower-case(Label), lower-case(" + util.quote(search) + "))]",
            '    else ()',
            '    }',
            '</Entries>'
        ],
        function(result) {
            receiver(result);
        }
    );
};

// get an entire vocabulary, all the entries
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
