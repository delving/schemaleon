'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("I18N",
    function ($http, $rootScope) {
        return {
            fetchList: function (lang) {
                $http.get('/i18n/' + lang)
                    .success(function (data, status, headers, config) {
                        $rootScope.i18n = data;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
            isReady: function() {
                return $rootScope.i18n;
            },
            title: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.element[key];
                    if (value) return value.title;
                }
                return null;
            },
            doc: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.element[key];
                    if (value) return value.doc;
                }
                return null;
            },
            label: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n.label[key];
                    if (value) return value;
                }
                return key;
            },
            setTitle: function(lang, key, value) {
                $http.post('/i18n/' + lang+ '/element', { key: key, title: value })
                    .success(function (data, status, headers, config) {
                        $rootScope.i18n = data;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
            setDoc: function(lang, key, value) {
                $http.post('/i18n/' + lang+ '/element', { key: key, doc: value })
                    .success(function (data, status, headers, config) {
                        $rootScope.i18n = data;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            }
        };
    }
);

CultureCollectorApp.service("Documents",
    function ($http, $log) {
        this.fetchDocument = function (identifier, success) {
            $http.get('/document/' + identifier)
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert('Problem fetching document');
                });
        };
    }
);

CultureCollectorApp.service("ObjectList",
    function ($http) {
        this.fetchList = function (success) {
            $http.get('/doclist')
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert('Problem fetching document list');
                });
        };
    }
);

CultureCollectorApp.service("Vocabulary",
    function ($http) {

        this.get = function(vocab, acceptVocabulary) {
            $http.get('/vocabulary/' + vocab)
                .success(function (data, status, headers, config) {
                    acceptVocabulary(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        };

        this.select = function (vocab, query, acceptList) {
            $http.get('/vocabulary/' + vocab + "/select", {params: {q: query}})
                .success(function (data, status, headers, config) {
                    acceptList(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        };

        this.add = function (vocab, entry, acceptVocabulary) {
            $http.post('/vocabulary/' + vocab + "/add", entry)
                .success(function (data, status, headers, config) {
                    acceptVocabulary(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        }

    }
);