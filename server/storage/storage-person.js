'use strict';

var util = require('../util');

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
 username: 'gerald', // added in rest.js/authenticate
 email: 'gerald@delving.eu',
 websites: [] }
 */

P.roles = [
    'Member', 'Administrator'
];

P.getOrCreateUser = function (profile, receiver) {
    var s = this.storage;
    var self = this;
    if (!profile.username) {
        throw new Error('No username in profile');
    }

    function addUser(userObject) {
        var userXml = util.objectToXml(userObject, 'User');
        if (!userObject.Identifier) {
            console.trace('No Identifier in user object!');
        }
        s.add('add user ' + JSON.stringify(userObject),
            s.userDocument(userObject.Identifier),
            userXml,
            receiver
        );
    }

    if (!profile.username) {
        console.trace('No Identifier in user object!');
    }

    s.query(null,
        s.userCollection() + '[Profile/username=' + util.quote(profile.username) + ']',
        function (result) {
            if (result) {
                receiver(result);
            }
            else {
                var userObject = {
                    Identifier: util.generateUserId(),
                    Profile: profile,
                    SaveTime: new Date().getTime()
                };
                log('counting users');
                s.query('count users',
                    'count(' + s.userCollection() + ')',
                    function (result) {
                        log('count: ' + result);
                        if (result === '0') {
                            userObject.Memberships = {
                                Membership: [
                                    {
                                        GroupIdentifier: 'OSCR',
                                        Role: 'Administrator'
                                    }
                                ]
                            };
                        }
                        addUser(userObject);
                    }
                );
            }
        }
    );
};

P.getUser = function (identifier, receiver) {
    var s = this.storage;
    s.query('get user ' + identifier,
        s.userPath(identifier),
        receiver
    );
};

P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    s.query('get users in group ' + identifier,
        [
            '<Users>',
            '    { ' + s.userCollection() + '[Memberships/Membership/GroupIdentifier=' + util.quote(identifier) + '] }',
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
            '    { ' + s.userCollection() + '[',
            '      contains(lower-case(Profile/username), ' + util.quote(search) + ')',
            '      or contains(lower-case(Profile/email), ' + util.quote(search) + ')',
            '      or contains(lower-case(Profile/firstName), ' + util.quote(search) + ')',
            '      or contains(lower-case(Profile/lastName), ' + util.quote(search) + ')',
            '    ]}',
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
        group.Identifier = util.generateGroupId();
    }
    var groupXml = util.objectToXml(group, "Group");
    if (existing && group.Identifier != 'OSCR') {
        s.replace('save existing group ' + group.Identifier,
            s.groupDocument(group.Identifier), groupXml,
            receiver
        );
    }
    else { // here we could try fuzzy match or something
        log('search for ' + group.Name);
        s.query('check group',
            s.groupCollection() + '[Name = ' + util.quote(group.Name) + ']',
            function(result) {
                log(group.Name + ' result was '+result);
                if (result.length == 0) { // text is not found
                    s.add('add group ' + group.Identifier,
                        s.groupDocument(group.Identifier), groupXml,
                        receiver
                    );
                }
                else {
                    receiver(null);
                }
            }
        );
    }
};

P.getGroups = function (search, receiver) {
    var s = this.storage;
    s.query('get groups ' + search,
        [
            '<Groups>',
            '    { ' + s.groupCollection() + '[contains(lower-case(Name), lower-case(' + util.quote(search) + '))] }',
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

P.addUserToGroup = function (userIdentifier, role, groupIdentifier, receiver) {
    var s = this.storage;
    var addition = userIdentifier + ' ' + role + ' ' + groupIdentifier;
    s.update('add user to group ' + addition,
        [
            'let $user := ' + s.userPath(userIdentifier),
            'let $mem := ' + '<Membership><GroupIdentifier>' + groupIdentifier + '</GroupIdentifier><Role>' + role + '</Role></Membership>',
            'return',
            'if (exists($user/Memberships/Membership[GroupIdentifier=' + util.quote(groupIdentifier) + ']))',
            'then ()',
            'else ( if (exists($user/Memberships))',
            'then (insert node $mem into $user/Memberships)',
            'else (insert node <Memberships>{$mem}</Memberships> into $user))'
        ],
        function (result) {
            if (result) {
                s.query('re-fetch user ' + addition,
                    s.userPath(userIdentifier),
                    receiver
                );
            }
            else {
                receiver(null);
            }
        }
    );
};

P.removeUserFromGroup = function (userIdentifier, role, groupIdentifier, receiver) {
    var s = this.storage;
    var addition = userIdentifier + ' ' + role + ' ' + groupIdentifier;
    s.update('remove user from group ' + addition,
        'delete node ' + s.userPath(userIdentifier) + '/Memberships/Membership[GroupIdentifier=' + util.quote(groupIdentifier) + ']',
        function (result) {
            if (result) {
                s.query('re-fetch user after remove membership ' + addition,
                    s.userPath(userIdentifier),
                    receiver
                );
            }
            else {
                receiver(null);
            }
        }
    );
};

