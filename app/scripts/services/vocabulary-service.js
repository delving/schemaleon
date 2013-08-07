'use strict';

var OSCR = angular.module('OSCR');

OSCR.service("Vocabulary",
    function ($http) {

        this.getSchema = function (vocab, acceptVocabulary) {
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

        this.add = function (vocab, entry, acceptEntry) {
            $http.post('/vocabulary/' + vocab + "/add", entry)
                .success(function (data, status, headers, config) {
                    acceptEntry(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        };

    }
);