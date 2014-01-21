'use strict';

var OSCR = angular.module('OSCR');

OSCR.service(
    "Document",
    function ($rootScope, $http) {

        this.getStats = function(accept) {
            $http.get('/document/stats').success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

        this.fetchSchemaMap = function(receiver) {
            $http.get('/document/schemaMap').success(receiver);
        };

        this.fetchSchema = function (schemaName, receiver) {
            $http.get('/document/schema/' + schemaName).success(function (data) {
                receiver(xmlToTree(data));
            });
        };

        this.fetchAllDocuments = function (schemaName, groupIdentifier, receiver) {
            $http.get('/document/list/documents/' + schemaName + '/' + groupIdentifier).success(function (data) {
                receiver(xmlToArray(data));
            });
        };

        this.selectDocuments = function (schemaName, groupIdentifier, search, receiver) {
            $http.get('/document/select/' + schemaName + '/' + groupIdentifier, {params: {q: search}}).success(function (data) {
                receiver(xmlToArray(data));
            });
        };

        this.fetchDocument = function (schemaName, groupIdentifier, identifier, receiver) {
            $http.get('/document/fetch/' + schemaName + '/' + groupIdentifier + '/' + identifier).success(function (data) {
                receiver(xmlToObject(data));
            });
        };

        this.saveDocument = function (header, body, receiver) {

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
                    body: body,
                    xml: documentXml
                };
            }

            $http.post('/document/save', envelope(header, body)).success(function (data) {
                receiver(xmlToObject(data).Document);
            });
        };
    }

);