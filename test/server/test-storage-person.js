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
    Storage('schemaleontest', '/tmp', function (s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

var profile = {
    isPublic: false,
    firstName: 'Oscar',
    lastName: 'Phoenix',
    username: 'schemaleon',
    email: 'schemaleon@delving.eu',
    websites: []
};

var userIdentifier = '?';

exports.testCreateThenGet = function (test) {
    test.expect(4);
    log('get or create user');
    storage.Person.getOrCreateUser(profile, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created user:\n" + createdXml);
        storage.Person.getOrCreateUser(profile, function (fetchedXml) {
            test.ok(fetchedXml, "no fetchedXml");
            log("fetched user again:\n" + fetchedXml);
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            userIdentifier = util.getFromXml(fetchedXml, "Identifier");
            test.ok(userIdentifier != '?', "user identifier not set");
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

var schemaleonGroupIdentifier = '?';

exports.testFetchGroupsFirstTime = function (test) {
    test.expect(2);
    storage.Person.getAllGroups(function (xml) {
        test.ok(xml, "No xml from getAllGroups!");
//        console.log('get all groups', xml);
        test.ok(xml.indexOf("Schemaleon") > 0, "Missing default Schemaleon group");
        schemaleonGroupIdentifier = util.getFromXml(xml, "Identifier");
        test.done();
    });
};

var group = {
    Name: 'Benidorm Bastards',
    Address: 'Downtown Benidorm'
};

var groupIdentifier = '?';

exports.testSaveAndFetchGroup = function (test) {
    test.expect(4);
    storage.Person.saveGroup(group, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        groupIdentifier = util.getFromXml(createdXml, "Identifier");
        test.ok(groupIdentifier != '?', "group identifier not returned");
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
    storage.Person.getGroups('benidorm bastards', function (xml) {
        log("found groups:\n" + xml);
        test.equals(xml.match(/<Group>/g).length, 1, "Should be one group");
        test.done();
    });
};

exports.testDoubleCreate = function (test) {
    test.expect(1);
    var double = {
        Name: group.Name,
        Address: group.Address
    };
    storage.Person.saveGroup(double, function (createdXml) {
        storage.Person.getGroups('dorm', function (xml) {
            log("found groups:\n" + xml);
            test.equals(xml.match(/<Group>/g).length, 1, "Should still be one group");
            test.done();
        });
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
    storage.Person.getGroups('benidorm bastards', function (dormXml) {
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

var userAfterFirstAdd;

exports.testAddMembership = function (test) {
    test.expect(3);
    test.ok(userIdentifier.length > 1, "no user identifier");
    test.ok(groupIdentifier.length > 1, "no group identifier");
    storage.Person.addUserToGroup(userIdentifier, 'Member', groupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userAfterFirstAdd = userXml;
        log("added user to group:\n" + userXml);
        test.done();
    });
};

exports.testAddMembershipDouble = function (test) {
    test.expect(1);
    storage.Person.addUserToGroup(userIdentifier, 'Administrator', groupIdentifier, function (userXml) {
        test.equals(userXml, userAfterFirstAdd, "should not have changed");
        log("added user to group again:\n" + userXml);
        test.done();
    });
};

exports.testAddAnotherMembership = function (test) {
    var expectedUserXml =
        '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Profile>\n' +
        '    <firstName>Oscar</firstName>\n' +
        '    <lastName>Phoenix</lastName>\n' +
        '    <username>schemaleon</username>\n' +
        '    <email>schemaleon@delving.eu</email>\n' +
        '  </Profile>\n' +
        '  <Membership>\n' +
        '    <GroupIdentifier>' + schemaleonGroupIdentifier + '</GroupIdentifier>\n' +
        '    <Role>Member</Role>\n' +
        '  </Membership>\n' +
        '</User>';

    test.expect(2);
    storage.Person.addUserToGroup(userIdentifier, 'Member', schemaleonGroupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log("add user to group returns user xml "+userXml);
        userXml = (_.filter(userXml.split('\n'), function (line) {
            return !line.match(/SaveTime/);
        })).join('\n');
        log('got', userXml);
        log('expect', expectedUserXml);
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
        test.ok(userXml.indexOf('Oscar') < 0, 'Oscar not absent');
        test.done();
    });
};

exports.testRemoveMembership = function (test) {
    var expectedUserXml =
        '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Profile>\n' +
        '    <firstName>Oscar</firstName>\n' +
        '    <lastName>Phoenix</lastName>\n' +
        '    <username>schemaleon</username>\n' +
        '    <email>schemaleon@delving.eu</email>\n' +
        '  </Profile>\n' +
        '</User>';

    test.expect(2);
    storage.Person.removeUserFromGroup(userIdentifier, schemaleonGroupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userXml = (_.filter(userXml.split('\n'), function (line) {
            return !line.match(/SaveTime/);
        })).join('\n');
        log('got', userXml);
        log('expect', expectedUserXml);
        test.equal(userXml, expectedUserXml, "xml mismatch!");
        log("remove user from group:\n" + userXml);
        test.done();
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db schemaleontest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        storage.session.close(function () {
            test.done();
        });
    });
};
