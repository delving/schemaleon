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
    var contents = fs.readFileSync('test/server/VocabularySchemas.xml', 'utf8');
    storage.session.add('/VocabularySchemas', contents, function (error, reply) {
        if (reply.ok) {
            console.log("Preloaded vocabulary schemas");
            test.done();
        }
        else {
            throw error;
        }
    });
};

exports.testFetch = function (test) {
    test.expect(2);
    storage.getVocabularySchema('PhotoType', function (xml) {
        test.ok(xml, "no xml");
        console.log("fetched:\n" + xml);
        test.ok(xml[0].indexOf('<PhotoType') == 0, "Didn't retrieve");
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
