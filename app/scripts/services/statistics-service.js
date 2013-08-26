'use strict';

var OSCR = angular.module('OSCR');

OSCR.service(
    "Statistics",
    function ($rootScope, $http) {

        this.getGlobalStatistics = function (accept) {
            $http.get('/statistics').success(function (xml) {
                accept(xmlToObject(xml).Statistics);
            });
        };

        this.getLogEntries = function(accept) {
            $http.get('/log').success(function (xml) {
                accept(xmlToArray(xml));
            });
        };
    }
);