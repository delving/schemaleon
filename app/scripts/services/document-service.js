'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("Document",
    function ($http) {
        this.fetchSchema = function (schemaName, receiver) {
            $http.get('/document/schema/' + schemaName).success(receiver);
        };
        this.fetchList = function (receiver) {
            $http.get('/document/list').success(receiver);
        };
        this.fetchDocument = function (identifier, receiver) {
            $http.get('/document/fetch/' + identifier).success(receiver);
        };
        this.saveXml = function (body, receiver) {
            $http.post('/document/save', body).success(receiver);
        }
    }
);