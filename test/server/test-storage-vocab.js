'use strict';

var fs = require('fs');
var storage = require('../../server/storage');

exports.createDatabase = function (test) {
    console.log("create database");
    test.expect(1);
    storage.session.execute('create db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem creating database');
        console.log("created oscrtest");
        test.done();
    });
};

exports.fillSchemas = function (test) {
    var contents = fs.readFileSync('test/data/VocabularySchemas.xml', 'utf8');
    storage.session.add('/VocabularySchemas.xml', contents, function (error, reply) {
        if (reply.ok) {
            console.log("Preloaded vocabulary schemas");
            test.done();
        }
        else {
            throw error;
        }
    });
};

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.getVocabularySchema('PhotoType', function (xml) {
        test.ok(xml, "no xml");
        console.log("fetched:\n" + xml);
        test.ok(xml[0].indexOf('<PhotoType') == 0, "Didn't retrieve");
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
    storage.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
        console.log("added:\n" + xml);
        test.done();
    });
};

exports.testAddEntry2 = function (test) {
    test.expect(1);
    var entry = {
        Label: "Pokey",
        URI: "http://pokey.com"
    };
    storage.addVocabularyEntry('PhotoType', entry, function (xml) {
        test.ok(xml, "no xml");
        console.log("added:\n" + xml);
        test.done();
    });
};

exports.testFetchEntry = function(test) {
    test.expect(1);
    storage.getVocabularyEntries('PhotoType', 'y', function(xml) {
        test.ok(xml, "no xml");
        console.log("fetched:\n" + xml);
        test.done();
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        console.log("dropped oscrtest");
        test.done();
    });
};
