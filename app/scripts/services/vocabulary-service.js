'use strict';

var OSCR = angular.module('OSCR');

OSCR.service(
    "Vocabulary",
    function ($http) {

        this.getSchema = function (vocab, accept) {
            $http.get('/vocabulary/' + vocab).success(function (data) {
                accept(xmlToTree(data));
            });
        };

        this.select = function (vocab, query, accept) {
            $http.get('/vocabulary/' + vocab + "/select", {params: {q: query}}).success(function (data) {
                accept(xmlToArray(data));
            });
        };

        this.add = function (vocab, entry, accept) {
            $http.post('/vocabulary/' + vocab + "/add", entry).success(function (data) {
                accept(xmlToObject(data));
            });
        };
    }
);