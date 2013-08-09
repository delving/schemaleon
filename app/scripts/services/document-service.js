'use strict';

var OSCR = angular.module('OSCR');

OSCR.service("Document",
    function ($http) {
        this.fetchSchema = function (schemaName, receiver) {
            $http.get('/document/schema/' + schemaName).success(function (data) {
                receiver(xmlToTree(data));
            });
        };
        this.fetchList = function (schemaName, receiver) { // todo: find users
            $http.get('/document/list/' + schemaName).success(function (data) {
                receiver(xmlToArray(data));
            });
        };
        this.fetchDocument = function (schemaName, identifier, receiver) { // todo: find users
            $http.get('/document/fetch/' + schemaName + '/' + identifier).success(function (data) {
                receiver(xmlToObject(data));
            });
        };

        function envelope(header, body) {
            var document = {
                Document: {
                    Header: header,
                    Body: body
                }
            };
            var documentXml = objectToXml(document);
            return {
                header: header,
                xml: documentXml
            };
        }

        this.saveDocument = function (header, body, receiver) {
            $http.post('/document/save', envelope(header, body)).success(function (data) {
                receiver(xmlToObject(data));
            });
        };
    }
);