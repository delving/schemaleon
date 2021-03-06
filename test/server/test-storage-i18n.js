'use strict';

var testUtil = require('./testutil');

function log(message) {
    console.log(message);
}

exports.createDatabase = testUtil.createDatabase;

exports.testFetch = function (test) {
    test.expect(1);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
//        log("fetched:\n" + xml);
        test.done();
    });
};

exports.testSetLabel = function (test) {
    test.expect(1);
    testUtil.storage.I18N.setLabel('en', 'EditExplanation', 'Edit that explanation, dude!', function (result) {
        test.ok(result, "problem adding label");
        test.done();
    });
};

exports.testAfterSetLabel = function (test) {
    test.expect(2);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
        test.ok(xml.indexOf('dude') > 0, 'No dude appears');
//        console.log("fetched:\n" + xml);
        test.done();
    });
};

exports.testSetLabelAgain = function (test) {
    test.expect(1);
    testUtil.storage.I18N.setLabel('en', 'EditExplanation', 'Edit that explanation, babe!', function (ok) {
        test.ok(ok, "problem adding label");
        test.done();
    });
};

exports.testAfterSetLabelAgain = function (test) {
    test.expect(2);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
        test.ok(xml, "no xml");
        test.ok(xml.indexOf('babe') > 0, 'No babe appears');
//        console.log("fetched:\n" + xml);
        test.done();
    });
};

exports.testSetElementTitle = function (test) {
    test.expect(1);
    testUtil.storage.I18N.setElementTitle('en', 'Identifier', "ID00001", function (ok) {
        test.ok(ok, 'Problem setting element title');
        test.done();
    });
};

exports.testAfterSetElementTitle = function (test) {
    test.expect(2);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
//        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.indexOf('ID00001') > 0, 'No identifier appears');
        test.done();
    });
};

exports.testSetElementTitleAgain = function (test) {
    test.expect(1);
    testUtil.storage.I18N.setElementTitle('en', 'Identifier', "ID00002", function (ok) {

        test.ok(ok, 'Problem setting element title');
        test.done();
    });
};

exports.testAfterSetElementTitleAgain = function (test) {
    test.expect(2);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
//        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.indexOf('ID00002') > 0, 'No identifier appears');
        test.done();
    });
};

exports.testSetElementDoc = function (test) {
    test.expect(1);
    testUtil.storage.I18N.setElementDoc('en', "Identifier", "Some \"nasty\" <documentation/> for y'all.", function(ok) {
        test.ok(ok, 'Problem setting element doc');
        test.done();
    });
};

exports.testAfterSetElementDoc = function (test) {
    test.expect(3);
    testUtil.storage.I18N.getLanguage('en', function (xml) {
//        console.log("fetched:\n" + xml);
        test.ok(xml, "no xml");
        test.ok(xml.indexOf('ID00002') > 0, 'No identifier appears');
        test.ok(xml.indexOf('documentation') > 0, 'No doc appears');
        test.done();
    });
};

exports.dropDatabase = testUtil.dropDatabase;