'use strict';

var fs = require('fs');
var basex = require('basex');
//basex.debug_mode = true;

var storage = {
    database: 'oscrtest',
    session: new basex.Session()
};

function langDocument(language) {
    return "/i18n/" + language;
}

function langPath(language) {
    return "doc('" + storage.database + langDocument(language) + "')/Language";
}

function quote(value) {
    return "'" + value.replace(/'/g, "\'\'") + "'";
}

function inXml(value) {
    return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

storage.useDatabase = function (name, receiver) {
    storage.database = name;
    storage.session.execute('open ' + name, function (error, reply) {
        if (reply.ok) {
            console.log(reply.info);
            receiver(name);
        }
        else {
            console.log('could not open database ' + name);
            storage.session.execute('create db ' + name, function (error, reply) {
                function preload(name, next) {
                    var contents = fs.readFileSync('test/data/'+name+'.xml', 'utf8');
                    storage.session.add('/'+name, contents, function (error, reply) {
                        if (reply.ok) {
                            console.log("Preloaded: "+name);
                            if (next) next();
                        }
                        else {
                            throw error;
                        }
                    });
                }

                if (reply.ok) {
                    preload('VocabularySchemas', function() {
                        preload('DocumentSchemas');
                    });
                    receiver(name);
                }
                else {
                    throw error;
                }
            });
        }
    });
};

storage.getLanguage = function (language, receiver) {
    var query = storage.session.query(langPath(language));
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            storage.session.add(
                langDocument(language),
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
    var labelPath = langPath(language) + "/label";
    var keyPath = labelPath + '/' + key;
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + keyPath + " with " + quote(value) +
        " else " +
        "insert node <" + key + ">" + inXml(value) + "</" + key + "> into " + labelPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.setElementTitle = function (language, key, value, receiver) {
    var elementPath = langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + titlePath + " with " + quote(value) +
        " else " +
        "insert node <" + key + "><title>" + inXml(value) + "</title><doc>?</doc></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.setElementDoc = function (language, key, value, receiver) {
    var elementPath = langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var docPath = keyPath + '/doc';
    var query = "xquery " +
        "if (exists(" + keyPath + "))" +
        " then " +
        "replace value of node " + docPath + " with " + quote(value) +
        " else " +
        "insert node <" + key + "><title>?</title><doc>" + inXml(value) + "</doc></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

storage.getVocabularySchema = function (vocabName, receiver) {
    var query = storage.session.query("doc('" + storage.database + "/VocabularySchemas')/VocabularySchemas/" + vocabName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No vocabulary schema found with name ' + vocabName;
        }
    });
};

function vocabDocument(vocabName) {
    return "/vocabulary/" + vocabName;
}

function vocabPath(vocabName) {
    return "doc('" + storage.database + vocabDocument(vocabName) + "')/Entries";
}

storage.createVocabulary = function(vocabName, entryXml, receiver) {
    var freshVocab = "<Entries>" + entryXml + "</Entries>";
    storage.session.add(vocabDocument(vocabName), freshVocab, function (error, reply) {
        if (reply.ok) {
            console.log("Created vocabulary "+vocabName);
            receiver(entryXml);
        }
        else {
            throw 'Unable to create vocabulary '+vocabName+" with entry "+entryXml;
        }
    });
};

storage.addVocabularyEntry = function (vocabName, entry, receiver) {
    console.log('addVocabularyEntry'); // todo
    console.log(entry); // todo
    var entryPath = vocabPath(vocabName) + "[ID=" + quote(entry.ID) + "]";
    var entryXml = "<Entry>";
    for (var key in entry) {
        entryXml += "<" + key + ">" + inXml(entry[key]) + "</" + key + ">";
    }
    entryXml += "</Entry>";
    var query = "xquery " +
        "if (exists(" + entryPath + "))" +
        " then " +
        "replace value of node " + entryPath + " with " + entryXml +
        " else " +
        "insert node " + entryXml + " into " + vocabPath(vocabName);
    storage.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(entryXml);
        }
        else {
            storage.createVocabulary(vocabName, entryXml, function(xml) {
                receiver(xml);
            });
        }
    });
};

storage.getVocabularyEntries = function(vocabName, search, receiver) {
    var searchPath = vocabPath(vocabName) + "/Entry[contains(lower-case(Label), " + quote(search) + ")]";
    var query = "xquery "+searchPath;
    storage.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            // todo: make sure there's not one already and the problem was something else
            storage.createVocabulary(vocabName, '', function(xml) {
                receiver('');
            });
        }
    });
};

storage.getDocumentSchema = function (schemaName, receiver) {
    var query = storage.session.query("doc('" + storage.database + "/DocumentSchemas')/DocumentSchemas/" + schemaName);
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No document schema found with name ' + schemaName;
        }
    });
};


module.exports = storage;