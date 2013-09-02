'use strict';

var fs = require('fs');
var _ = require('underscore');
var Storage = require('../../server/storage');
var util = require('../../server/util');

var storage = null;

function log(message) {
//    console.log(message);
}

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', '/tmp', function (s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

var profile = {
    isPublic: false,
    firstName: 'Oscr',
    lastName: 'Wild',
    username: 'oscr',
    email: 'oscr@delving.eu',
    websites: []
};

var userIdentifier = '?';

exports.testCreateThenGet = function (test) {
    test.expect(3);
    log('get or create user');
    storage.Person.getOrCreateUser(profile, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created user:\n" + createdXml);
        storage.Person.getOrCreateUser(profile, function (fetchedXml) {
            test.ok(fetchedXml, "no fetchedXml");
            log("fetched user again:\n" + fetchedXml);
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            userIdentifier = util.getFromXml(fetchedXml, "Identifier");
            log("user identifier:" + userIdentifier);
            test.done();
        });
    });
};

var profile2 = {
    isPublic: false,
    firstName: 'Olivia',
    lastName: 'Wild',
    username: 'ow',
    email: 'liv@delving.eu'
};

exports.testCreateAgain = function (test) {
    test.expect(1);
    storage.Person.getOrCreateUser(profile2, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created second user:\n" + createdXml);
        test.done();
    });
};

var oscrGroupIdentifier = '?';

exports.testFetchGroupsFirstTime = function (test) {
    test.expect(2);
    storage.Person.getAllGroups(function (xml) {
        test.ok(xml, "No xml");
//        console.log(xml);
        test.ok(xml.indexOf("OSCR") > 0, "Missing default OSCR group");
        oscrGroupIdentifier = util.getFromXml(xml, "Identifier");
        test.done();
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
        groupIdentifier = util.getFromXml(createdXml, "Identifier");
        log("group identifier:" + groupIdentifier);
        log("created group:\n" + createdXml);
        storage.Person.getGroup(groupIdentifier, function (fetchedXml) {
            log("fetched group:\n" + fetchedXml);
            test.ok(fetchedXml, "no fetchedXml");
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            test.done();
        });
    });
};

exports.testSearchGroups = function (test) {
    test.expect(1);
    storage.Person.getGroups('dorm', function (fetchedXml) {
        test.ok(fetchedXml, "no fetchedXml");
        log("found groups:\n" + fetchedXml);
        test.done();
    });
};

var group2 = {
    Name: 'History Club',
    Address: 'Brabant'
};

exports.testSaveGroupAgain = function (test) {
    test.expect(1);
    storage.Person.saveGroup(group2, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created group:\n" + createdXml);
        test.done();
    });
};

exports.testSearchGroupsAgain = function (test) {
    test.expect(5);
    storage.Person.getGroups('dorm', function (dormXml) {
        test.ok(dormXml, "no dormXml");
        test.ok(dormXml.indexOf('Benidorm') > 0, 'Missing result');
        log("fetched dorm groups:\n" + dormXml);
        storage.Person.getGroups('hISTo', function (histoXml) {
            test.ok(histoXml, "no histoXml");
            log("fetched hISTo groups:\n" + histoXml);
            test.ok(histoXml.indexOf('Brabant') > 0, 'Missing result');
            test.ok(histoXml.indexOf('Benidorm') < 0, 'Too many results');
            test.done();
        });
    });
};

exports.testAddMembership = function (test) {
    test.expect(1);
    storage.Person.addUserToGroup(userIdentifier, 'Member', groupIdentifier, function (userXml) {
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
        '    <username>oscr</username>\n' +
        '    <email>oscr@delving.eu</email>\n' +
        '  </Profile>\n' +
        '  <Memberships>\n' +
        '    <Membership>\n' +
        '      <GroupIdentifier>' + oscrGroupIdentifier + '</GroupIdentifier>\n' +
        '      <Role>Administrator</Role>\n' +
        '    </Membership>\n' +
        '    <Membership>\n' +
        '      <GroupIdentifier>' + groupIdentifier + '</GroupIdentifier>\n' +
        '      <Role>Member</Role>\n' +
        '    </Membership>\n' +
        '  </Memberships>\n' +
        '</User>';

    test.expect(2);
    storage.Person.addUserToGroup(userIdentifier, 'Member', oscrGroupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userXml = (_.filter(userXml.split('\n'), function (line) {
            return !line.match(/SaveTime/);
        })).join('\n');
        log(userXml);
        log(expectedUserXml);
        test.equal(userXml, expectedUserXml, "xml mismatch!");
        log("added user to group:\n" + userXml);
        test.done();
    });
};

exports.testUsersInGroup = function (test) {
    test.expect(1);
    storage.Person.getUsersInGroup(groupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log("users in group group:\n" + userXml);
        test.done();
    });
};

exports.testSearchUsers = function (test) {
    test.expect(3);
    storage.Person.getUsers('ow', function (userXml) {
        test.ok(userXml, "no userXml");
        log("users matching 'ow':\n" + userXml);
        test.ok(userXml.indexOf('Olivia') > 0, 'Olivia not present');
        test.ok(userXml.indexOf('Oscr') < 0, 'Oscr not absent');
        test.done();
    });
};

exports.testRemoveMembership = function (test) {
    var expectedUserXml = '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Profile>\n' +
        '    <firstName>Oscr</firstName>\n' +
        '    <lastName>Wild</lastName>\n' +
        '    <username>oscr</username>\n' +
        '    <email>oscr@delving.eu</email>\n' +
        '  </Profile>\n' +
        '  <Memberships>\n' +
        '    <Membership>\n' +
        '      <GroupIdentifier>'+oscrGroupIdentifier+'</GroupIdentifier>\n' +
        '      <Role>Administrator</Role>\n' +
        '    </Membership>\n' +
        '  </Memberships>\n' +
        '</User>';

    test.expect(2);
    storage.Person.removeUserFromGroup(userIdentifier, 'Member', groupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userXml = (_.filter(userXml.split('\n'), function (line) {
            return !line.match(/SaveTime/);
        })).join('\n');
        test.equal(userXml, expectedUserXml, "xml mismatch!");
        log("remove user from group:\n" + userXml);
        test.done();
    });
};

exports.testStatistics = function(test) {
    test.expect(1);
    storage.getStatistics(function(s) {
        test.ok(s, "No stats");
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
