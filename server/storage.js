'use strict';

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

storage.getLanguage = function (language, receiver) {
    var self = this;
    var query = self.session.query(langPath(language));
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            self.session.add(
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
        "if (exists(" + keyPath + ")) " +
        "then " +
        "replace value of node " + keyPath + " with '" + value + "' " +
        "else " +
        "insert node <" + key + ">" + value + "</" + key + "> into " + labelPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error;
        receiver(reply.ok);
    });
};

storage.setElementTitle = function (language, key, value, receiver) {
    var elementPath = langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    var query = "xquery " +
        "if (exists(" + keyPath + ")) " +
        "then " +
        "replace value of node " + titlePath + " with '" + value + "' " +
        "else " +
        "insert node <" + key + "><title>" + value + "</title><doc/></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error;
        receiver(reply.ok);
    });
};

storage.setElementDoc = function (language, key, value, receiver) {
    var elementPath = langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var docPath = keyPath + '/doc';
    var query = "xquery " +
        "if (exists(" + keyPath + ")) " +
        "then " +
        "replace value of node " + docPath + " with '" + value + "' " +
        "else " +
        "insert node <" + key + "><title/><doc>" + value + "</doc></" + key + "> into " + elementPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error;
        receiver(reply.ok);
    });
};

function vocabPath(vocabName) {
    return "doc('" + storage.database + "/VocabularySchemas')/VocabularySchemas/" + vocabName;
}

storage.getVocabularySchema = function (vocabName, receiver) {
    var self = this;
    var query = self.session.query(vocabPath(vocabName));
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw 'No vocabulary found with name ' + vocabName;
        }
    });
};

module.exports = storage;