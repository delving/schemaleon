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

    This is the REST interface that the server-side of OSCR provides.  It is instantiated once the
    Storage object has been created, which provides access to the BaseX database as well as to the
    file system storage of media.

    This interface generally receives either GET method requests or POST requests with JSON content,
    and it returns XML.

    Author: Gerald de Jong <gerald@delving.eu>

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
app.use(express.cookieSession({secret: 'oscr'}));

module.exports = app;

// the user's home directory is where the file system storage is created
var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

// create the storage, with "oscr" as the database name in BaseX, and with homeDir for media storage
Storage('oscr', homeDir, function (storage) {
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
        return _.filter(list, function(entry) {
            var ago = (now - entry.time);
            return ago < millisOld;
        });
    }

    // perform a query to the CultureCommons for authentication/login
    function commonsQueryString() {
        var API_QUERY_PARAMS = {
            "apiToken": "6f941a84-cbed-4140-b0c4-2c6d88a581dd",
            "apiOrgId": "delving",
            "apiNode": "playground" // todo: this should not be playground!
        };
        var queryParams = [];
        for (var key in API_QUERY_PARAMS) {
            queryParams.push(key + '=' + API_QUERY_PARAMS[key]);
        }
        return queryParams.join('&');
    }

    // compose the request to CultureCommons
    function commonsRequest(path) {
        return {
            method: "GET",
            host: 'commons.delving.eu',
            port: 443,
            path: path + '?' + commonsQueryString()
        }
    }

    // several functions need to reply with the current language in its totality, so this function is re-used
    function replyWithLanguage(lang, res) {
        storage.I18N.getLanguage(lang, function (xml) {
            res.xml(xml);
        });
    }

    // a request to authenticate a user comes in, is checked with CultureCommons, and then the user record
    // is fetched from the database (or created, first time).  the session object is created and filled
    app.post('/authenticate', function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var sha = crypto.createHash('sha512');
        var hashedPassword = sha.update(new Buffer(password, 'utf-8')).digest('base64');
        var hmac = crypto.createHmac('sha1', username);
        var hash = hmac.update(hashedPassword).digest('hex');
        res.setHeader('Content-Type', 'text/xml');
        https.request(
            commonsRequest('/user/authenticate/' + hash),
            function (authResponse) {
                if (authResponse.statusCode == 200) {
                    https.request(
                        commonsRequest('/user/profile/' + username),
                        function (profileResponse) {
                            var data;
                            profileResponse.on('data', function (data) {
                                var profile = JSON.parse(data);
                                profile.username = username;
                                req.session.profile = profile;
                                storage.Person.getOrCreateUser(profile, function (xml) {
                                    req.session.Identifier = util.getFromXml(xml, 'Identifier');
                                    req.session.GroupIdentifier = util.getFromXml(xml, 'GroupIdentifier');
                                    req.session.Role = util.getFromXml(xml, 'Role');
                                    res.xml(xml);
                                    storage.Log.activity(req, {
                                        Op: "Authenticate"
                                    });
                                });
                            });
                        }
                    ).end();
                }
                else {
                    util.sendErrorMessage(res, 'Failed to authenticate');
                }
            }
        ).end();
    });

    // fetch a translation document
    app.get('/i18n/:lang', function (req, res) {
        replyWithLanguage(req.params.lang, res);
    });

    // adjust the translation and documentation for an element of the schema
    app.post('/i18n/:lang/element', function (req, res) {
        util.authenticatedGod(req, res, function() {
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
        util.authenticatedGod(req, res, function() {
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
        util.authenticatedGod(req, res, function() {
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
        util.authenticatedGroup(groupIdentifier, ['Administrator'], req, res, function() {
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
        util.authenticatedGroup(groupIdentifier, ['Administrator'], req, res, function() {
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
        util.authenticatedGroup(groupIdentifier, ['Administrator', 'Member'], req, res, function() {
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
        storage.Document.getMediaDocument(null, req.params.identifier, function(mediaDoc, error) {
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
        storage.Document.getMediaDocument(null, req.params.identifier, function(mediaDoc, error) {
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
        res.redirect('/snapshot/'+storage.ETC.snapshotName());
    });

    // this function should not be here but it is useful for testing
    // todo: remove this function
    app.get('/data/import/:data/please', function(req, res) {
        var data = req.params.data;
        switch (data) {
            case 'primary-replace':
                storage.ETC.loadPrimaryData(true, function() {
                    res.send('Imported primary data, replacing');
                });
                break;
            case 'primary-new':
                storage.ETC.loadPrimaryData(false, function() {
                    res.send('Loaded primary data, first time');
                });
                break;
            case 'bootstrap':
                storage.ETC.loadBootstrapData(false, function() {
                    res.send('Loaded bootstrap data');
                });
                break;
            default :
                res.send('Did not understand: bootstrap, primary-new, primary-replace');
                break;
        }
    });
});

