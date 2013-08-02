'use strict';

var https = require('https');
var crypto = require('crypto');


exports.testFetch = function (test) {

    var apiQueryParams = {
        "apiToken": "6f941a84-cbed-4140-b0c4-2c6d88a581dd",
        "apiOrgId": "delving",
        "apiNode": "playground"
    };

    var queryParams = [];
    for (var key in apiQueryParams) {
        queryParams.push(key + '=' + apiQueryParams[key]);
    }
    var queryString = queryParams.join('&');

    var username = 'gerald';
    var password = '';

    var sha = crypto.createHash('sha512');
    var hashedPassword = sha.update(new Buffer(password, 'utf-8')).digest('base64');
    console.log('hashed password: '+hashedPassword);

    var hmac = crypto.createHmac('sha1', username);
    var hash = hmac.update(hashedPassword).digest('hex');

    console.log('');
    console.log('hash:');
    console.log(hash);

    var authOptions = {
        method: 'GET',
        host: 'commons.delving.eu',
        port: 443,
        path: '/user/authenticate/' + hash + '?' + queryString
    };

    test.expect(2);
    console.log('authOptions:');
    console.log(authOptions);
    https.request(
        authOptions,
        function (response) {
            test.ok(response.statusCode == 200, "Response not ok, it's " + response.statusCode);
            var profileOptions = {
                method: 'GET',
                host: 'commons.delving.eu',
                port: 443,
                path: '/user/profile/'+username + '?' + queryString
            };
            console.log('profileOptions:');
            console.log(profileOptions);
            https.request(
                profileOptions,
                function (response) {
                    test.ok(response.statusCode == 200, "Response not ok, it's " + response.statusCode);
                    response.on('data', function(data) {
                        var profile = JSON.parse(data);
                        console.log(profile);
                    });
                    response.on('end', function() {
                        test.done();
                    });
                }
            ).end()
        }
    ).end()
};

