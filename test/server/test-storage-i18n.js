'use strict';

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

exports.testSetElementTitle = function (test) {
    test.expect(1);
    storage.setElementTitle('en', 'Identifier', "ID00001", function (ok) {
        test.ok(ok, 'Problem setting element title');
        test.done();
    });
};

exports.testAfterSetElementTitle = function (test) {
    test.expect(3);
    storage.getLanguage('en', function (xml) {
        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.length == 1, "should be one entry");
        test.ok(xml[0].indexOf('ID00001') > 0, 'No identifier appears');
        test.done();
    });
};

exports.testSetElementTitleAgain = function (test) {
    test.expect(1);
    storage.setElementTitle('en', 'Identifier', "ID00002", function (ok) {
        test.ok(ok, 'Problem setting element title');
        test.done();
    });
};

exports.testAfterSetElementTitleAgain = function (test) {
    test.expect(3);
    storage.getLanguage('en', function (xml) {
        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.length == 1, "should be one entry");
        test.ok(xml[0].indexOf('ID00002') > 0, 'No identifier appears');
        test.done();
    });
};

exports.testSetElementDoc = function (test) {
    test.expect(1);
    storage.setElementDoc('en', "Identifier", "Some \"nasty\" <documentation/> for y'all.", function(ok) {
        test.ok(ok, 'Problem setting element doc');
        test.done();
    });
};

exports.testAfterSetElementDoc = function (test) {
    test.expect(4);
    storage.getLanguage('en', function (xml) {
        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.length == 1, "should be one entry");
        test.ok(xml[0].indexOf('ID00002') > 0, 'No identifier appears');
        test.ok(xml[0].indexOf('nice documentation') > 0, 'No doc appears');
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
