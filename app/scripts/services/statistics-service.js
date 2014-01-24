'use strict';

var OSCR = angular.module('OSCR');

OSCR.service(
    "Statistics",
    function ($rootScope, $http) {

        this.getGlobalStatistics = function (groupIdentifier, accept) {
            $http.get('/statistics/'+groupIdentifier).success(function (xml) {
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