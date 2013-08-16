'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');

var storage = null;

function log(message) {
//    console.log(message);
}

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', '/tmp', function(s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.Vocab.getVocabularySchema('PhotoType', function (xml) {
        test.ok(xml, "no xml");
//        console.log("fetched:\n" + xml);
        test.ok(xml.indexOf('<PhotoType') == 0, "Didn't retrieve");
        test.done();
    });
};

/*
 <PhotoType>
   <Entry>
     <Label/>
     <ID/>
     <URI/>
   </Entry>
 </PhotoType>
 */

exports.testAddEntry1 = function (test) {
    test.expect(1);
    var entry = {
        Label: "Gumby",
        URI: "http://gumby.com"
    };
    storage.Vocab.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
//        console.log("added:\n" + xml);
        test.done();
    });
};

exports.testAddEntry2 = function (test) {
    test.expect(1);
    var entry = {
        Label: "Pokey",
        URI: "http://pokey.com"
    };
    storage.Vocab.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
        log("added:\n" + xml);
        test.done();
    });
};

exports.testFetchEntry = function(test) {
    test.expect(1);
    storage.Vocab.getVocabularyEntries('PhotoType', 'y', function(xml) {
        test.ok(xml, "no xml");
        log("fetched:\n" + xml);
        test.done();
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};
