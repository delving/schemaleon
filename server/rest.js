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

/**
 * This is the REST interface that the server-side of Schemaleon provides.  It is instantiated once the
 * Storage object has been created, which provides access to the BaseX database as well as to the
 * file system storage of media.
 *
 * This interface generally receives either GET method requests or POST requests with JSON content,
 * and it returns XML.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

var _ = require("underscore");
var express = require('express');
var https = require('https');
var crypto = require('crypto');
var Storage = require('./storage');
var upload = require('./upload');
var util = require('./util');

var app = express();
app.use(express.cookieParser());
app.use(express.cookieSession({secret: 'schemaleon'}));

module.exports = app;

// the user's home directory is where the file system storage is created
var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

// create the storage, with "schemaleon" as the database name in BaseX, and with homeDir for media storage
Storage('Schemaleon', homeDir, function (storage) {
    console.log('We have database ' + storage.database + ', and home directory ' + homeDir);

    // integrate the server-side portion of the JQuery File Upload, modified to work in Express
    app.use(upload(storage).serve);

    // install a parser so that JSON is understood
    app.use(express.bodyParser());

    // add an extra function to the response so that we can easily output XML
    app.response.__proto__.xml = function (xmlString) {
        this.setHeader('Content-Type', 'text/xml');
        this.send(xmlString);
    };

    // filter the list (chat and lease, both have "time") so that everything that is too old disappears
    function filterOutOld(list, secondsOld) {
        var now = new Date().getTime();
        var millisOld = secondsOld * 1000;
        return _.filter(list, function (entry) {
            var ago = (now - entry.time);
            return ago < millisOld;
        });
    }

    // several functions need to reply with the current language in its totality, so this function is re-used
    function replyWithLanguage(lang, res) {
        storage.I18N.getLanguage(lang, function (xml) {
            res.xml(xml);
        });
    }

    app.post('/authenticate', function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var digest = crypto.createHash('sha256');
        var passwordHash = digest.update(new Buffer(password + username, 'utf-8')).digest('base64');
        res.setHeader('Content-Type', 'text/xml');

        console.log("authenticate", req.body);
        storage.Person.authenticateUser(username, passwordHash, function (xml) {
            if (xml) {
                req.session.Identifier = util.getFromXml(xml, 'Identifier');
                req.session.GroupIdentifier = util.getFromXml(xml, 'GroupIdentifier');
                req.session.Role = util.getFromXml(xml, 'Role');
                req.session.Username = util.getFromXml(xml, 'Username');
                res.xml(xml);
                storage.Log.activity(req, {
                    Op: "Authenticate"
                });
            }
            else {
                util.sendErrorMessage(res, 'Username/Password combination not found');
            }
        });
    });

    app.post('/change-password', function (req, res) {
        util.withSelf(req, res, function(Identifier, Username) {
            var digest = crypto.createHash('sha256');
            var password = req.body.CurrentPassword;
            var passwordHash = digest.update(new Buffer(password + Username, 'utf-8')).digest('base64');
            res.setHeader('Content-Type', 'text/xml');

            storage.Person.authenticateUser(Username, passwordHash, function (xml) {
                if (xml) {
                    var digest = crypto.createHash('sha256');
                    var newPassword = req.body.NewPassword;
                    var newPasswordHash = digest.update(new Buffer(newPassword + Username, 'utf-8')).digest('base64');
                    storage.Person.changePassword(Identifier, newPasswordHash, function(xmlAgain) {
                        if (xmlAgain) {
                            storage.Log.activity(req, { Op: "ChangePassword" });
                            res.xml(xmlAgain);
                        }
                        else {
                            util.sendErrorMessage(res, 'Unable to change password');
                        }
                    });
                }
                else {
                    util.sendErrorMessage(res, 'Username/Password combination not found');
                }
            });
        });
    });

    app.post('/create-user', function (req, res) {
        util.ifGod(req, res, function() {
            var username = req.body.username;
            var password = req.body.password;
            var digest = crypto.createHash('sha256');
            var passwordHash = digest.update(new Buffer(password + username, 'utf-8')).digest('base64');
            res.setHeader('Content-Type', 'text/xml');

            storage.Person.createUser(username, passwordHash, function (xml) {
                if (xml) {
                    res.xml(xml);
                    storage.Log.activity(req, { Op: "CreateUser" });
                }
                else {
                    util.sendErrorMessage(res, 'Unable to create user');
                }
            });
        });
    });

    app.post('/change-profile', function (req, res) {
        util.withSelf(req, res, function(Identifier) {
            res.setHeader('Content-Type', 'text/xml');
            console.log("## set profile with self", Identifier);
            storage.Person.setProfile(Identifier, req.body, function (xml) {
                if (xml) {
                    res.xml(xml);
                    storage.Log.activity(req, { Op: "ChangeProfile" });
                }
                else {
                    util.sendErrorMessage(res, 'Unable to change profile');
                }
            });
        });
    });

    // fetch a translation document
    app.get('/i18n/:lang', function (req, res) {
        replyWithLanguage(req.params.lang, res);
    });

    // adjust the translation and documentation for an element of the schema
    app.post('/i18n/:lang/element', function (req, res) {
        util.ifGod(req, res, function () {
            var lang = req.params.lang;
            var key = req.body.key;
            if (key) {
                var title = req.body.title;
                if (title) storage.I18N.setElementTitle(lang, key, title, function (ok) {
                    replyWithLanguage(lang, res);
                    storage.Log.activity(req, {
                        Op: "TranslateTitle",
                        Lang: lang,
                        Key: key,
                        Value: title
                    });

                });
                if (req.body.doc) storage.I18N.setElementDoc(lang, key, req.body.doc, function (ok) {
                    replyWithLanguage(lang, res);
                    storage.Log.activity(req, {
                        Op: "TranslateDoc",
                        Lang: lang,
                        Key: key,
                        Value: req.body.doc
                    });
                });
            }
        });
    });

    // adjust the translation of an application label
    app.post('/i18n/:lang/label', function (req, res) {
        util.ifGod(req, res, function () {
            var lang = req.params.lang;
            var key = req.body.key;
            if (key) {
                var label = req.body.label;
                if (label) storage.I18N.setLabel(lang, key, label, function (ok) {
                    replyWithLanguage(lang, res);
                    storage.Log.activity(req, {
                        Op: "TranslateLabel",
                        Lang: lang,
                        Key: key,
                        Value: label
                    });
                });
            }
        });
    });

    // fetch the statistics, global stuff and specific to the given group
    app.get('/statistics/:groupIdentifier', function (req, res) {
        storage.ETC.getStatistics(req.params.groupIdentifier, function (xml) {
            res.xml(xml);
        });
    });

    // users chatting amongst each other see these chat messages
    var chatMessages = [];

    // make a readable user string from a profile
    function chatUserString(profile) {
        return profile.firstName + ' ' + profile.lastName;
    }

    // publish a chat message (or not) and receive the current list of recent chat messages
    function publishChatMessage(req) {
        if (req.query.message && req.query.message.length) {
            var chatMessage = {
                time: new Date().getTime(),
                text: req.query.message,
                user: chatUserString(req.session.profile),
                email: req.session.profile.email
            };
            chatMessages.push(chatMessage);
            storage.Log.chat(req, chatMessage);
        }
        return chatMessages = filterOutOld(chatMessages, 600);
    }

    // chat messages are passed in here, and the recent chats are returned
    app.get('/person/chat', function (req, res) {
        res.send(publishChatMessage(req));
    });

    // fetch a person record
    app.get('/person/user/fetch/:identifier', function (req, res) {
        storage.Person.getUser(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // get all the users in the system
    app.get('/person/user/all', function (req, res) {
        storage.Person.getAllUsers(function (xml) {
            res.xml(xml);
        });
    });

    // get a group record
    app.get('/person/group/fetch/:identifier', function (req, res) {
        storage.Person.getGroup(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // get all the groups
    app.get('/person/group/all', function (req, res) {
        storage.Person.getAllGroups(function (xml) {
            res.xml(xml);
        });
    });

    // save a group record
    app.post('/person/group/save', function (req, res) {
        util.ifGod(req, res, function () {
            storage.Person.saveGroup(req.body, function (xml) {
                res.xml(xml);
                storage.Log.activity(req, {
                    Op: "SaveGroup",
                    Group: req.body
                });
            });
        });
    });

    // find all the users in a group
    app.get('/person/group/:identifier/users', function (req, res) {
        storage.Person.getUsersInGroup(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // add a user to a group in a role
    app.post('/person/group/:identifier/add', function (req, res) {
        var userIdentifier = req.body.userIdentifier;
        var userRole = req.body.userRole;
        var groupIdentifier = req.params.identifier;
        util.ifGroupRole(groupIdentifier, ['Administrator'], req, res, function () {
            storage.Person.addUserToGroup(userIdentifier, userRole, groupIdentifier, function (xml) {
                res.xml(xml);
                storage.Log.activity(req, {
                    Op: "AddUserToGroup",
                    UserIdentifier: userIdentifier,
                    UserRole: userRole,
                    GroupIdentifier: groupIdentifier
                });
            });
        });
    });

    // remove a user from a group
    app.post('/person/group/:identifier/remove', function (req, res) {
        var userIdentifier = req.body.userIdentifier;
        var groupIdentifier = req.params.identifier;
        util.ifGroupRole(groupIdentifier, ['Administrator'], req, res, function () {
            storage.Person.removeUserFromGroup(userIdentifier, groupIdentifier, function (xml) {
                res.xml(xml);
                storage.Log.activity(req, {
                    Op: "RemoveUserFromGroup",
                    UserIdentifier: userIdentifier,
                    GroupIdentifier: groupIdentifier
                });
            });
        });
    });

    // get a whole vocabulary
    app.get('/vocabulary/:vocab/all', function (req, res) {
        storage.Vocab.getVocabulary(req.params.vocab, function (xml) {
            res.xml(xml);
        });
    });

    // select vocabulary entries
    app.get('/vocabulary/:vocab/select', function (req, res) {
        // todo: make sure q exists
        var search = req.param('q').toLowerCase();
        storage.Vocab.getVocabularyEntries(req.params.vocab, search, function (xml) {
            res.xml(xml);
        });
    });

    // fetch a single vocabulary entry
    app.get('/vocabulary/:vocab/fetch/:identifier', function (req, res) {
        storage.Vocab.getVocabularyEntry(req.params.vocab, req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // add a vocabulary entry, received in XML
    app.post('/vocabulary/:vocab/add', function (req, res) {
        // todo: anybody can do this?
        var entry = req.body.Entry;
        var vocabName = req.params.vocab;
        storage.Vocab.addVocabularyEntry(vocabName, entry, function (xml) {
            res.xml(xml);
            storage.Log.activity(req, {
                Op: "AddVocabularyEntry",
                Vocabulary: vocabName,
                Entry: entry
            })

        });
    });

    // get a document describing which schemas are available
    app.get('/schema', function (req, res) {
        res.send(storage.schemaMap);
    });

    // fetch one schema
    app.get('/schema/:schema', function (req, res) {
        storage.Document.getDocumentSchema(req.params.schema, function (xml) {
            res.xml(xml);
        });
    });

    // fetch a single shared document
    app.get('/shared/:schema/:identifier/fetch', function (req, res) {
        storage.Document.getDocument(req.params.schema, undefined, req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // fetch a single primary document
    app.get('/primary/:schema/:groupIdentifier/:identifier/fetch', function (req, res) {
        storage.Document.getDocument(req.params.schema, req.params.groupIdentifier, req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // execute the searches, returning the result
    function searchDocuments(res, search) {
        storage.Document.searchDocuments(search, function (documentListXML) {
            res.xml(documentListXML);
        });
    }

    // interpret the request (filtering the unknown
    function params(req) {
        return {
            schemaName: req.params.schemaName,
            groupIdentifier: req.params.groupIdentifier,
            searchQuery: req.query.searchQuery || '',
            startIndex: req.query.startIndex || 1,
            maxResults: req.query.maxResults || 10,
            wildcards: req.query.wildcards || true
        };
    }

    // search primary on schema and group
    app.get('/primary/:schemaName/:groupIdentifier/search', function (req, res) {
        searchDocuments(res, params(req))
    });

    // search shared on schema
    app.get('/shared/:schemaName/search', function (req, res) {
        searchDocuments(res, params(req))
    });

    // search primary all schemas
    app.get('/primary/search', function (req, res) {
        searchDocuments(res, params(req))
    });

    // users who have edited a document, making it "dirty", will publish their ownership in this list
    var documentLeases = [];

    // lease a document for the next number of seconds (or not) and receive the current list of leases
    function leaseDocument(req) {
        if (req.query.document) {
            var documentLease = {
                time: new Date().getTime(),
                document: req.query.document,
                user: req.session.Identifier
            };
            documentLeases.push(documentLease);
        }
        documentLeases = filterOutOld(documentLeases, 19);
        return documentLeases;
    }

    // this is called when a user leases a document (or not) and the current leases are returned
    app.get('/document/lease', function (req, res) {
        res.send(leaseDocument(req));
    });

    // save a document.  this call receives a JSON description of the document and its header,
    // and the body also contains the XML representation of the whole document
    app.post('/document/save', function (req, res) {
        var groupIdentifier = req.body.header.GroupIdentifier;
        util.ifGroupRole(groupIdentifier, ['Administrator', 'Member'], req, res, function () {
            // kind of interesting to receive xml within json, but seems to work
            storage.Document.saveDocument(req.body, function (header, error) {
                if (error) {
                    util.sendServerError(res, error);
                }
                else {
                    res.xml(header);
                    if (header) {
                        var entry = {
                            Op: "SaveDocument",
                            Identifier: util.getFromXml(header, "Identifier"),
                            SchemaName: util.getFromXml(header, "SchemaName")
                        };
                        var groupIdentifier = util.getFromXml(header, "GroupIdentifier");
                        if (groupIdentifier.length) {
                            entry.GroupIdentifier = groupIdentifier;
                        }
                        storage.Log.activity(req, entry)
                    }
                }
            });
        });
    });

    // fetch a media file from the file system repository
    app.get('/media/file/:identifier', function (req, res) {
        storage.Document.getMediaDocument(null, req.params.identifier, function (mediaDoc, error) {
            if (error) {
                res.status(500).send(error);
            }
            else {
                var groupFileSystem = storage.FileSystem.forGroup(mediaDoc.groupIdentifier);
                var filePath = groupFileSystem.getMedia(mediaDoc.identifier, mediaDoc.mimeType);
                res.setHeader('Content-Type', mediaDoc.mimeType);
                res.sendfile(filePath);
            }
        });
    });

    // fetch a thumbnail from the file system repository
    app.get('/media/thumbnail/:identifier', function (req, res) {
        storage.Document.getMediaDocument(null, req.params.identifier, function (mediaDoc, error) {
            if (error) {
                res.status(500).send(error);
            }
            else {
                var groupFileSystem = storage.FileSystem.forGroup(mediaDoc.groupIdentifier);
                var filePath = groupFileSystem.getThumbnail(mediaDoc.identifier);
                res.setHeader('Content-Type', util.thumbnailMimeType);
                res.sendfile(filePath);
            }
        });
    });

    // get today's log entries
    app.get('/log', function (req, res) {
        storage.Log.getActivityEntries(function (xml) {
            res.xml(xml);
        });
    });

    // make a snapshot of the entire database as a given name and return it as a tar-gzip
    app.get('/snapshot/:fileName', function (req, res) {
        // todo: make sure the user is a "god"
        storage.ETC.snapshotCreate(req.params.fileName, function (localFile) {
            console.log("sending " + localFile);
            res.sendfile(localFile);
        });
    });

    // redirect so that the snapshot is named according to the current time, call the above function
    app.get('/snapshot', function (req, res) {
        res.redirect('/snapshot/' + storage.ETC.snapshotName());
    });
});

