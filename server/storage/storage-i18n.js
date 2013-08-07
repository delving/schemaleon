'use strict';

module.exports = I18N;

function I18N(storage) {
    this.storage = storage;
}

var P = I18N.prototype;

P.getLanguage = function (language, receiver) {
    var s = this.storage;
    var query = s.query(s.langPath(language));
    query.results(function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            s.session.add(
                s.langDocument(language),
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

P.setLabel = function (language, key, value, receiver) {
    var s = this.storage;
    var labelPath = s.langPath(language) + "/label";
    var keyPath = labelPath + '/' + key;
    var query = [
        "if (exists(" + keyPath + "))" ,
        "then replace value of node " + keyPath + " with " + s.quote(value),
        "else insert node <" + key + ">" + s.inXml(value) + "</" + key + "> into " + labelPath,
    ];
    s.xquery(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

P.setElementTitle = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    var query = [
        "if (exists(" + keyPath + "))",
        "then replace value of node " + titlePath + " with " + s.quote(value),
        "else insert node <" + key + "><title>" + s.inXml(value) + "</title><doc>?</doc></" + key + "> into " + elementPath
    ];
    s.xquery(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

P.setElementDoc = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var docPath = keyPath + '/doc';
    var query = [
        "if (exists(" + keyPath + "))",
        "then replace value of node " + docPath + " with " + s.quote(value),
        "else insert node <" + key + "><title>?</title><doc>" + s.inXml(value) + "</doc></" + key + "> into " + elementPath
    ];
    s.xquery(query, function (error, reply) {
        if (error) throw error + "\n" + query;
        receiver(reply.ok);
    });
};

