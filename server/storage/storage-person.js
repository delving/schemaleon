'use strict';

module.exports = Person;

function Person(storage) {
    this.storage = storage;
}

var P = Person.prototype;

function log(message) {
//    console.log(message);
}

/*
 { isPublic: false,
 firstName: 'Gerald',
 lastName: 'de Jong',
 email: 'gerald@delving.eu',
 websites: [] }
 */

P.roles = [
    'Member', 'Administrator'
];

P.getOrCreateUser = function (profile, receiver) {
    var s = this.storage;
    var self = this;
    if (!profile.email) {
        throw new Error('No email in profile');
    }

    function addUser(userObject) {
        var userXml = s.objectToXml(userObject, 'User');
        s.add(s.userDocument(profile.email), userXml, 'add user ' + userXml, receiver);
    }

    function createTestUsers() { //todo: remove for production - creates fake users and groups
        var _ = require('underscore');
        var group = {};
        for (var gr = 0; gr < 4; gr++) {
            group.Name = 'GroupName_' + gr;
            group.Address = 'GroupAdress_' + gr;
            s.Person.saveGroup(_.clone(group), function (result) {
            });
        }
        var profile = {
            isPublic: false,
            websites: []
        };
        for (var user = 0; user < 10; user++) {
            profile.firstName = "FirstName_" + user;
            profile.lastName = "LastName_" + user;
            profile.email = "email_" + user + "@delving.eu";
            // use _.clone to deal with async
            s.Person.getOrCreateUser(_.clone(profile), function (result) {
            });
        }
    }

    s.query(s.userPath(profile.email), null, function (result) {
        if (result) {
            receiver(result);
        }
        else {
            var userObject = {
                Identifier: s.generateUserId(),
                Profile: profile,
                SaveTime: new Date().getTime()
            };
            s.query('count(' + s.userCollection() + ')', 'count users', function (result) {
                if (result === '0') {
                    var oscrGroup = {
                        Name: 'OSCR',
                        Identifier: 'OSCR',
                        SaveTime: new Date().getTime()
                    };
                    self.saveGroup(oscrGroup, function (result) {
                        log('created group ' + result);
                        var groupIdentifier = s.getFromXml(result, 'Identifier');
                        userObject.Memberships = {
                            Member: {
                                Group: groupIdentifier,
                                Role: 'Administrator'
                            }
                        };
                        addUser(userObject);
                        createTestUsers();
                    });
                }
                else {
                    addUser(userObject);
                }
            });
        }
    });
};

P.getUser = function (email, receiver) {
    var s = this.storage;
    var query = s.userPath(email);
    s.query(query, 'get user ' + email, receiver);
};

P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    var query = [
        '<Users>',
        '    { ' + s.userCollection() + '[Memberships/Member/Group = ' + s.quote(identifier) + '] }',
        '</Users>'
    ];
    s.query(query, 'get users in group ' + identifier, receiver);
};

P.getUsers = function (search, receiver) {
    var s = this.storage;
    var query = [
        '<Users>',
        '    { ' + s.userCollection() + '[contains(lower-case(Profile/email), ' + s.quote(search) + ')] }',
        '</Users>'
    ];
    s.query(query, 'get users ' + search, receiver);
};

P.getAllUsers = function (receiver) {
    var s = this.storage;
    var query = [
        '<Users>',
        '    { ' + s.userCollection() + ' }',
        '</Users>'
    ];
    s.query(query, 'get all users', receiver);
};

P.saveGroup = function (group, receiver) {
    var s = this.storage;
    group.SaveTime = new Date().getTime();
    var existing = group.Identifier;
    if (!existing) {
        group.Identifier = s.generateGroupId();
    }
    var groupXml = s.objectToXml(group, "Group");
    if (existing && group.Identifier != 'OSCR') {
        s.replace(s.groupDocument(group.Identifier), groupXml, 'save existing group ' + group.Identifier, receiver);
    }
    else {
        s.add(s.groupDocument(group.Identifier), groupXml, 'add group ' + group.Identifier, receiver);
    }
};

P.getGroups = function (search, receiver) {
    var s = this.storage;
    var query = [
        '<Groups>',
        '    { ' + s.groupCollection() + '[contains(lower-case(Name), lower-case(' + s.quote(search) + '))] }',
        '</Groups>'
    ];
    s.query(query, 'get groups ' + search, receiver);
};

P.getAllGroups = function (receiver) {
    var s = this.storage;
    var query = [
        '<Groups>',
        '    { ' + s.groupCollection() + ' }',
        '</Groups>'
    ];
    s.query(query, 'get all groups', receiver);
};

P.getGroup = function (identifier, receiver) {
    var s = this.storage;
    var query = s.groupPath(identifier);
    s.query(query, 'get group ' + identifier, receiver);
};

P.addUserToGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = [
        'let $user := ' + s.userPath(email),
        'let $mem := ' + '<Member><Group>' + identifier + '</Group><Role>' + role + '</Role></Member>',
        'return',
        'if (exists($user/Memberships/Member[Group=' + s.quote(identifier) + ']))',
        'then ()',
        'else (',
        'if (exists($user/Memberships))',
        'then (insert node $mem into $user/Memberships)',
        'else (insert node <Memberships>{$mem}</Memberships> into $user)',
        ')'
    ];
    s.update(query, 'add user to group ' + email + ' ' + role + ' ' + identifier, function (result) {
        if (result) {
            s.query(s.userPath(email), 're-fetch user ' + email + ' ' + role + ' ' + identifier, receiver);
        }
        else {
            receiver(null);
        }
    });
};

P.removeUserFromGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = 'delete node ' + s.userPath(email) + '/Memberships/Member[Group=' + s.quote(identifier) + ']';
    s.update(query, 'remove user from group ' + email + ' ' + role + ' ' + identifier, function (result) {
        if (result) {
            s.query(s.userPath(email), 're-fetch user after remove membership ' + email + ' ' + role + ' ' + identifier, receiver);
        }
        else {
            receiver(null);
        }
    });
};

