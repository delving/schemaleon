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
