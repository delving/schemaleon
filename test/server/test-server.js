'use strict';

var data = require('../../app/server/fake-data')

exports.testSomething =  function (test) {
    // just a trivial test for show
    test.ok(data.documentTree, "Missing doc tree");
    test.ok(data.vocabResponse, "Missing vocab response");
    test.ok(data.docList, "Missing doc list");
    test.done();
};

