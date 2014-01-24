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

            function success(data) {
                receiver(xmlToObject(data));
            }

            if (groupIdentifier) {
                $http.get('/primary/' + schemaName + '/' + groupIdentifier + '/' + identifier + '/fetch').success(success);
            }
            else {
                $http.get('/shared/' + schemaName + '/' + identifier + '/fetch').success(success);
            }
        };

        // search shared with schema or primary with or without schema, and maybe empty query
        this.searchDocuments = function (schemaName, groupIdentifier, query, receiver) {

            function config() {
                var config = {};
                if (query && query.length) {
                    config.params = { q: query }
                }
                return config;
            }

            function success(data) {
                receiver(xmlToArray(data));
            }

            if (groupIdentifier) {
                $http.get('/primary/' + schemaName + '/' + groupIdentifier + '/search', config()).success(success);
            }
            else if (schemaName) {
                $http.get('/shared/' + schemaName + '/search', config()).success(success);
            }
            else {
                $http.get('/primary/search', config()).success(success);
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