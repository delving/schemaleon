'use strict';

var fs = require('fs');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');

var Image = require('./storage-image');
var I18N = require('./storage-i18n');
var Vocab = require('./storage-vocab');
var Document = require('./storage-document');

function Storage() {
    var self = this;
    this.session = new basex.Session();
    this.imageRoot = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/OSCR-Images';

    this.generateId = function (prefix) {
        var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
        return prefix + '-' + millisSince2013.toString(36) + '-' + Math.floor(Math.random() * 36 * 36 * 36).toString(36);
    };

    this.bucketName = function (fileName) { // assumes file name is = generateId() + '.???'
        var rx = /.*-.([a-z0-9]{2})\..../g;
        return rx.exec(fileName)[1];
    };

    this.quote = function (value) {
        if (!value) return "''";
        return "'" + value.replace(/'/g, "\'\'") + "'";
    };

    this.inXml = function (value) {
        if (!value) return '';
        return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    this.objectToXml = function (object, tag) {
        var xml = "<" + tag + ">";
        for (var key in object) {
            xml += "<" + key + ">" + this.inXml(object[key]) + "</" + key + ">";
        }
        xml += "</" + tag + ">";
        return xml;
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
        return "doc('" + this.database + this.vocabDocument(vocabName) + "')/Entries";
    };

    this.docDocument = function (identifier) {
        return "/documents/" + identifier + ".xml";
    };

    this.docPath = function (identifier) {
        return "doc('" + this.database + this.docDocument(identifier) + "')/Document";
    };

    this.imageDocument = function (fileName) {
        return "/images/" + fileName + ".xml";
    };

    this.imagePath = function (fileName) {
        return "doc('" + this.database + this.imageDocument(fileName) + "')/Image";
    };

    this.Image = new Image(this);

    this.I18N = new I18N(this);

    this.Vocab = new Vocab(this);

    this.Document = new Document(this);

}

function open(databaseName, receiver) {
    var storage = new Storage();
    storage.session.execute('open ' + databaseName, function (error, reply) {
        storage.database = databaseName;
        if (reply.ok) {
            console.log(reply.info);
            receiver(storage);
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

                console.log("created!"); // todo
                if (reply.ok) {
                    preload('VocabularySchemas.xml', function () {
                        preload('DocumentSchemas.xml', function() {
                            receiver(storage);
                        });
                    });
                }
                else {
                    throw error;
                }
            });
        }
    });
}

module.exports = open;
