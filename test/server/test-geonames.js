'use strict';

var _ = require('underscore');
var geonames = require('../../server/geonames');

function log(message) {
//    console.log(message);
}

exports.testQuery = function (test) {
    test.done();
//    log('starting');
//    test.expect(4);
//    geonames.search('eindhoven', function (res) {
//        test.equals(res.length, 2, 'Expected two results');
//        var eind = res[0];
//        log(eind);
//        log('label ' + eind.Label);
//        test.equals(eind.Label, 'Eindhoven, Noord-Brabant, Nederland');
//        log('uri ' + eind.URI);
//        test.equals(eind.Label, 'Eindhoven, Noord-Brabant, Nederland', 'Unexpected Label');
//        geonames.fetchUrl(eind.URI, function (city) {
//            log('city');
//            log(city);
//            test.ok(city.indexOf('eindhoven.html') > 0, 'city not found!');
//            test.done();
//        });
//    });
};

