'use strict';

module.exports = I18N;

function I18N(storage) {
    this.storage = storage;
}

var P = I18N.prototype;

P.getLanguage = function (language, receiver) {
    var s = this.storage;
    var query = s.query(null,
        s.langPath(language),
        function (result) {
            if (result) {
                receiver(result);
            }
            else {
                var initialXML = '<Language>\n  <label/>\n  <element/>\n</Language>';
                s.add('get language create ' + language,
                    s.langDocument(language),
                    initialXML,
                    receiver
                );
            }
        }
    );
};

P.setLabel = function (language, key, value, receiver) {
    var s = this.storage;
    var labelPath = s.langPath(language) + "/label";
    var keyPath = labelPath + '/' + key;
    s.update('set label ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))" ,
            "then replace value of node " + keyPath + " with " + s.quote(value),
            "else insert node <" + key + ">" + s.inXml(value) + "</" + key + "> into " + labelPath,
        ],
        receiver
    );
};

P.setElementTitle = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    s.update('set element title ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))",
            "then replace value of node " + titlePath + " with " + s.quote(value),
            "else insert node <" + key + "><title>" + s.inXml(value) + "</title><doc>?</doc></" + key + "> into " + elementPath
        ],
        receiver
    );
};

P.setElementDoc = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var entryPath = keyPath + '/doc';
    s.update('set element doc ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))",
            "then replace value of node " + entryPath + " with " + s.quote(value),
            "else insert node <" + key + "><title>?</title><doc>" + s.inXml(value) + "</doc></" + key + "> into " + elementPath
        ],
        receiver
    );
};

