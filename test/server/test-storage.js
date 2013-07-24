'use strict';

var basex = require('basex');
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

exports.testFetch = function (test) {
    test.expect(1);
    storage.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
        console.log("fetched:\n" + xml);
        test.done();
    });
};

exports.testSetLabel = function (test) {
    test.expect(1);
    storage.setLabel('en', 'EditExplanation', 'Edit that explanation, dude!', function (ok) {
        test.ok(ok, "problem adding label");
        test.done();
    });
};

exports.testAfterSetLabel = function (test) {
    test.expect(3);
    storage.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
        test.ok(xml.length == 1, "should be one entry");
        test.ok(xml[0].indexOf('dude') > 0, 'No dude appears');
        console.log("fetched:\n" + xml);
        test.done();
    });
};

exports.testSetLabelAgain = function (test) {
    test.expect(1);
    storage.setLabel('en', 'EditExplanation', 'Edit that explanation, babe!', function (ok) {
        test.ok(ok, "problem adding label");
        test.done();
    });
};

exports.testAfterSetLabelAgain = function (test) {
    test.expect(3);
    storage.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
        test.ok(xml.length == 1, "should be one entry");
        test.ok(xml[0].indexOf('babe') > 0, 'No babe appears');
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
