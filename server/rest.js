'use strict';

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

var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

Storage('oscr', homeDir, function (storage) {
    console.log('We have database ' + storage.database + ', and home directory ' + homeDir);

    app.use(upload(storage).serve);
    app.use(express.bodyParser());
    app.response.__proto__.xml = function (xmlString) {
        this.setHeader('Content-Type', 'text/xml');
        this.send(xmlString);
    };

    var now = new Date().getTime();
    var chatMessages = [];

    function isYoungEnough(message) {
        return (now - message.time) < 60000; // one minute
    }

    function chatUserString(profile) {
        return profile.firstName + ' ' + profile.lastName;
    }

    function publishChatMessage(req) {
        if (req.query.message && req.query.message.length) {
            var chatMessage = {
                time: new Date().getTime(),
                text: req.query.message,
                user: chatUserString(req.session.profile)
            };
            chatMessages.push(chatMessage);
            storage.Log.chat(req, chatMessage);
            now = new Date();
            chatMessages = _.filter(chatMessages, isYoungEnough);
        }
        return chatMessages;
    }

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

    function commonsRequest(path) {
        return {
            method: "GET",
            host: 'commons.delving.eu',
            port: 443,
            path: path + '?' + commonsQueryString()
        }
    }

    function replyWithLanguage(lang, res) {
        storage.I18N.getLanguage(lang, function (xml) {
            res.xml(xml);
        });
    }

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

    app.get('/i18n/:lang', function (req, res) {
        replyWithLanguage(req.params.lang, res);
    });

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

    app.get('/statistics/:groupIdentifier', function (req, res) {
        storage.ETC.getStatistics(req.params.groupIdentifier, function (xml) {
            res.xml(xml);
        });
    });

    app.get('/person/user/fetch/:identifier', function (req, res) {
        storage.Person.getUser(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

//    app.get('/person/user/select', function (req, res) {
//        var search = req.param('q').toLowerCase();
//        storage.Person.getUsers(search, function (xml) {
//            res.xml(xml);
//        });
//    });

    app.get('/person/chat', function (req, res) {
        res.send(publishChatMessage(req));
    });

    app.get('/person/user/all', function (req, res) {
        storage.Person.getAllUsers(function (xml) {
            res.xml(xml);
        });
    });

    app.get('/person/group/fetch/:identifier', function (req, res) {
        storage.Person.getGroup(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    app.get('/person/group/select', function (req, res) {
        var search = req.param('q').toLowerCase();
        storage.Person.getGroups(search, function (xml) {
            res.xml(xml);
        });
    });

    app.get('/person/group/all', function (req, res) {
        storage.Person.getAllGroups(function (xml) {
            res.xml(xml);
        });
    });

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

    app.get('/person/group/:identifier/users', function (req, res) {
        storage.Person.getUsersInGroup(req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

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

    app.get('/vocabulary/:vocab/all', function (req, res) {
        storage.Vocab.getVocabulary(req.params.vocab, function (xml) {
            res.xml(xml);
        });
    });

    app.get('/vocabulary/:vocab/select', function (req, res) {
        // todo: make sure q exists
        var search = req.param('q').toLowerCase();
        storage.Vocab.getVocabularyEntries(req.params.vocab, search, function (xml) {
            res.xml(xml);
        });
    });

    app.get('/vocabulary/:vocab/fetch/:identifier', function (req, res) {
        storage.Vocab.getVocabularyEntry(req.params.vocab, req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

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

    // all schemas
    app.get('/schema', function (req, res) {
        res.send(storage.Document.schemaMap);
    });

    // fetch schema
    app.get('/schema/:schema', function (req, res) {
        storage.Document.getDocumentSchema(req.params.schema, function (xml) {
            res.xml(xml);
        });
    });

    // fetch shared
    app.get('/shared/:schema/:identifier/fetch', function (req, res) {
        storage.Document.getDocument(req.params.schema, undefined, req.params.identifier, function (xml) {
            res.xml(xml);
        });
    });

    // fetch primary
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

    app.get('/log', function (req, res) {
        storage.Log.getActivityEntries(function (xml) {
            res.xml(xml);
        });
    });

    app.get('/snapshot/:fileName', function (req, res) {
        storage.ETC.snapshotCreate(req.params.fileName, function (localFile) {
            console.log("sending " + localFile);
            res.sendfile(localFile);
        });
    });

    app.get('/snapshot', function (req, res) {
        res.redirect('/snapshot/'+storage.ETC.snapshotName());
    });

    app.get('/data/import/:data/please', function(req, res) {
        var data = req.params.data;
        var answer;
        switch (data) {
            case 'primary-replace':
                storage.ETC.loadPrimaryData(true);
                answer = 'Importing primary data, replacing';
                break;
            case 'primary-new':
                answer = 'Loading primary data, first time';
                storage.ETC.loadPrimaryData(false);
                break;
            case 'bootstrap':
                answer = 'Loading bootstrap data';
                storage.ETC.loadBootstrapData();
                break;
            default :
                answer = 'Did not understand: bootstrap, primary-new, primary-replace';
                break;
        }
        res.send(answer);
    });
});

