'use strict';

var OSCR = angular.module('OSCR');

OSCR.service(
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
            },
            saveLanguage: function (lang, receiver) {
                $http.post('/i18n/' + lang + '/save').success(
                    function (data) {
                        var language = xmlToObject(data);
                        receiver(language.Language);
                    }
                );
            }
        };
    }
);
