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
    var contents = fs.readFileSync('test/data/DocumentSchemas.xml', 'utf8');
    storage.session.add('/DocumentSchemas', contents, function (error, reply) {
        if (reply.ok) {
            console.log("Preloaded document schemas");
            test.done();
        }
        else {
            throw error;
        }
    });
};

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.getDocumentSchema('Photograph', function (xml) {
        test.ok(xml, "no xml");
        console.log("fetched:\n" + xml);
        test.ok(xml[0].indexOf('<Photograph>') == 0, "Didn't retrieve");
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
