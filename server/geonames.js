'use strict';

var _ = require('underscore');
var http = require('http');
var util = require('./util');

function transformResponse(list) {
    return _.map(list, function (item) {
        return {
            Label: item.toponymName + ', ' + item.adminName1 + ', ' + item.countryName,
            URI: 'http://sws.geonames.org/' + item.geonameId + '/',
            Latitude: item.lat,
            Longitude: item.lng
        };
    });
}

module.exports.search = function (query, receiver) {
    http.get(
        'http://api.geonames.org/searchJSON?username=delving&featureCode=PPL&lang=nl&name_startsWith=' + encodeURIComponent(query),
        function (res) {
            var result = '';
            res.on('data', function (data) {
                result += data;
            });
            res.on('end', function () {
                var object = JSON.parse(result);
                receiver(transformResponse(object.geonames));
            })
        }
    ).end();
};

module.exports.fetchUrl = function (uri, receiver) {
    http.get(uri,function (res) {
        receiver(res.headers.location);
    }).end();
};

