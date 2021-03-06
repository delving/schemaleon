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

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');
var defer = require('node-promise').defer;
var child_process = require('child_process');

var Person = require('./storage-person');
var I18N = require('./storage-i18n');
var Vocab = require('./storage-vocab');
var Document = require('./storage-document');
var Media = require('./storage-media');
var Log = require('./storage-log');
var FileSystem = require('./storage-filesystem');
var ETC = require('./storage-etc');
var util = require('../util');

/*
 * This is the storage "class" which defines how the database is structured and provides access as
 * well to the file system directory for media etc.
 *
 * It is divided up into a number of different functional parts, each of which is created here
 * and attached so that it can be used from anywhere.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

function log(message) {
//    console.log(message);
}

function Storage(home) {
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
    this.nonAdminGroupIdentifier = function (schemaName, groupIdentifier) {
        if (this.isShared(schemaName) && groupIdentifier == 'Schemaleon') return undefined;
        return groupIdentifier;
    };

    // locate a document from a given schema and with the given identifier and group identifier
    this.dataDocument = function (identifier, schemaName, groupIdentifier) {
        groupIdentifier = this.nonAdminGroupIdentifier(schemaName, groupIdentifier);
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
        groupIdentifier = this.nonAdminGroupIdentifier(schemaName, groupIdentifier);
        return "doc('" + this.database + this.dataDocument(identifier, schemaName, groupIdentifier) + "')/Document";
    };

    // locate a collection of documents, with optionally the schema and the group.  both are optional, because
    // this method is intended to be very flexible, especially for search
    this.dataCollection = function (schemaName, groupIdentifier) {
        groupIdentifier = this.nonAdminGroupIdentifier(schemaName, groupIdentifier);
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
                log('add ' + path);
//                log('add ' + path + ': ' + content);
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

    storage.session = new basex.Session();

    function getSchemaMap(afterGet) {
        storage.query(
            'get schema map',
                "doc('" + storage.database + "/schemas/SchemaMap.xml')/SchemaMap",
            function (schemaMapXml) {
                var primaryXml = util.getFromXml(schemaMapXml, 'primary');
                var sharedXml = util.getFromXml(schemaMapXml, 'shared');
                storage.schemaMap = {
                    primary: primaryXml.split(','),
                    shared: sharedXml.split(',')
                };
//                console.log('schema map', storage.schemaMap);
                afterGet(storage);
            }
        );
    }

    function openDatabase(afterOpen) {
        storage.session.execute('open ' + databaseName, function (error, reply) {
            storage.database = databaseName;

            if (reply.ok) {
                getSchemaMap(afterOpen);
            }
            else {
                storage.session.execute('create db ' + databaseName, function (error, reply) {
                    if (reply.ok) {
                        storage.session.execute('create index fulltext', function (er, rep) {
                            if (!rep.ok) {
                                console.error(er);
                            }
                            else {
                                storage.ETC.loadBootstrapData(false, function () {
                                    getSchemaMap(afterOpen);
                                });
                            }
                        });
                    }
                    else {
                        console.error('Unable to create database ' + databaseName);
                        console.error(error);
                        afterOpen(null);
                    }
                });
            }
        });
    }

    // clean everything if there is a to-be-used "BootstrapData" dir.
    if (fs.existsSync(storage.FileSystem.bootstrapDir)) {
        // we only want to use this once. rename it so it won't be found next time
        var newName = storage.FileSystem.bootstrapDir + '-Used';
        fs.renameSync(storage.FileSystem.bootstrapDir, newName);
        storage.FileSystem.bootstrapDir = newName;
        storage.session.execute('drop database ' + databaseName, function (error, reply) {
            if (error) {
                console.error("Unable to drop database: " + error);
            }
            else {
//                console.log("dropped database " + databaseName);
            }
            openDatabase(receiver);
        });
    }
    else {
        openDatabase(receiver);
    }

}

module.exports = open;
