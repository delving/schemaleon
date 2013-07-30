'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("I18N",
    function ($http, $rootScope) {
        return {
            fetchList: function (lang) {
                $http.get('/i18n/' + lang)
                    .success(function (data, status, headers, config) {
                        $rootScope.lang = lang;
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
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
            setLabel: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/label', { key: key, label: value })
                    .success(function (data, status, headers, config) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
            setTitle: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/element', { key: key, title: value })
                    .success(function (data, status, headers, config) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
            setDoc: function (key, value) {
                $http.post('/i18n/' + $rootScope.lang + '/element', { key: key, doc: value })
                    .success(function (data, status, headers, config) {
                        var language = xmlToObject(data);
                        $rootScope.i18n = language.Language;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            }
        };
    }
);
