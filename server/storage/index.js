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
var Directories = require('../directories');

function Storage(home) {
    this.session = new basex.Session();
    this.directories = new Directories(home);

    function generateId(prefix) {
        var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
        var randomNumber = 0;//Math.floor(Math.random() * 36 * 36 * 36);
        var randomString = randomNumber.toString(36);
        while (randomString.length < 3) {
            randomString = '0' + randomString;
        }
        return 'OSCR-' + prefix + '-' + millisSince2013.toString(36) + '-' + randomString;
    }

    this.generateUserId = function () {
        return generateId('US');
    };

    this.generateGroupId = function () {
        return generateId('GR');
    };

    this.generateDocumentId = function () {
        return generateId('DO');
    };

    this.generateImageId = function () {
        return generateId('IM');
    };

    this.generateVocabId = function () {
        return generateId('VO');
    };

    this.generateCollectionId = function () {
        return generateId('CO');
    };

    this.getFromXml = function (xml, tag) {
        var start = xml.indexOf('<' + tag + '>');
        if (start >= 0) {
            var end = xml.indexOf('</' + tag + '>', start);
            if (end > 0) {
                start += tag.length + 2;
                return xml.substring(start, end);
            }
        }
        return '';
    };

    this.quote = function (value) {
        if (!value) return "''";
        return "'" + value.replace(/'/g, "\'\'") + "'";
    };

    this.inXml = function (value) {
        if (!value) return '';
        return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    this.emailToUserDocument = function (value) {
        if (!value) throw 'Empty email';
        return value.replace(/[^\w]/g, '_');
    };

    this.objectToXml = function (object, tag) {
        var self = this;
        var out = [];

        function indent(string, level) {
            return new Array(level).join('  ') + string;
        }

        function objectConvert(from, level) {
            for (var key in from) {
                var value = from[key];
                if (_.isString(value)) {
                    out.push(indent('<' + key + '>', level) + self.inXml(value) + '</' + key + '>');
                }
                else if (_.isArray(value)) {
                    _.each(value, function (item) {
                        if (_.isString(item)) {
                            out.push(indent('<' + key + '>', level) + self.inXml(item) + '</' + key + '>');
                        }
                        else {
                            out.push(indent('<' + key + '>', level));
                            objectConvert(item, level + 1);
                            out.push(indent('</' + key + '>', level));
                        }
                    });
                }
                else if (_.isObject(value)) {
                    out.push(indent('<' + key + '>', level));
                    objectConvert(value, level + 1);
                    out.push(indent('</' + key + '>', level));
                }
            }
        }

        out.push("<" + tag + ">");
        objectConvert(object, 2);
        out.push("</" + tag + ">");
        return out.join('\n');
    };

    this.userDocument = function (email) {
        return "/people/users/" + this.emailToUserDocument(email) + ".xml";
    };

    this.userPath = function (email) {
        return "doc('" + this.database + this.userDocument(email) + "')/User";
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

    function reportError(errorMessage, error) {
        if (errorMessage) {
            console.error(errorMessage);
            console.error(error);
        }
    }

    this.query = function (query, errorMessage, receiver) {
        if (_.isArray(query)) {
            query = query.join('\n');
        }
        this.session.execute('xquery \n' + query, function (error, reply) {
            if (reply.ok) {
                receiver(reply.result);
            }
            else {
                reportError(errorMessage, error);
                receiver(null);
            }
        });
    };

    this.update = function (query, errorMessage, receiver) {
        if (_.isArray(query)) {
            query = query.join('\n');
        }
        this.session.execute('xquery \n' + query, function (error, reply) {
            if (reply.ok) {
                receiver(true);
            }
            else {
                reportError(errorMessage, error);
                receiver(false);
            }
        });
    };

    this.add = function (path, content, errorMessage, receiver) {
        this.session.add(path, content, function (error, reply) {
            if (reply.ok) {
                receiver(content);
            }
            else {
                reportError(errorMessage, error);
                receiver(null);
            }
        });
    };

    this.replace = function (path, content, errorMessage, receiver) {
        this.session.replace(path, content, function (error, reply) {
            if (reply.ok) {
                receiver(content);
            }
            else {
                reportError(errorMessage, error);
                receiver(null);
            }
        });
    };

    this.Person = new Person(this);

    this.I18N = new I18N(this);

    this.Vocab = new Vocab(this);

    this.Document = new Document(this);

    this.Media = new Media(this);

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
