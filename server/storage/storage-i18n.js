/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('../util');

/*
 * These methods allow access for reading and modifying the language translations and
 * field documentation stored in BaseX.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = I18N;

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
