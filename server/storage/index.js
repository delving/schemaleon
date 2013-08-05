'use strict';

var fs = require('fs');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');

var Image = require('./storage-image');
var I18N = require('./storage-i18n');
var Vocab = require('./storage-vocab');
var Document = require('./storage-document');

function getUserHome() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var storage = {

    database: 'oscrtest',

    useDatabase: function (databaseName, receiver) {
        storage.database = databaseName;
        storage.session.execute('open ' + databaseName, function (error, reply) {
            if (reply.ok) {
                console.log(reply.info);
                receiver(databaseName);
            }
            else {
                console.log('could not open database ' + databaseName);
                storage.session.execute('create db ' + databaseName, function (error, reply) {

                    function preload(fileName, next) {
                        var contents = fs.readFileSync('test/data/' + fileName, 'utf8');
                        storage.session.add('/' + fileName, contents, function (error, reply) {
                            if (reply.ok) {
                                console.log("Preloaded: " + fileName);
                                if (next) next();
                            }
                            else {
                                throw error;
                            }
                        });
                    }

                    if (reply.ok) {
                        preload('VocabularySchemas.xml', function () {
                            preload('DocumentSchemas.xml');
                        });
                        receiver(databaseName);
                    }
                    else {
                        throw error;
                    }
                });
            }
        });
    },

    session: new basex.Session(),

    imageRoot: getUserHome() + '/OSCR-Images',

    generateId: function (prefix) {
        var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
        return prefix + '-' + millisSince2013.toString(36) + '-' + Math.floor(Math.random() * 36 * 36 * 36).toString(36);
    },

    bucketName: function (fileName) { // assumes file name is = generateId() + '.???'
        var rx = /.*-.([a-z0-9]{2})\..../g;
        return rx.exec(fileName)[1];
    },

    quote: function (value) {
        if (!value) return "''";
        return "'" + value.replace(/'/g, "\'\'") + "'";
    },

    inXml: function (value) {
        if (!value) return '';
        return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },

    objectToXml: function (object, tag) {
        var xml = "<" + tag + ">";
        for (var key in object) {
            xml += "<" + key + ">" + this.inXml(object[key]) + "</" + key + ">";
        }
        xml += "</" + tag + ">";
        return xml;
    },

    langDocument: function (language) {
        return "/i18n/" + language + ".xml";
    },

    langPath: function (language) {
        return "doc('" + this.database + this.langDocument(language) + "')/Language";
    },

    vocabDocument: function (vocabName) {
        return "/vocabulary/" + vocabName + ".xml";
    },

    vocabPath: function (vocabName) {
        return "doc('" + this.database + this.vocabDocument(vocabName) + "')/Entries";
    },

    docDocument: function (identifier) {
        return "/documents/" + identifier + ".xml";
    },

    docPath: function (identifier) {
        return "doc('" + this.database + this.docDocument(identifier) + "')/Document";
    },

    imageDocument: function (fileName) {
        return "/images/" + fileName + ".xml";
    },

    imagePath: function (fileName) {
        return "doc('" + this.database + this.imageDocument(fileName) + "')/Image";
    }

};

storage.Image = new Image(storage);

storage.I18N = new I18N(storage);

storage.Vocab = new Vocab(storage);

storage.Document = new Document(storage);

module.exports = storage;