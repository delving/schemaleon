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

P.getUsersInGroup = function (identifier, receiver) {
    var s = this.storage;
    var query = s.userCollection() + '/Memberships/MemberOf[Identifier = ' + s.quote() + ']';
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver("<Headers>" + reply.result + "</Headers>");
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.addUserRoleToGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = s.userCollection() + '/Memberships/MemberOf[Identifier = ' + s.quote() + ']';
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver("<Headers>" + reply.result + "</Headers>");
        }
        else {
            throw error + "\n" + query;
        }
    });
};

P.removeUserRoleFromGroup = function (email, role, identifier, receiver) {
    var s = this.storage;
    var query = s.userCollection() + '/Memberships/MemberOf[Identifier = ' + s.quote() + ']';
    s.xquery(query, function (error, reply) {
        if (reply.ok) {
            receiver("<Headers>" + reply.result + "</Headers>");
        }
        else {
            throw error + "\n" + query;
        }
    });
};

