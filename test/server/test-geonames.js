'use strict';

var _ = require('underscore');
var geonames = require('../../server/geonames');

function log(message) {
//    console.log(message);
}

exports.testQuery = function (test) {
    log('starting');
    test.expect(6);
    geonames.search('eindhoven', function (res) {
        test.equals(res.length, 2, 'Expected two results');
        var eind = res[0];
        log(eind);
        test.equals(eind.Label, 'Eindhoven, Noord-Brabant, Nederland');
        test.ok(_.isNumber(eind.Identifier), 'Not a number');
        log('id ' + eind.Identifier);
        log('label ' + eind.Label);
        log('uri ' + eind.URI);
        test.equals(eind.URI, 'http://sws.geonames.org/' + eind.Identifier + '/', 'Unexpected URI');
        test.equals(eind.Label, 'Eindhoven, Noord-Brabant, Nederland', 'Unexpected Label');
        geonames.fetchUrl(eind.URI, function (city) {
            log('city');
            log(city);
            test.ok(city.indexOf('eindhoven.html') > 0, 'city not found!');
            test.done();
        });
    });
};

