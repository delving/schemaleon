// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

'use strict';

/*

    Here we handle the users and their groups.

    Author: Gerald de Jong <gerald@delving.eu>

 */

var util = require('../util');

module.exports = Person;

function Person(storage) {
    this.storage = storage;
}

var P = Person.prototype;

function log(message) {
//    console.log(message);
}

// given a profile, first look for a user with the given username, but if nobody is found, create a new
// user document and fill it with the profile information
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
                            userObject.Membership = {
                                GroupIdentifier: 'OSCR',
                                Role: 'Administrator'
                            };
                        }
                        addUser(userObject);
                    }
                );
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
        if (group.Identifier == 'OSCR') {
            console.warn("Refuse to update OSCR group");
        }
        else {
            s.replace('save existing group ' + group.Identifier,
                s.groupDocument(group.Identifier), groupXml,
                receiver
            );
        }
    }
    else { // here we could try fuzzy match or something
        log('search for ' + group.Name);
        s.query('check group',
            s.groupCollection() + '[Name = ' + util.quote(group.Name) + ']',
            function(result) {
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

