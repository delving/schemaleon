'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');
var testUtil = require('./testutil');

function log(message) {
//    console.log(message);
}

exports.createDatabase = testUtil.createDatabase;

// i think there used to be schemas for vocabs, but now they're all the same
//exports.testFetchSchema = function (test) {
//    test.expect(2);
//    testUtil.storage.Vocab.getVocabularySchema('PhotoType', function (xml) {
//        test.ok(xml, "no xml");
////        console.log("fetched:\n" + xml);
//        test.ok(xml.indexOf('<PhotoType') == 0, "Didn't retrieve");
//        test.done();
//    });
//};
//
// <PhotoType>
//   <Entry>
//     <Label/>
//     <ID/>
//     <URI/>
//   </Entry>
// </PhotoType>

exports.testAddEntry1 = function (test) {
    test.expect(1);
    var entry = {
        Label: "Gumby",
        URI: "http://gumby.com"
    };
    testUtil.storage.Vocab.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
        log("added:\n" + xml);
        test.done();
    });
};

exports.testAddEntry2 = function (test) {
    test.expect(1);
    var entry = {
        Label: "Pokey",
        URI: "http://pokey.com"
    };
    testUtil.storage.Vocab.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
        log("added:\n" + xml);
        test.done();
    });
};

exports.testFetchEntry = function(test) {
    test.expect(1);
    testUtil.storage.Vocab.getVocabularyEntries('PhotoType', 'y', function(xml) {
        test.ok(xml, "no xml");
        log("fetched:\n" + xml);
        test.done();
    });
};

exports.dropDatabase = testUtil.dropDatabase;
