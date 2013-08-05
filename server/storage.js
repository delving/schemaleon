'use strict';

var fs = require('fs');
var basex = require('basex');//basex.debug_mode = true;
var im = require('imagemagick');

function getUserHome() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var storage = {

    database: 'oscrtest',

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
        return "'" + value.replace(/'/g, "\'\'") + "'";
    },

    inXml: function (value) {
        return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },

    langDocument: function (language) {
        return "/i18n/" + language + ".xml";
    },

    langPath: function (language) {
        return "doc('" + storage.database + this.langDocument(language) + "')/Language";
    },

    vocabDocument: function (vocabName) {
        return "/vocabulary/" + vocabName + ".xml";
    },

    vocabPath: function (vocabName) {
        return "doc('" + storage.database + this.vocabDocument(vocabName) + "')/Entries";
    },

    docDocument: function (identifier) {
        return "/documents/" + identifier + ".xml";
    },

    docPath: function (identifier) {
        return "doc('" + storage.database + this.docDocument(identifier) + "')/Document";
    }

};

storage.useDatabase = function (databaseName, receiver) {
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
};

storage.getLanguage = function (language, receiver) {
    var self = this;
    var query = storage.session.query(self.langPath(language));
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            storage.session.add(
                self.langDocument(language),
                initialXML,
                function (error, reply) {
                    if (reply.ok) {
                        receiver(initialXML);
                    }
                    else {
                        throw 'Unable to add initial XML for language ' + language;
                    }
                }
            );
        }
    });
};

storage.setLabel = function (language, key, value, receiver) {
    var labelPath = this.langPath(language) + "/label";
    var keyPath = labelPath + '/' + key;
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + keyPath + " with " + this.quote(value) +
        " else " +
        "insert node <" + key + ">" + this.inXml(value) + "</" + key + "> into " + labelPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.setElementTitle = function (language, key, value, receiver) {
    var elementPath = this.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + titlePath + " with " + this.quote(value) +
        " else " +
        "insert node <" + key + "><title>" + this.inXml(value) + "</title><doc>?</doc></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.setElementDoc = function (language, key, value, receiver) {
    var elementPath = this.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var docPath = keyPath + '/doc';
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + docPath + " with " + this.quote(value) +
        " else " +
        "insert node <" + key + "><title>?</title><doc>" + this.inXml(value) + "</doc></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.getVocabularySchema = function (vocabName, receiver) {
    var query = storage.session.query("doc('" + storage.database + "/VocabularySchemas.xml')/VocabularySchemas/" + vocabName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No vocabulary schema found with name ' + vocabName;
        }
    });
};

storage.createVocabulary = function (vocabName, entryXml, receiver) {
    var freshVocab = "<Entries>" + entryXml + "</Entries>";
    storage.session.add(this.vocabDocument(vocabName), freshVocab, function (error, reply) {
        if (reply.ok) {
            console.log("Created vocabulary " + vocabName);
            receiver(entryXml);
        }
        else {
            throw 'Unable to create vocabulary ' + vocabName + " with entry " + entryXml;
        }
    });
};

storage.addVocabularyEntry = function (vocabName, entry, receiver) {
    var self = this;
    console.log('addVocabularyEntry'); // todo
    console.log(entry); // todo

    function entryToXML(entry) {
        var xml = "<Entry>";
        for (var key in entry) {
            xml += "<" + key + ">" + self.inXml(entry[key]) + "</" + key + ">";
        }
        xml += "</Entry>";
        return xml;
    }

    var entryPath, entryXml, query;
    if (entry.ID) {
        entryPath = self.vocabPath(vocabName) + "[ID=" + this.quote(entry.ID) + "]";
        entryXml = entryToXML(entry);
        query = "xquery replace value of node " + entryPath + " with " + entryXml;
        storage.session.execute(query, function (error, reply) {
            if (reply.ok) {
                receiver(entryXml);
            }
            else {
                storage.createVocabulary(vocabName, entryXml, function (xml) {
                    receiver(xml);
                });
            }
        });
    }
    else {
        entry.ID = this.generateId("OSCR-V");
        entryXml = entryToXML(entry);
        query = "xquery insert node " + entryXml + " into " + self.vocabPath(vocabName);
        storage.session.execute(query, function (error, reply) {
            if (reply.ok) {
                receiver(entryXml);
            }
            else {
                storage.createVocabulary(vocabName, entryXml, function (xml) {
                    receiver(xml);
                });
            }
        });
    }
};

storage.getVocabularyEntries = function (vocabName, search, receiver) {
    var searchPath = this.vocabPath(vocabName) + "/Entry[contains(lower-case(Label), " + this.quote(search) + ")]";
    var query = "xquery " + searchPath;
    storage.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            // todo: make sure there's not one already and the problem was something else
            storage.createVocabulary(vocabName, '', function (xml) {
                receiver('');
            });
        }
    });
};

storage.getDocumentSchema = function (schemaName, receiver) {
    var query = storage.session.query("doc('" + storage.database + "/DocumentSchemas.xml')/DocumentSchemas/" + schemaName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No document schema found with name ' + schemaName;
        }
    });
};

storage.getDocumentList = function (receiver) {
    var query = "xquery collection('" + storage.database + "/documents')/Document/Header";
    storage.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

storage.getDocument = function (identifier, receiver) {
    var query = "xquery " + this.docPath(identifier);
    storage.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

storage.saveDocument = function (body, receiver) {
    var self = this;
    var IDENTIFIER = '#IDENTIFIER#';
    var TIMESTAMP = '#TIMESTAMP#';
    var time = new Date().getTime();
    body.header.TimeStamp = time;
    if (body.header.Identifier === IDENTIFIER) {
        console.log("here we are in saveDocument");// todo
        var identifier = this.generateId("OSCR-D");
        body.header.Identifier = identifier;
        var withIdentifier = body.xml.replace(IDENTIFIER, identifier);
        var withTimesStamp = withIdentifier.replace(TIMESTAMP, time);
        storage.session.add(this.docDocument(identifier), withTimesStamp, function (error, reply) {
            console.log("here we are in saveDocument adding " + error);// todo
            if (reply.ok) {
                receiver(body.header);
            }
            else {
                throw error + "\n" + query;
            }
        });
    }
    else {
        // todo: move the current one to the backup collection
        var stamped = body.xml.replace(TIMESTAMP, time);
        storage.session.replace(this.docDocument(body.header.Identifier), stamped, function (error, reply) {
            if (reply.ok) {
                receiver(body.header);
            }
            else {
                throw "Unable to replace " + self.docPath(body.header.Identifier);
            }
        });
    }
};

storage.saveImage = function (imageData, receiver) {

    function copyFile(source, target, cb) {
        var cbCalled = false;

        var rd = fs.createReadStream(source);
        rd.on("error", function (err) {
            done(err);
        });
        var wr = fs.createWriteStream(target);
        wr.on("error", function (err) {
            done(err);
        });
        wr.on("close", function (ex) {
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                cb(err);
                cbCalled = true;
            }
        }
    }

    function createFileName() {
        var fileName = storage.generateId("OSCR-I");
        switch (imageData.mimeType) {
            case 'image/jpeg':
                fileName += '.jpg';
                break;
            case 'image/png':
                fileName += '.png';
                break;
            case 'image/gif':
                fileName += '.gif';
                break;
            default:
                throw "Unknown mime type: " + imageData.mimeType;
                break;
        }
        return fileName;
    }

    if (!fs.existsSync(imageData.filePath)) {
        throw 'Cannot find image file ' + imageData.filePath;
    }
    if (!fs.existsSync(this.imageRoot)) {
        fs.mkdirSync(this.imageRoot);
    }
    var fileName = createFileName();
    var bucketName = storage.bucketName(fileName);
    var bucketPath = this.imageRoot + '/' + bucketName;
    if (!fs.existsSync(bucketPath)) {
        fs.mkdirSync(bucketPath);
    }
    copyFile(imageData.filePath, bucketPath + '/' + fileName, function (err) {
        if (err) throw err;
        receiver(fileName);
    });
};

storage.listImages = function (done) {
    var walk = function (dir, done) {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) done(err); else {
                var pending = list.length;
                if (!pending) done(null, results); else {
                    list.forEach(function (file) {
                        file = dir + '/' + file;
                        fs.stat(file, function (err, stat) {
                            if (stat && stat.isDirectory()) {
                                walk(file, function (err, res) {
                                    results = results.concat(res);
                                    if (!--pending) done(null, results);
                                });
                            }
                            else {
                                results.push(file);
                                if (!--pending) done(null, results);
                            }
                        });
                    });
                }
            }
        });
    };
    walk(storage.imageRoot, done);
};

module.exports = storage;