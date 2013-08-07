'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');

var storage = null;

function log(message) {
//    console.log(message);
}

function getFromXml(xml, tag) {
    var start = xml.indexOf('<'+tag+'>');
    var end = xml.indexOf('</'+tag+'>');
    if (start > 0 && end > 0) {
        start += tag.length+2;
        return xml.substring(start,end);
    }
    else {
        return '';
    }
}

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', function (s) {
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

var userIdentifier = '?';

exports.testCreateThenGet = function (test) {
    test.expect(3);
    storage.Person.getOrCreateUser(profile, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created user:\n" + createdXml);
        storage.Person.getOrCreateUser(profile, function (fetchedXml) {
            test.ok(fetchedXml, "no fetchedXml");
            log("fetched user again:\n" + fetchedXml);
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            userIdentifier = getFromXml(fetchedXml, "Identifier");
            log("user identifier:" + userIdentifier);
            test.done();
        });
    });
};

var group = {
    Name: 'Benidorm Bastards',
    Address: 'Downtown Benidorm'
};

var groupIdentifier = '?';

exports.testSaveAndFetchGroup = function (test) {
    test.expect(3);
    storage.Person.saveGroup(group, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created group:\n" + createdXml);
        storage.Person.getGroup(group.Identifier, function (fetchedXml) {
            test.ok(fetchedXml, "no createdXml");
            log("fetched group:\n" + fetchedXml);
            groupIdentifier = getFromXml(fetchedXml, "Identifier");
            log("group identifier:" + group.Identifier);
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            test.done();
        });
    });
};

exports.testAddMembership = function (test) {
    test.expect(1);
    storage.Person.addUserRoleToGroup(profile.email, 'Member', group.Identifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log("added user to group:\n" + userXml);
        test.done();
    });
};

exports.testAddAnotherMembership = function (test) {
    var expectedUserXml = '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Profile>\n' +
        '    <firstName>Oscr</firstName>\n' +
        '    <lastName>Wild</lastName>\n' +
        '    <email>oscr@delving.eu</email>\n' +
        '  </Profile>\n' +
        '  <Memberships>\n' +
        '    <Member>\n' +
        '      <Group>' + groupIdentifier + '</Group>\n' +
        '      <Role>Member</Role>\n' +
        '    </Member>\n' +
        '  </Memberships>\n' +
        '</User>';

    test.expect(2);
    storage.Person.addUserRoleToGroup(profile.email, 'Member', group.Identifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log(userXml);
        log(expectedUserXml);
        test.equal(userXml, expectedUserXml, "xml mismatch!");
        log("added user to group:\n" + userXml);
        test.done();
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};
