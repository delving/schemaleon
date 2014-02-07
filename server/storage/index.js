'use strict';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');
var defer = require('node-promise').defer;

var Person = require('./storage-person');
var I18N = require('./storage-i18n');
var Vocab = require('./storage-vocab');
var Document = require('./storage-document');
var Media = require('./storage-media');
var Log = require('./storage-log');
var FileSystem = require('./storage-filesystem');
var ETC = require('./storage-etc');
var util = require('../util');

function log(message) {
//    console.log(message);
}

function Storage(home) {
    this.session = new basex.Session();
    this.FileSystem = new FileSystem(home);
    this.ETC = new ETC(this);
    this.Person = new Person(this);
    this.I18N = new I18N(this);
    this.Vocab = new Vocab(this);
    this.Document = new Document(this);
    this.Media = new Media(this);
    this.Log = new Log(this);

    this.userDocument = function (identifier) {
        return "/people/users/" + identifier + ".xml";
    };

    this.userPath = function (identifier) {
        return "doc('" + this.database + this.userDocument(identifier) + "')/User";
    };

    this.userCollection = function () {
        return "collection('" + this.database + "/people/users')/User";
    };

    this.groupDocument = function (identifier) {
        return "/people/groups/" + identifier + ".xml";
    };

    this.groupPath = function (identifier) {
        return "doc('" + this.database + this.groupDocument(identifier) + "')/Group";
    };

    this.groupCollection = function () {
        return "collection('" + this.database + "/people/groups')/Group";
    };

    this.langDocument = function (language) {
        return "/i18n/" + language + ".xml";
    };

    this.langPath = function (language) {
        return "doc('" + this.database + this.langDocument(language) + "')/Language";
    };

    this.vocabDocument = function (vocabName) {
        return "/vocabulary/" + vocabName + ".xml";
    };

    this.vocabPath = function (vocabName) {
        return "doc('" + this.database + this.vocabDocument(vocabName) + "')";
    };

    this.vocabExists = function (vocabName) {
        return "db:exists('" + this.database + "','" + this.vocabDocument(vocabName) + "')";
    };

    this.vocabAdd = function (vocabName, xml) {
        return "db:add('" + this.database + "', " + xml + ",'" + this.vocabDocument(vocabName) + "')";
    };

    // ========= the following have changed to accommodate shared and primary records
    this.schemaMap = {
        primary: [ "Photo", "Film", "Memoriam", "Publication", "Object", "GemondeArchief" ],
        shared: [ "Location", "Person", "Organization", "HistoricalEvent" ]
    };

    this.isGroupSpecific = function(schemaName) {
        if (schemaName == "MediaMetadata") return true;
        return (_.contains(this.schemaMap.primary, schemaName))
    };

    this.isShared = function(schemaName) {
        return (_.contains(this.schemaMap.shared, schemaName))
    };

    this.schemaDir = function(schemaName) {
        if (this.isShared(schemaName)) {
            return "/shared/";
        }
        else {
            return "/primary/"; // includes MediaMetadata
        }
    };

    this.schemaDocument = function (schemaName) {
        return "/schemas" + this.schemaDir(schemaName) + schemaName + ".xml";
    };

    this.schemaPath = function (schemaName) {
        return "doc('" + this.database + this.schemaDocument(schemaName) + "')/" + schemaName;
    };

    this.nonOSCRGroupIdentifier = function(schemaName, groupIdentifier) {
        if (this.isShared(schemaName) && groupIdentifier == 'OSCR') return undefined;
        return groupIdentifier;
    };

    this.dataDocument = function (identifier, schemaName, groupIdentifier) {
        groupIdentifier = this.nonOSCRGroupIdentifier(schemaName, groupIdentifier);
        if (groupIdentifier) {
            if (!this.isGroupSpecific(schemaName)) throw schemaName + " is not group "+ groupIdentifier +" specific!";
            return this.schemaDir(schemaName) + groupIdentifier + "/" + schemaName + "/" + identifier + ".xml";
        }
        else {
            if (!this.isShared(schemaName)) throw schemaName + " is not shared!";
            return this.schemaDir(schemaName) + schemaName + "/" + identifier + ".xml";
        }
    };

    this.dataPath = function (identifier, schemaName, groupIdentifier) {
        groupIdentifier = this.nonOSCRGroupIdentifier(schemaName, groupIdentifier);
        return "doc('" + this.database + this.dataDocument(identifier, schemaName, groupIdentifier) + "')/Document";
    };

    this.dataCollection = function (schemaName, groupIdentifier) {
        groupIdentifier = this.nonOSCRGroupIdentifier(schemaName, groupIdentifier);
        if (groupIdentifier) {
            if (schemaName) {
                return "collection('" + this.database + this.schemaDir(schemaName) + groupIdentifier + "/" + schemaName + "')";
            }
            else { // shouldn't matter
                return "collection('" + this.database + "/primary/" + groupIdentifier + "')";
            }
        }
        else if (schemaName) {
            return "collection('" + this.database + this.schemaDir(schemaName) + schemaName + "')";
        }
        else {
            return "collection('" + this.database + "/primary/" + "')";
        }
    };

    // todo: work this into dataCollection
    this.dataDocumentCount = function (schemaName) {
        return "count(collection('" + this.database + "')//Header[SchemaName=" + util.quote(schemaName) + "])";
    };

    this.onlyPublic = function(schemaName, groupIdentifier) {
        if (groupIdentifier) {
            return false; // searching your own collection: show both public and private
        }
        else if (schemaName) {
            return true; // shared docs, only public should show
        }
        else {
            return true; // primary docs, search all
        }
    };

    // =============

    this.activityDocument = function () {
        var now = new Date();
        return "/log/activity-" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + ".xml";
    };

    this.activityPath = function () {
        return "doc('" + this.database + this.activityDocument() + "')";
    };

    this.chatDocument = function () {
        var now = new Date();
        return "/log/chat-" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + ".xml";
    };

    this.chatPath = function () {
        return "doc('" + this.database + this.chatDocument() + "')";
    };

    function wrapQuery(query) {
        if (_.isArray(query)) {
            query = query.join('\n');
        }
        log(query);
        return '<xquery><![CDATA[\n' + query + '\n]]></xquery>';
    }

    function reportError(message, error, query) {
        if (message) {
            console.error(message);
            console.error(error);
            console.error(query);
        }
    }

    this.query = function (message, query, receiver) {
//        console.log(message || 'no message'); // todo: remove
        query = wrapQuery(query);
        this.session.execute(query, function (error, reply) {
            if (reply.ok) {
                log(message);
                receiver(reply.result);
            }
            else {
                reportError(message, error, query);
                receiver(null);
            }
        });
    };

    this.update = function (message, query, receiver) {
        query = wrapQuery(query);
        this.session.execute(query, function (error, reply) {
            if (reply.ok) {
                log(message);
                receiver(true);
            }
            else {
                reportError(message, error, query);
                receiver(false);
            }
        });
    };

    this.add = function (message, path, content, receiver) {
        this.session.add(path, content, function (error, reply) {
            if (reply.ok) {
                log('add ' + path + ': ' + content);
                receiver(content);
            }
            else {
                reportError(message, error, path + ': ' + content);
                receiver(null);
            }
        });
    };

    this.replace = function (message, path, content, receiver) {
        this.session.replace(path, content, function (error, reply) {
            if (reply.ok) {
                receiver(content);
            }
            else {
                reportError(message, error);
                receiver(null);
            }
        });
    };
}

function open(databaseName, homeDir, receiver) {

    var storage = new Storage(homeDir);

    storage.session.execute('open ' + databaseName, function (error, reply) {
        storage.database = databaseName;

        if (reply.ok) {
            receiver(storage);
        }
        else {
            storage.session.execute('create db ' + databaseName, function (error, reply) {
                if (reply.ok) {
                    storage.session.execute('create index fulltext', function(er, rep) {
                        if (!reply.ok) {
                            console.error(er);
                        }
                        else {
                            receiver(storage);
                            storage.ETC.loadBootstrapData(false);
                        }
                    });
                }
                else {
                    console.error('Unable to create database ' + databaseName);
                    console.error(error);
                    receiver(null);
                }
            });
        }
    });
}

module.exports = open;
