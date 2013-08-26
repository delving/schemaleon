'use strict';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');

var Person = require('./storage-person');
var I18N = require('./storage-i18n');
var Vocab = require('./storage-vocab');
var Document = require('./storage-document');
var Media = require('./storage-media');
var ID = require('./storage-id');
var Util = require('./storage-util');
var Log = require('./storage-log');
var Directories = require('../directories');

function log(message) {
//    console.log(message);
}

function Storage(home) {
    this.session = new basex.Session();
    this.directories = new Directories(home);
    this.Util = new Util(this);
    this.ID = new ID(this);
    this.Person = new Person(this);
    this.I18N = new I18N(this);
    this.Vocab = new Vocab(this);
    this.Document = new Document(this);
    this.Media = new Media(this);
    this.Log = new Log(this);

    this.quote = function (value) {
        if (!value) return "''";
        return "'" + value.replace(/'/g, "\'\'") + "'";
    };

    this.inXml = function (value) {
        if (!value) return '';
        return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

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

    this.schemaPath = function () {
        return "doc('" + this.database + "/Schemas.xml')/Schemas";
    };

    this.vocabDocument = function (vocabName) {
        return "/vocabulary/" + vocabName + ".xml";
    };

    this.vocabPath = function (vocabName) {
        return "doc('" + this.database + this.vocabDocument(vocabName) + "')/Entries";
    };

    this.docDocument = function (schemaName, identifier) {
        if (!schemaName) throw new Error("No schema name!");
        if (!identifier) throw new Error("No identifier!");
        return "/documents/" + schemaName + "/" + identifier + ".xml";
    };

    this.docPath = function (schemaName, identifier) {
        return "doc('" + this.database + this.docDocument(schemaName, identifier) + "')/Document";
    };

    this.docCollection = function (schemaName) {
        return "collection('" + this.database + "/documents/" + schemaName + "')";
    };

    this.logDocument = function () {
        var now = new Date();
        return "/log/" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + ".xml";
    };

    this.logPath = function () {
        return "doc('" + this.database + this.logDocument() + "')";
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
                log('replace ' + path + ': ' + content);
                receiver(content);
            }
            else {
                reportError(message, error);
                receiver(null);
            }
        });
    };

    this.getStatistics = function (receiver) {
        this.query('get global statistics',
            [
                '<Statistics>',
                '  <People>',
                '    <Person>{ count(' + this.userCollection() + ') }</Person>',
                '    <Group>{ count(' + this.groupCollection() + ') }</Group>',
                '  </People>',
                '  <Documents>',
                '    <Schema>',
                '       <Name>Photograph</Name>',
                '       <Count>{ count(' + this.docCollection('Photograph') + ') }</Count>',
                '    </Schema>',
                '    <Schema>',
                '      <Name>ImageMetadata</Name>',
                '       <Count>{ count(' + this.docCollection('ImageMetadata') + ') }</Count>',
                '    </Schema>',
                '  </Documents>',
                '</Statistics>'
            ],
            receiver
        );
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

                function loadXML(fileName, next) {
                    var contents = fs.readFileSync('test/data/' + fileName, 'utf8');
                    storage.session.add('/' + fileName, contents, function (error, reply) {
                        if (reply.ok) {
//                            console.log("Preloaded: " + fileName);
                            if (next) next();
                        }
                        else {
                            console.error('Unable to create database ' + databaseName);
                            console.error(error);
                        }
                    });
                }

                if (reply.ok) {
                    loadXML('Schemas.xml', function () {
                        receiver(storage);
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
