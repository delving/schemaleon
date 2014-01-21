'use strict';

var _ = require('underscore');
var fs = require('fs');
var archiver = require('archiver');
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
var Directories = require('../directories');

function log(message) {
//    console.log(message);
}

function Storage(home) {
    this.session = new basex.Session();
    this.directories = new Directories(home);
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
//    this.docDocument = function (schemaName, identifier) {
//        if (!schemaName) throw new Error("No schema name!");
//        if (!identifier) throw new Error("No identifier!");
//        return "/documents/" + schemaName + "/" + identifier + ".xml";
//    };
//
//    this.docPath = function (schemaName, identifier) {
//        return "doc('" + this.database + this.docDocument(schemaName, identifier) + "')/Document";
//    };
//
//    this.docCollection = function (schemaName) {
//        return "collection('" + this.database + "/documents/" + schemaName + "')";
//    };

    this.schemaMap = {
        primary: [ "Photo", "Film", "Memoriam", "Publication" ],
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
        if (isShared(schemaName)) {
            return "/shared/";
        }
        else {
            return "/primary/"; // includes MediaMetadata
        }
    };

    this.schemaDocument = function (schemaName) {
        return "/schemas" + schemaDir(schemaName) + "/" + schemaName + ".xml";
    };

    this.schemaPath = function (schemaName) {
        return "doc('" + this.database + this.schemaDocument(schemaName) + "')/" + schemaName;
    };

    this.dataDocument = function (identifier, schemaName, groupIdentifier) {
        if (groupIdentifier) {
            if (!this.isGroupSpecific(schemaName)) throw schemaName + " is not group specific!";
            return this.schemaDir(schemaName) + "/" + groupIdentifier + "/" + schemaName + "/" + identifier + ".xml";
        }
        else {
            if (!this.isShared(schemaName)) throw schemaName + " is not shared!";
            return this.schemaDir(schemaName) + "/" + schemaName + "/" + identifier + ".xml";
        }
    };

    this.dataPath = function (identifier, schemaName, groupIdentifier) {
        return "doc('" + this.database + this.dataDocument(identifier, schemaName, groupIdentifier) + "')/Document";
    };

    this.dataCollection = function (schemaName, groupIdentifier) {
        if (groupIdentifier) {
            return "collection('" + this.database + this.schemaDir(schemaName) + groupIdentifier + "/" + schemaName + "')";
        }
        else {
            return "collection('" + this.database + this.schemaDir(schemaName) + schemaName + "')";
        }
    };

    // =============

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

    this.getStatistics = function (receiver) { // TODO: CHANGE TO GLOBAL AND GROUP SPECIFIC
        this.query('get global statistics',
            [
                '<Statistics>',
                '  <People>',
                '    <Person>{ count(' + this.userCollection() + ') }</Person>',
                '    <Group>{ count(' + this.groupCollection() + ') }</Group>',
                '  </People>',
                '  <Documents>',
//                '    <Schema>',
//                '       <Name>Photo</Name>',
//                '       <Count>{ count(' + this.docCollection('Photo') + ') }</Count>',
//                '    </Schema>',
//                '    <Schema>',
//                '       <Name>Memoriam</Name>',
//                '       <Count>{ count(' + this.docCollection('Memoriam') + ') }</Count>',
//                '    </Schema>',
//                '    <Schema>',
//                '       <Name>Video</Name>',
//                '       <Count>{ count(' + this.docCollection('Video') + ') }</Count>',
//                '    </Schema>',
//                '    <Schema>',
//                '       <Name>Book</Name>',
//                '       <Count>{ count(' + this.docCollection('Book') + ') }</Count>',
//                '    </Schema>',
//                '  </Documents>',
                '</Statistics>'
            ],
            receiver
        );
    };

    this.refreshSchemas = function (receiver) {
        var session = this.session;
        var schemaFile = this.directories.schemaFile;
        var fileName = path.basename(schemaFile);
        var contents = fs.readFileSync(schemaFile, 'utf8');
        session.replace('/' + fileName, contents, function (error, reply) {
            if (reply.ok) {
                console.log("Reloaded: " + fileName);
            }
            else {
                console.error('Unable to refresh schemas');
                console.error(error);
            }
            receiver();
        });
    };

    this.snapshotName = function() {
        var now = new Date();
        var dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() +
            '-' + now.getHours() + '-' + now.getMinutes();
        return 'OSCR-Snapshot-' + dateString;
    };

    this.snapshotCreate = function (receiver) {
        var snapshotDir = this.snapshotName();
        var exportPath = this.directories.snapshot + '/' + snapshotDir;
        var zipFile = exportPath + '.zip';
        this.session.execute('export ' + exportPath, function () {
            var output = fs.createWriteStream(zipFile);
            var archive = archiver('zip');

            archive.on('error', function (err) {
                throw err;
            });
            output.on('close', function () {
                receiver(zipFile);
            });

            archive.pipe(output);

            function rmdir(dir) {
                var list = fs.readdirSync(dir);
                _.each(list, function (entry) {
                    if (entry[0] != '.') {
                        var fileName = path.join(dir, entry);
                        var stat = fs.statSync(fileName);
                        if (stat.isDirectory()) {
                            rmdir(fileName);
                        }
                        else {
                            fs.unlinkSync(fileName);
                        }
                    }
                });
                fs.rmdirSync(dir);
            }

            function appendToArchive(dir, zipPath) {
                var list = fs.readdirSync(dir);
                _.each(list, function (entry) {
                    if (entry[0] != '.') {
                        var fileName = path.join(dir, entry);
                        var stat = fs.statSync(fileName);
                        var zipFileName = zipPath + '/' + entry;
                        if (stat.isDirectory()) {
                            appendToArchive(fileName, zipFileName);
                        }
                        else {
                            archive.append(fs.createReadStream(fileName), { name: zipFileName });
                        }
                    }
                });
            }

            appendToArchive(exportPath, snapshotDir);
            rmdir(exportPath);

            archive.finalize(function (err, bytes) {
                if (err) {
                    throw err;
                }
                console.log(zipFile + ': ' + bytes + ' total bytes');
            });

        })
    };
}

function open(databaseName, homeDir, receiver) {

    var storage = new Storage(homeDir);

    storage.session.execute('open ' + databaseName, function (error, reply) {
        storage.database = databaseName;
        var promise = null;

        function loadPromise(filePath, docPath, replace) {
            var deferred = defer();
            log('load promise ' + filePath + ' to ' + docPath);
            fs.readFile(filePath, 'utf8', function (err, contents) {
                if (err) console.error(err);
                if (replace) {
                    storage.replace(null, docPath, contents, function (results) {
                        log('replaced ' + filePath + ' to ' + docPath);
                        deferred.resolve(results);
                    });
                }
                else {
                    storage.add(null, docPath, contents, function (results) {
                        log('added ' + filePath + ' to ' + docPath);
                        deferred.resolve(results);
                    });
                }
            });
            return deferred.promise;
        }

        function loadData(fsPath, docPath, replace) {
            log('loading data from ' + fsPath + ' to ' + docPath);
            var extension = ".xml";
            _.each(fs.readdirSync(fsPath), function (file) {
                if (file[0] == '.') return;
                var fileSystemPath = fsPath + '/' + file;
                var documentPath = docPath + file;
                if (fs.statSync(fileSystemPath).isDirectory()) {
                    log('load directory ' + fileSystemPath);
                    loadData(fileSystemPath, documentPath + '/', replace);
                }
                else if (file.lastIndexOf(extension) + extension.length == file.length) {
                    log("Load file: " + fileSystemPath);
                    if (promise) {
                        log('new promise for ' + documentPath);
                        promise = promise.then(function () {
                            return loadPromise(fileSystemPath, documentPath, replace);
                        });
                    }
                    else {
                        log('first promise for ' + documentPath);
                        promise = loadPromise(fileSystemPath, documentPath, replace);
                    }
                }
            });
        }

        function loadBootstrapData() {
            var dataPath = "../oscr-data";
            if (!fs.existsSync(dataPath)) {
                throw new Error("Cannot find "+dataPath+" for bootstrapping!");
            }
            dataPath = fs.realpathSync(dataPath);
            loadData(dataPath, '', false);
        }

        function finish() {
            if (!promise) {
                receiver(storage);
            }
            else {
                promise.then(
                    function () {
                        receiver(storage);
                    },
                    function (error) {
                        console.error("final problem! " + error);
                    }
                );
            }
        }

        if (reply.ok) {
            finish();
        }
        else {
            storage.session.execute('create db ' + databaseName, function (error, reply) {
                if (reply.ok) {
                    storage.session.execute('create index fulltext', function(er, rep) {
                        if (!reply.ok) {
                            console.error(er);
                        }
                        else {
                            loadBootstrapData();
                            finish();
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
