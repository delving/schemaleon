'use strict';

module.exports = Person;

function Person(storage) {
    this.storage = storage;
}

var P = Person.prototype;

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
    if (!profile.email) {
        throw new Error('No email in profile');
    }
    this.getUser(profile.email, function (xml) {
        if (xml) {
            receiver(xml);
        }
        else {
            var userObject = {
                Identifier: s.generateUserId(),
                Profile: profile,
                SaveTime: new Date().getTime()
            };
            var userXml = s.objectToXml(userObject, 'User');
            s.add(s.userDocument(profile.email), userXml, function (error, reply) {
                if (reply.ok) {
                    receiver(userXml);
                }
                else {
                    throw error + "\n" + query;
                }
            });
        }
    });
};

P.getUser = function (email, receiver) {
    var s = this.storage;
    var query = s.userPath(email);
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            receiver(null);
        }
    });
};

P.saveGroup = function (group, receiver) {
    var s = this.storage;
    group.SaveTime = new Date().getTime();
    var existing = group.Identifier;
    if (!existing) {
        group.Identifier = s.generateGroupId();
    }
    var groupXml = s.objectToXml(group, "Group");
    if (existing) {
        s.replace(s.groupDocument(group.Identifier), groupXml, function (error, reply) {
            if (reply.ok) {
                receiver(groupXml);
            }
            else {
                throw "Unable to replace " + self.docPath(body.header.Identifier);
            }
        });
    }
    else {
        s.add(s.groupDocument(group.Identifier), groupXml, function (error, reply) {
            if (reply.ok) {
                receiver(groupXml);
            }
            else {
                throw error + "\n" + query;
            }
        });
    }
};

P.getGroups = function (search, receiver) {
    var s = this.storage;
    var query = [
        '<Groups>',
        '    { ' + s.groupCollection() + '[contains(lower-case(Name), lower-case(' + s.quote(search) + '))] }',
        '</Groups>'
    ].join('\n');
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.getGroup = function (identifier, receiver) {
    var s = this.storage;
    var query = s.groupPath(identifier);
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.addUserRoleToGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = [
        'let $user := ' + s.userPath(email),
        'let $mem := ' + '<Member><Group>' + identifier + '</Group><Role>' + role + '</Role></Member>',
        'return',
        'if (exists($user/Memberships/Member[Group=' + s.quote(identifier) + ']))',
        'then ()',
        'else if (exists($user/Memberships))',
        'then insert node $mem into $user/Memberships',
        'else insert node <Memberships>{$mem}</Memberships> into $user'
    ].join('\n');
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            s.xquery(s.userPath(email), function (e, r) {
                receiver(r.result);
            });
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.removeUserRoleFromGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = 'delete node ' + s.userPath(email) + '/Memberships/Member[Group=' + s.quote(identifier) + ']';
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            s.xquery(s.userPath(email), function (e, r) {
                receiver(r.result);
            });
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    var query = [
        '<Users>',
        '    { ' + s.userCollection() + '[Memberships/Member/Group = ' + s.quote(identifier) + '] }',
        '</Users>'
    ].join('\n');
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.getUsers = function (search, receiver) {
    var s = this.storage;
    var query = [
        '<Users>',
        '    { ' + s.userCollection() + '[contains(lower-case(Profile/email), ' + s.quote(search) + ')] }',
        '</Users>'
    ].join('\n');
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

