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

        // all schemas
        this.fetchSchemaMap = function(accept) {
            $http.get('/schema').success(function (schemaMap) {
                accept(schemaMap);
                console.log(schemaMap);
            });
        };

        // fetch schema
        this.fetchSchema = function (schemaName, receiver) {
            $http.get('/schema/' + schemaName).success(function (data) {
                receiver(xmlToTree(data));
            });
        };

        // fetch primary or shared from a schema
        this.fetchDocument = function (schemaName, groupIdentifier, identifier, receiver) {
            if (groupIdentifier) {
                $http.get('/primary/' + schemaName + '/' + groupIdentifier + '/' + identifier + '/fetch').success(function (data) {
                    receiver(xmlToObject(data));
                });
            }
            else {
                $http.get('/shared/' + schemaName + '/' + identifier + '/fetch').success(function (data) {
                    receiver(xmlToObject(data));
                });
            }
        };

        // list shared or primary
        this.listDocuments = function (schemaName, groupIdentifier, receiver) {
            if (groupIdentifier) {
                $http.get('/primary/' + schemaName + '/' + groupIdentifier + '/list').success(function (data) {
                    receiver(xmlToArray(data));
                });
            }
            else {
                $http.get('/shared/' + schemaName + '/list').success(function (data) {
                    receiver(xmlToArray(data));
                });
            }
        };

        // search shared with schema or primary with or without schema
        this.searchDocuments = function (schemaName, groupIdentifier, search, receiver) {
            if (groupIdentifier) {
                $http.get('/primary/' + schemaName + '/' + groupIdentifier + '/search', {params: {q: search}}).success(function (data) {
                    receiver(xmlToArray(data));
                });
            }
            else if (schemaName) {
                $http.get('/shared/' + schemaName + '/search', {params: {q: search}}).success(function (data) {
                    receiver(xmlToArray(data));
                });
            }
            else {
                $http.get('/primary/search', {params: {q: search}}).success(function (data) {
                    receiver(xmlToArray(data));
                });
            }
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