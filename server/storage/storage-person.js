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
        s.add('add user ' + profile.email,
            s.userDocument(profile.email),
            userXml,
            receiver
        );
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

    s.query(null, s.userPath(profile.email), function (result) {
        if (result) {
            receiver(result);
        }
        else {
            var userObject = {
                Identifier: s.generateUserId(),
                Profile: profile,
                SaveTime: new Date().getTime()
            };
            s.query('count users',
                'count(' + s.userCollection() + ')',
                function (result) {
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
                                Membership: [
                                    {
                                        GroupIdentifier: groupIdentifier,
                                        Role: 'Administrator'
                                    }
                                ]
                            };
                            addUser(userObject);
                            createTestUsers();
                        });
                    }
                    else {
                        addUser(userObject);
                    }
                }
            );
        }
    });
};

P.getUser = function (email, receiver) {
    var s = this.storage;
    s.query('get user ' + email,
        s.userPath(email),
        receiver
    );
};

P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    s.query('get users in group ' + identifier,
        [
            '<Users>',
            '    { ' + s.userCollection() + '[Memberships/Membership/GroupIdentifier=' + s.quote(identifier) + '] }',
            '</Users>'
        ],
        receiver
    );
};

P.getUsers = function (search, receiver) {
    var s = this.storage;
    s.query('get users ' + search,
        [
            '<Users>',
            '    { ' + s.userCollection() + '[contains(lower-case(Profile/email), ' + s.quote(search) + ')] }',
            '</Users>'
        ],
        receiver
    );
};

P.getAllUsers = function (receiver) {
    var s = this.storage;
    s.query('get all users',
        [
            '<Users>',
            '    { ' + s.userCollection() + ' }',
            '</Users>'
        ],
        receiver
    );
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
        s.replace('save existing group ' + group.Identifier,
            s.groupDocument(group.Identifier), groupXml,
            receiver
        );
    }
    else {
        s.add('add group ' + group.Identifier,
            s.groupDocument(group.Identifier), groupXml,
            receiver
        );
    }
};

P.getGroups = function (search, receiver) {
    var s = this.storage;
    s.query('get groups ' + search,
        [
            '<Groups>',
            '    { ' + s.groupCollection() + '[contains(lower-case(Name), lower-case(' + s.quote(search) + '))] }',
            '</Groups>'
        ],
        receiver
    );
};

P.getAllGroups = function (receiver) {
    var s = this.storage;
    s.query('get all groups',
        [
            '<Groups>',
            '    { ' + s.groupCollection() + ' }',
            '</Groups>'
        ],
        receiver
    );
};

P.getGroup = function (identifier, receiver) {
    var s = this.storage;
    s.query('get group ' + identifier,
        s.groupPath(identifier),
        receiver
    );
};

P.addUserToGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var addition = email + ' ' + role + ' ' + identifier;
    s.update('add user to group ' + addition,
        [
            'let $user := ' + s.userPath(email),
            'let $mem := ' + '<Membership><GroupIdentifier>' + identifier + '</GroupIdentifier><Role>' + role + '</Role></Membership>',
            'return',
            'if (exists($user/Memberships/Membership[GroupIdentifier=' + s.quote(identifier) + ']))',
            'then ()',
            'else ( if (exists($user/Memberships))',
            'then (insert node $mem into $user/Memberships)',
            'else (insert node <Memberships>{$mem}</Memberships> into $user))'
        ],
        function (result) {
            if (result) {
                s.query(
                    're-fetch user ' + addition,
                    s.userPath(email),
                    receiver
                );
            }
            else {
                receiver(null);
            }
        }
    );
};

P.removeUserFromGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var addition = email + ' ' + role + ' ' + identifier;
    s.update('remove user from group ' + addition,
        'delete node ' + s.userPath(email) + '/Memberships/Membership[GroupIdentifier=' + s.quote(identifier) + ']',
        function (result) {
            if (result) {
                s.query('re-fetch user after remove membership ' + addition,
                    s.userPath(email),
                    receiver
                );
            }
            else {
                receiver(null);
            }
        }
    );
};

