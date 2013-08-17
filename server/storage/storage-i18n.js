'use strict';

module.exports = I18N;

function I18N(storage) {
    this.storage = storage;
}

var P = I18N.prototype;

P.getLanguage = function (language, receiver) {
    var s = this.storage;
    var query = s.query(s.langPath(language), null, function (result) {
        if (result) {
            receiver(result);
        }
        else {
            var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
            s.add(s.langDocument(language), initialXML, 'get language create ' + language, receiver);
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
    s.update(query, 'set label ' + language + ' ' + key + ' ' + value, receiver);
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
    s.update(query, 'set element title ' + language + ' ' + key + ' ' + value, receiver);
};

P.setElementDoc = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var entryPath = keyPath + '/doc';
    var query = [
        "if (exists(" + keyPath + "))",
        "then replace value of node " + entryPath + " with " + s.quote(value),
        "else insert node <" + key + "><title>?</title><doc>" + s.inXml(value) + "</doc></" + key + "> into " + elementPath
    ];
    s.update(query, 'set element doc ' + language + ' ' + key + ' ' + value, receiver);
};

