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
    var query = "xquery " +
        "if (exists(" + labelPath + "/" + key + ")) " +
        "then " +
        "replace value of node " + labelPath + "/" + key + " with '" + value + "'" +
        "else " +
        "insert node <" + key + ">" + value + "</" + key + "> into " + labelPath + " ";
    storage.session.execute(query, function (error, reply) {
        if (error) throw error;
        receiver(reply.ok);
    });
};

storage.addElementTitle = function (language, key, value, receiver) {
    storage.session.execute(
        "xquery insert node <" + key + ">" + value + "</" + key + "> " +
            "into doc('oscrtest/i18n/" + language + "')/Language/element",
        function (error, reply) {
            receiver(reply.ok);
        }
    );
};

module.exports = storage;