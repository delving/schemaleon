'use strict';

var http = require('http');

module.exports = function(query, receiver) {
    http.get(
        'http://api.geonames.org/searchJSON?username=delving&name='+query, // todo: escaping?
        function(res) {
            var result = '';
            res.on('data', function(data) {
                result += data;
            });
            res.on('end', function() {
                var object = JSON.parse(result);
                receiver(object);
            })
        }
    ).end();
};

