'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var util = require('../../server/util');
var testUtil = require('./testutil');

function log(message) {
//    console.log(message);
}

exports.createDatabase = testUtil.createDatabase;

exports.testCreateGodUser = function(test) {
    test.expect(1);
    testUtil.storage.Person.authenticateUser("deus", "infinity", function(xml) {
        test.ok(xml, "Can't authenticate top user");
//        console.log(xml);
        test.done();
    });
};

var userIdentifier = '?';

exports.testSetProfile = function(test) {
    test.expect(2);
    testUtil.storage.Person.authenticateUser("deus", "infinity", function(xml) {
        test.ok(xml, "Can't authenticate top user a second time");
        userIdentifier = util.getFromXml(xml, "Identifier");
        var profile = {
            FirstName: "Deus",
            LastName: "No",
            EMail: "deus@heaven.edu"
        };
        testUtil.storage.Person.setProfile(userIdentifier, profile, function(xmlAfter) {
//                console.log("xmlAfter="+xmlAfter);
            var firstName = util.getFromXml(xmlAfter, "FirstName");
            test.ok(firstName == "Deus", "Profile not added");
            test.done();
        });
    });
};

exports.testSetProfileAgain = function(test) {
    test.expect(2);
    testUtil.storage.Person.authenticateUser("deus", "infinity", function(xml) {
        test.ok(xml, "Can't authenticate top user a second time");
        userIdentifier = util.getFromXml(xml, "Identifier");
        var profile = {
            FirstName: "Deus",
            LastName: "Yes",
            EMail: "deus@heaven.edu"
        };
        testUtil.storage.Person.setProfile(userIdentifier, profile, function(xmlAfter) {
//                console.log("xmlAfter="+xmlAfter);
            var firstName = util.getFromXml(xmlAfter, "LastName");
            test.ok(firstName == "Yes", "Profile not changed");
            test.done();
        });
    });
};

var schemaleonGroupIdentifier = '?';

exports.testFetchGroupsFirstTime = function (test) {
    test.expect(2);
    testUtil.storage.Person.getAllGroups(function (xml) {
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
    testUtil.storage.Person.saveGroup(group, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        groupIdentifier = util.getFromXml(createdXml, "Identifier");
        test.ok(groupIdentifier != '?', "group identifier not returned");
//        log("group identifier:" + groupIdentifier);
//        log("created group:\n" + createdXml);
        testUtil.storage.Person.getGroup(groupIdentifier, function (fetchedXml) {
//            log("fetched group:\n" + fetchedXml);
            test.ok(fetchedXml, "no fetchedXml");
            test.equal(createdXml, fetchedXml, "Fetched was different!");
            test.done();
        });
    });
};

exports.testSearchGroups = function (test) {
    test.expect(1);
    testUtil.storage.Person.searchGroups('Benidorm', function (xml) {
        log("idorm:\n" + xml);
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
    testUtil.storage.Person.saveGroup(double, function (createdXml) {
        testUtil.storage.Person.searchGroups('Bastards', function (xml) {
//            log("found groups:\n" + xml);
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
    testUtil.storage.Person.saveGroup(group2, function (createdXml) {
        test.ok(createdXml, "no createdXml");
        log("created group:\n" + createdXml);
        test.done();
    });
};

exports.testSearchGroupsAgain = function (test) {
    test.expect(5);
    testUtil.storage.Person.searchGroups('Bastards', function (bastards) {
        test.ok(bastards, "no bastards");
        test.ok(bastards.indexOf('Benidorm') > 0, 'Missing result');
        log("fetched Bastards groups:\n" + bastards);
        testUtil.storage.Person.searchGroups('Brabant', function (brabant) {
            test.ok(brabant, "no Brabant");
            log("fetched Brabant groups:\n" + brabant);
            test.ok(brabant.indexOf('Brabant') > 0, 'Missing result');
            test.ok(brabant.indexOf('Benidorm') < 0, 'Too many results');
            test.done();
        });
    });
};

var userAfterFirstAdd;

exports.testAddMembership = function (test) {
    test.expect(3);
    test.ok(userIdentifier.length > 1, "no user identifier");
    test.ok(groupIdentifier.length > 1, "no group identifier");
    testUtil.storage.Person.addUserToGroup(userIdentifier, 'Member', groupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userAfterFirstAdd = userXml;
        log("added user to group:\n" + userXml);
        test.done();
    });
};

exports.testAddMembershipDouble = function (test) {
    test.expect(1);
    testUtil.storage.Person.addUserToGroup(userIdentifier, 'Administrator', groupIdentifier, function (userXml) {
        test.equals(userXml, userAfterFirstAdd, "should not have changed");
        log("added user to group again:\n" + userXml);
        test.done();
    });
};

exports.testAddAnotherMembership = function (test) {
    var expectedUserXml =
        '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Credentials>\n' +
        '    <Username>deus</Username>\n' +
        '    <PasswordHash>infinity</PasswordHash>\n' +
        '  </Credentials>\n' +
        '  <Membership>\n' +
        '    <GroupIdentifier>' + schemaleonGroupIdentifier + '</GroupIdentifier>\n' +
        '    <Role>Member</Role>\n' +
        '  </Membership>\n' +
        '  <Profile>\n' +
        '    <FirstName>Deus</FirstName>\n' +
        '    <LastName>Yes</LastName>\n' +
        '    <EMail>deus@heaven.edu</EMail>\n' +
        '  </Profile>\n' +
        '</User>';

    test.expect(2);
    testUtil.storage.Person.addUserToGroup(userIdentifier, 'Member', schemaleonGroupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log("add user to group returns user xml "+userXml);
        var withoutSaveTime = _.filter(userXml.split('\n'), function (line) {
            return !line.match(/.*SaveTime.*/);
        }).join('\n');
//        log('got\n' + withoutSaveTime);
//        log('expect\n' + expectedUserXml);
        test.equal(withoutSaveTime, expectedUserXml, "xml mismatch!");
        log("added user to group:\n" + withoutSaveTime);
        test.done();
    });
};

exports.testUsersInGroup = function (test) {
    test.expect(1);
    testUtil.storage.Person.getUsersInGroup(groupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        log("users in group group:\n" + userXml);
        test.done();
    });
};

exports.testSearchUsers = function (test) {
    test.expect(3);
    testUtil.storage.Person.searchUsers('Deus', function (userXml) {
        test.ok(userXml, "no userXml");
        log("users matching:\n" + userXml);
        test.ok(userXml.indexOf('Deus') > 0, 'not present');
        // todo: another user?
        test.ok(userXml.indexOf('Somebody') < 0, 'not absent');
        test.done();
    });
};
//
exports.testRemoveMembership = function (test) {
    var expectedUserXml =
        '<User>\n' +
        '  <Identifier>' + userIdentifier + '</Identifier>\n' +
        '  <Credentials>\n' +
        '    <Username>deus</Username>\n' +
        '    <PasswordHash>infinity</PasswordHash>\n' +
        '  </Credentials>\n' +
        '  <Profile>\n' +
        '    <FirstName>Deus</FirstName>\n' +
        '    <LastName>Yes</LastName>\n' +
        '    <EMail>deus@heaven.edu</EMail>\n' +
        '  </Profile>\n' +
        '</User>';

    test.expect(2);
    testUtil.storage.Person.removeUserFromGroup(userIdentifier, schemaleonGroupIdentifier, function (userXml) {
        test.ok(userXml, "no userXml");
        userXml = (_.filter(userXml.split('\n'), function (line) {
            return !line.match(/SaveTime/);
        })).join('\n');
        log('got\n'+ userXml);
        log('expect\n'+ expectedUserXml);
        test.equal(userXml, expectedUserXml, "xml mismatch!");
        log("remove user from group:\n" + userXml);
        test.done();
    });
};

exports.dropDatabase = testUtil.dropDatabase;
