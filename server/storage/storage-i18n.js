// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

'use strict';

/*

    These methods allow access for reading and modifying the language translations and
    field documentation stored in BaseX.

    Author: Gerald de Jong <gerald@delving.eu>

 */

module.exports = I18N;
var fs = require('fs');
var path = require('path');
var util = require('../util');

function I18N(storage) {
    this.storage = storage;
}

var P = I18N.prototype;

// get a whole language file, or create it if there isn't one
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

// set a particular translation key
P.setLabel = function (language, key, value, receiver) {
    var s = this.storage;
    var labelPath = s.langPath(language) + "/label";
    var keyPath = labelPath + '/' + key;
    s.update('set label ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))" ,
            "then replace value of node " + keyPath + " with " + util.quote(value),
            "else insert node <" + key + ">" + util.inXml(value) + "</" + key + "> into " + labelPath,
        ],
        receiver
    );
};

// set the translated value of a given schema element name
P.setElementTitle = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var titlePath = keyPath + '/title';
    s.update('set element title ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))",
            "then replace value of node " + titlePath + " with " + util.quote(value),
            "else insert node <" + key + "><title>" + util.inXml(value) + "</title><doc>?</doc></" + key + "> into " + elementPath
        ],
        receiver
    );
};

// set the documentation value of a given schema element name
P.setElementDoc = function (language, key, value, receiver) {
    var s = this.storage;
    var elementPath = s.langPath(language) + "/element";
    var keyPath = elementPath + '/' + key;
    var entryPath = keyPath + '/doc';
    s.update('set element doc ' + language + ' ' + key + ' ' + value,
        [
            "if (exists(" + keyPath + "))",
            "then replace value of node " + entryPath + " with " + util.quote(value),
            "else insert node <" + key + "><title>?</title><doc>" + util.inXml(value) + "</doc></" + key + "> into " + elementPath
        ],
        receiver
    );
};
