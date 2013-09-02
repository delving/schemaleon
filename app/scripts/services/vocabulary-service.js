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

        this.fetchEntry = function (vocab, identifier, accept) {
            $http.get('/vocabulary/' + vocab + "/fetch/" + identifier).success(function (data) {
                accept(xmlToObject(data));
            });
        };

        this.select = function (vocab, query, lookup, accept) {
            var params = { q: query };
            if (lookup) {
                console.log('vocab with lookup '+lookup);
                params.lookup = lookup;
            }
            else {
                console.log('vocab plain');
            }
            $http.get('/vocabulary/' + vocab + "/select", { params: params }).success(function (data) {
                console.log('vocab select ' + data);
                accept(xmlToArray(data));
            });
        };

        this.get = function (vocab, accept) {
            $http.get('/vocabulary/' + vocab + '/all').success(function (data) {
                accept(xmlToObject(data));
            });
        };

        this.add = function (vocab, entry, accept) {
            $http.post('/vocabulary/' + vocab + "/add", entry).success(function (data) {
                accept(xmlToObject(data));
            });
        };
    }
);