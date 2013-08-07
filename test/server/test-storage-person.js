'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');

var storage = null;

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', function(s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

var profile = {
    isPublic: false,
    firstName: 'Oscr',
    lastName: 'Wild',
    email: 'oscr@delving.eu',
    websites: []
};

exports.testCreateThenGet = function (test) {
    test.expect(3);
    storage.Person.getOrCreateUser(profile, function(createdXml) {
        test.ok(createdXml, "no createdXml");
//        console.log("created user:\n" + createdXml);
        storage.Person.getOrCreateUser(profile, function(fetchedXml) {
            test.ok(fetchedXml, "no fetchedXml");
//            console.log("fetched user again:\n" + fetchedXml);
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            test.done();
        });
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};
