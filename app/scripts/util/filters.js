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

var OSCR = angular.module('OSCR');

/**
 * Various filters used throughout the app.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

// filter either an element or an identifier to pick up thumbmnail
OSCR.filter('mediaThumbnail',
    function () {
        return function (source) {
            if (source.value && source.config.media) {
                return '/media/thumbnail/' + source.value.Identifier;
            }
            else if (_.isString(source)) {
                return '/media/thumbnail/' + source; // just an identifier
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaFile',
    function () {
        return function (source) {
            if (source.value && source.config.media) {
                return '/media/file/' + source.value.Identifier;
            }
            else if (_.isString(source)) {
                return '/media/file/' + source;
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaMimeType',
    function () {
        return function (source) {
            if (!source) return '';
            if (source.value) {
                return source.value.MimeType;
            }
            else if (source.Body) {
                return source.Body.MediaMetadata.MimeType;
            }
            else if (_.isString(source)) {
                return source;
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaFileName',
    function () {
        return function (source) {
            if (!source) return '';
            if (source.value) {
                return source.value.FileName;
            }
            else if (source.Body) {
                return source.Body.MediaMetadata.FileName;
            }
            else if (_.isString(source)) {
                return source;
            }
            else {
                return '';
            }
        };
    }
);

OSCR.filter('elementDisplay',
    function () {
        return function (element) {
            if (!element.value) {
                return 'empty';
            }
            else if (element.config.vocabulary) {
                return element.value.Label; // todo
            }
            else if (element.config.media) {
                return element.value.Identifier;
            }
            else {
                return element.value;
            }
        };
    }
);

OSCR.filter(
    'logDetails',
    function () {
        return function (entry, type) {
            if (entry) {
                switch (entry.Op) {
                    case 'Authenticate':
                        return '-';
                    case 'TranslateTitle':
                    case 'TranslateDoc':
                    case 'TranslateLabel':
                        return entry.Lang + ':' + entry.Key + '=' + entry.Value.replace(/\n/g, ' ');
                        break;
                    case 'SaveGroup':
                        return entry.Identifier;
                    case 'AddUserToGroup':
                    case 'RemoveUserFromGroup':
                        return entry.UserIdentifier + ':' + entry.UserRole + ' ' + entry.GroupIdentifier;
                    case 'AddVocabularyEntry':
                        return entry.Vocabulary + ':' + entry.Entry.Identifier;
                    case 'SaveDocument':
                        return entry.Identifier;
                }
            }
            return '??';
        };
    }
);

OSCR.filter(
    'invalidMessage',
    function (I18N) {
        return function (element) {
            if (I18N.isReady()) {
                var message = I18N.label(element.invalidMessage);
                if (message) return message;
            }
            return element.invalidMessage;
        };
    }
);


OSCR.filter(
    'linkTitle',
    function (I18N) {
        return function (link) {
            if (!link) return '';
            if (I18N.isReady()) {
                var title = I18N.label(link.name);
                if (title) return title;
            }
            return link.name;
        };
    }
);

OSCR.filter(
    'elementTitle',
    function (I18N) {
        return function (element) {
            if (!element) return '';
            if (element.title) {
                if (element.title != '?') return element.title;
            }
            else if (I18N.isReady()) {
                var title = I18N.title(element.name);
                if (title) {
                    element.title = title;
                    return title;
                }
            }
            return element.name;
        };
    }
);

OSCR.filter(
    'elementDoc',
    function (I18N) {
        return function (element) {
            if (!element) return '';
            if (element.doc) {
                if (element.doc != '?') return element.doc;
            }
            else if (I18N.isReady()) {
                var doc = I18N.doc(element.name);
                if (doc) {
                    element.doc = doc;
                    return doc;
                }
            }
            return element.name;
        };
    }
);
