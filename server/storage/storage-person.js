/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var util = require('../util');

/*
 * Here we handle the users and their groups.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = Person;

function Person(storage) {
    this.storage = storage;
}

var P = Person.prototype;

function log(message) {
//    console.log(message);
}

P.authenticateUser = function (username, passwordHash, receiver) {
    var s = this.storage;
    var self = this;
    s.query(
        'authenticate user',
            s.userCollection() +
            '[Credentials/Username=' + util.quote(username) + ' and Credentials/PasswordHash=' + util.quote(passwordHash) + ']',
        function (result) {
            if (result) {
                receiver(result);
            }
            else {
                s.query('count users', 'count(' + s.userCollection() + ')',
                    function (result) {
//                        log('user count: ' + result);
                        if (result === '0') {
                            // there is nobody, so this person becomes administrator
                            var userObject = {
                                Identifier: util.generateUserId(),
                                Credentials: {
                                    Username: username,
                                    PasswordHash: passwordHash
                                },
                                Membership: {
                                    GroupIdentifier: 'Schemaleon',
                                    Role: 'Administrator'
                                },
                                SaveTime: new Date().getTime()
                            };
                            var userXml = util.objectToXml(userObject, 'User');
                            if (!userObject.Identifier) {
                                console.trace('No Identifier in user object!');
                            }
                            s.add('add user ' + JSON.stringify(userObject),
                                s.userDocument(userObject.Identifier), userXml, receiver
                            );
                        }
                        else {
                            receiver(null)
                        }
                    }
                );
            }
        }
    );
};

P.setProfile = function (userIdentifier, profile, receiver) {
    var s = this.storage;
    var userProfilePath = s.userPath(userIdentifier) + "/Profile";
    var profileXml = util.objectToXml(profile, "Profile");

    s.update('set profile: ' + userIdentifier,
        [
            'let $user := ' + s.userPath(userIdentifier),
            'let $profile := ' + profileXml,
            'return',
            'if (exists($user/hello))',
            'then (replace node $user/Profile with $profile)',
            'else (insert node $profile into $user)'
        ],
        function (result) {
            if (result) {
                s.query('re-fetch user', s.userPath(userIdentifier), receiver);
            }
            else {
                receiver(null);
            }
        }
    );
};

// get a particular user
P.getUser = function (identifier, receiver) {
    var s = this.storage;
    s.query('get user ' + identifier,
        s.userPath(identifier),
        receiver
    );
};

P.searchUsers = function(sought, receiver) {
    var s = this.storage;
    var q = [
        '<Groups>{',
        'let $found := for $user in ' + s.userCollection(),
        '   where ($user//*[text() contains text ' + util.quote(sought) + ' any])',
        '     return $user',
        'return $found',
        '}</Groups>'
    ];
//    console.log("!!! search groups", q);
    s.query('search users: ' + sought, q, receiver);
};

// find out which users belong to a given group by querying their Membership
P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    s.query('get users in group ' + identifier,
        [
            '<Users>',
            '    { ' + s.userCollection() + '[Membership/GroupIdentifier=' + util.quote(identifier) + '] }',
            '</Users>'
        ],
        receiver
    );
};

// get all the users
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

// save a changed group
P.saveGroup = function (group, receiver) {
    var s = this.storage;
    group.SaveTime = new Date().getTime();
    var existing = group.Identifier;
    if (!existing) {
        group.Identifier = util.generateGroupId();
    }
    var groupXml = util.objectToXml(group, "Group");
    if (existing) {
        if (group.Identifier == 'Schemaleon') {
            console.warn("Refuse to update Schemaleon group");
        }
        else {
            s.replace('save existing group ' + group.Identifier,
                s.groupDocument(group.Identifier), groupXml,
                receiver
            );
        }
    }
    else { // here we could try fuzzy match or something
        log('saveGroup: search for ' + group.Name);
        s.query('check group',
            s.groupCollection() + '[Name = ' + util.quote(group.Name) + ']',
            function (result) {
                if (result.length == 0) { // text is not found
                    s.add('add group ' + group.Identifier,
                        s.groupDocument(group.Identifier), groupXml,
                        receiver
                    );
                }
                else {
                    receiver(result);
                }
            }
        );
    }
};

P.searchGroups = function(sought, receiver) {
    var s = this.storage;
    var q = [
        '<Groups>{',
            'let $found := for $group in ' + s.groupCollection(),
            '   where ($group//*[text() contains text ' + util.quote(sought) + ' any])',
            '     return $group',
            'return $found',
        '}</Groups>'
    ];
//    console.log("!!! search groups", q);
    s.query('search groups: ' + sought, q, receiver);
};

// get a list of all groups
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

// get a specific group
P.getGroup = function (identifier, receiver) {
    var s = this.storage;
    s.query('get group ' + identifier,
        s.groupPath(identifier),
        receiver
    );
};

// add a user to a group
P.addUserToGroup = function (userIdentifier, role, groupIdentifier, receiver) {
    var s = this.storage;
    var addition = userIdentifier + ' ' + role + ' ' + groupIdentifier;
    s.update('add user to group ' + addition,
        [
            'let $user := ' + s.userPath(userIdentifier),
            'let $mem := ' + '<Membership><GroupIdentifier>' + groupIdentifier + '</GroupIdentifier><Role>' + role + '</Role></Membership>',
            'return',
            'if (exists($user/Membership[GroupIdentifier=' + util.quote(groupIdentifier) + ']))',
            'then ()',
            'else ( if (exists($user/Membership))',
            'then (replace node $user/Membership with $mem)',
            'else (insert node $mem into $user))'
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

// remove a user from a group
P.removeUserFromGroup = function (userIdentifier, groupIdentifier, receiver) {
    var s = this.storage;
    var removal = userIdentifier + ' ' + groupIdentifier;
    s.update('remove user from group ' + removal,
        'delete node ' + s.userPath(userIdentifier) + '/Membership[GroupIdentifier=' + util.quote(groupIdentifier) + ']',
        function (result) {
            if (result) {
                s.query('re-fetch user after remove membership ' + removal,
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

