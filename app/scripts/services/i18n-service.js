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

var Schemaleon = angular.module('Schemaleon');

/**
 * Service for fetching and updating internationalization strings
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.service(
    "I18N",
    function ($http, $rootScope) {
        return {
            isReady: function () {
                return $rootScope.i18n;
            },
            title: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.element[key];
                    if (value) {
                        return value.title;
                    }
                }
                return null;
            },
            doc: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.element[key];
                    if (value) {
                        return value.doc;
                    }
                }
                return null;
            },
            label: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.label[key];
                    if (value) {
                        return value;
                    }
                }
                return null;
            },
            getList: function (lang, receiver) {
                $http.get('/i18n/' + lang).success(function (data) {
                    receiver(xmlToObject(data).Language);
                });
            },
            fetchList: function (lang) {
                $http.get('/i18n/' + lang).success(function (data) {
                    $rootScope.lang = lang;
                    var language = xmlToObject(data);
                    $rootScope.i18n = language.Language;
                });
            },
            setLabelAsync: function (lang, key, value, receiver) {
                $http.post('/i18n/' + lang + '/label', { key: key, label: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        receiver(language.Language);
                    }
                );
            },
            setLabel: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/label', { key: key, label: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                );
            },
            setTitleAsync: function (lang, key, value, receiver) {
                $http.post('/i18n/' + lang + '/element', { key: key, title: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        receiver(language.Language);
                    }
                );
            },
            setTitle: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/element', { key: key, title: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                );
            },
            setDocAsync: function (lang, key, value, receiver) {
                $http.post('/i18n/' + lang + '/element', { key: key, doc: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        receiver(language.Language);
                    }
                );
            },
            setDoc: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/element', { key: key, doc: value }).success(
                    function (data) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                );
            }
        };
    }
);
