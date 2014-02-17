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

/*

    This is the storage "class" which defines how the database is structured and provides access as
    well to the file system directory for media etc.

    It is divided up into a number of different functional parts, each of which is created here
    and attached so that it can be used from anywhere.

 */

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

    // users are stored in files named after the user's identifier
    this.userDocument = function (identifier) {
        return "/people/users/" + identifier + ".xml";
    };

    // access the contents of a given user document
    this.userPath = function (identifier) {
        return "doc('" + this.database + this.userDocument(identifier) + "')/User";
    };

    // do something with the collection of all users
    this.userCollection = function () {
        return "collection('" + this.database + "/people/users')/User";
    };

    // groups are stored in files named after the group identifier
    this.groupDocument = function (identifier) {
        return "/people/groups/" + identifier + ".xml";
    };

    // access the contents of a group document
    this.groupPath = function (identifier) {
        return "doc('" + this.database + this.groupDocument(identifier) + "')/Group";
    };

    // do something with all of the groups
    this.groupCollection = function () {
        return "collection('" + this.database + "/people/groups')/Group";
    };

    // access a language translation document
    this.langDocument = function (language) {
        return "/i18n/" + language + ".xml";
    };

    // path into a given language document, from which you can dig further
    this.langPath = function (language) {
        return "doc('" + this.database + this.langDocument(language) + "')/Language";
    };

    // vocabulary documents are stored according to the name of the vocabulary (found in the schemas)
    this.vocabDocument = function (vocabName) {
        return "/vocabulary/" + vocabName + ".xml";
    };

    // path into a vocabulary document, from which you can dig
    this.vocabPath = function (vocabName) {
        return "doc('" + this.database + this.vocabDocument(vocabName) + "')";
    };

    // check whether a vocabulary already exists
    this.vocabExists = function (vocabName) {
        return "db:exists('" + this.database + "','" + this.vocabDocument(vocabName) + "')";
    };

    // add a vocabulary document for the first time
    this.vocabAdd = function (vocabName, xml) {
        return "db:add('" + this.database + "', " + xml + ",'" + this.vocabDocument(vocabName) + "')";
    };

    // check if a schema belongs to the group-specific ones, which also includes the MediaMetadata
    this.isGroupSpecific = function (schemaName) {
        if (schemaName == "MediaMetadata") return true;
        return (_.contains(this.schemaMap.primary, schemaName))
    };

    // check if a schema is one of the shared ones
    this.isShared = function (schemaName) {
        return (_.contains(this.schemaMap.shared, schemaName))
    };

    // decide which position in the database to look for a schema, given its name
    this.schemaDir = function (schemaName) {
        if (this.isShared(schemaName)) {
            return "/shared/";
        }
        else {
            return "/primary/"; // includes MediaMetadata
        }
    };

    // locate a schema document given its name
    this.schemaDocument = function (schemaName) {
        return "/schemas" + this.schemaDir(schemaName) + schemaName + ".xml";
    };

    // path into a schema document from which you can dig further
    this.schemaPath = function (schemaName) {
        return "doc('" + this.database + this.schemaDocument(schemaName) + "')/" + schemaName;
    };

    // determine whether somebody can access a document (gods can access anything, mortals only their primary docs)
    this.nonOSCRGroupIdentifier = function (schemaName, groupIdentifier) {
        if (this.isShared(schemaName) && groupIdentifier == 'OSCR') return undefined;
        return groupIdentifier;
    };

    // locate a document from a given schema and with the given identifier and group identifier
    this.dataDocument = function (identifier, schemaName, groupIdentifier) {
        groupIdentifier = this.nonOSCRGroupIdentifier(schemaName, groupIdentifier);
        if (groupIdentifier) {
            if (!this.isGroupSpecific(schemaName)) throw schemaName + " is not group " + groupIdentifier + " specific!";
            return this.schemaDir(schemaName) + groupIdentifier + "/" + schemaName + "/" + identifier + ".xml";
        }
        else {
            if (!this.isShared(schemaName)) throw schemaName + " is not shared!";
            return this.schemaDir(schemaName) + schemaName + "/" + identifier + ".xml";
        }
    };

    // the path into the document, from which you can dig further
    this.dataPath = function (identifier, schemaName, groupIdentifier) {
        groupIdentifier = this.nonOSCRGroupIdentifier(schemaName, groupIdentifier);
        return "doc('" + this.database + this.dataDocument(identifier, schemaName, groupIdentifier) + "')/Document";
    };

    // locate a collection of documents, with optionally the schema and the group.  both are optional, because
    // this method is intended to be very flexible, especially for search
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

    // specifically get a schema count.
    this.dataDocumentCount = function (schemaName) {
        return "count(collection('" + this.database + "')//Header[SchemaName=" + util.quote(schemaName) + "])";
    };

    // return true if something should only be shown publically
    this.onlyPublic = function (schemaName, groupIdentifier) {
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

    // locate today's activity log
    this.activityDocument = function () {
        var now = new Date();
        return "/log/activity-" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + ".xml";
    };

    // navigate to today's activity log
    this.activityPath = function () {
        return "doc('" + this.database + this.activityDocument() + "')";
    };

    // locate today's chat document
    this.chatDocument = function () {
        var now = new Date();
        return "/log/chat-" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + ".xml";
    };

    // navigate to today's chat document
    this.chatPath = function () {
        return "doc('" + this.database + this.chatDocument() + "')";
    };

    // wrap a query in XML CDATA for BaseX
    function wrapQuery(query) {
        if (_.isArray(query)) {
            query = query.join('\n');
        }
        log(query);
        return '<xquery><![CDATA[\n' + query + '\n]]></xquery>';
    }

    // report a BaseX error
    function reportError(message, error, query) {
        if (message) {
            console.error(message);
            console.error(error);
            console.error(query);
        }
    }

    // perform a query to BaseX returning either the result or null if it failed
    this.query = function (message, query, receiver) {
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

    // perform an update to BaseX returning either the result or null if it failed
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

    // perform an addition to BaseX returning either the result or null if it failed
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

    // perform a replacement to BaseX returning either the result or null if it failed
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

// open a database, or create it and initialize it if there wasn't one present yet, and use the given
// home directory to locate the media filesystem.

function open(databaseName, homeDir, receiver) {

    var storage = new Storage(homeDir);

    function getSchemaMap() {
        storage.query('get schema map',
            "doc('" + storage.database + "/schemas/SchemaMap.xml')/SchemaMap",
            function (schemaMapXml) {
                storage.schemaMap = {
                    primary: util.getFromXml(schemaMapXml, 'primary').split(','),
                    shared: util.getFromXml(schemaMapXml, 'shared').split(',')
                };
                console.log('schema map', storage.schemaMap);
            }
        );
    }

    storage.session.execute('open ' + databaseName, function (error, reply) {
        storage.database = databaseName;

        if (reply.ok) {
            getSchemaMap();
            receiver(storage);
        }
        else {
            storage.session.execute('create db ' + databaseName, function (error, reply) {
                if (reply.ok) {
                    storage.session.execute('create index fulltext', function (er, rep) {
                        if (!reply.ok) {
                            console.error(er);
                        }
                        else {
                            storage.ETC.loadBootstrapData(false, function () {
                                getSchemaMap();
                                receiver(storage);
                            });
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
