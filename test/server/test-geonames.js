'use strict';

var geonames = require('../../server/geonames');

exports.testQuery = function (test) {
    test.expect(1);
    geonames('eindhoven', function(res) {
        test.ok(true, "made it");
        console.log('resp');
        console.log(res);
        test.done();
    });
};

