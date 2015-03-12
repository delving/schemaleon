'use strict';

var fs = require('fs');
var path = require('path');
var Storage = require('../../server/storage');
var util = require('../../server/util');

var homeDir = '/tmp/schemaleon-test';

function log(message) {
    console.log(message);
}

module.exports.createDatabase = function(test) {
    util.deleteRecursive(homeDir);
    fs.mkdirSync(homeDir);
    test.expect(1);
    Storage('schemaleontest', homeDir, function (s) {
        test.ok(s, 'problem creating database');
        module.exports.storage = s;
        test.done();
    });
};

module.exports.dropDatabase = function(test) {
    test.expect(1);
    module.exports.storage.session.execute('drop db schemaleontest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        module.exports.storage.session.close(function () {
            test.done();
        });
    });
};
