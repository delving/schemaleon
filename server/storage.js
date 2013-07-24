'use strict';

var basex = require('basex');
//basex.debug_mode = true;

var storage = {
    session: new basex.Session()
};

storage.getLanguage = function (language, receiver) {
    var self = this;
    var query = self.session.query('doc("oscrtest/i18n/' + language + '")/*');
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            self.session.add(
                '/i18n/' + language,
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
    var labelPath = "doc('oscrtest/i18n/" + language + "')/Language/label";
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
    var elementPath = "doc('oscrtest/i18n/" + language + "')/Language/element";
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
    var elementPath = "doc('oscrtest/i18n/" + language + "')/Language/element";
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

module.exports = storage;