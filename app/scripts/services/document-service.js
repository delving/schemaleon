/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var OSCR = angular.module('OSCR');

/**
 * Service which gives access to documents via HTTP
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

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
        // searchQuery, startIndex, maxResults, wildcards
        this.searchDocuments = function (schemaName, groupIdentifier, params, receiver) {
            var getPath;
            if (groupIdentifier) {
                getPath = '/primary/' + schemaName + '/' + groupIdentifier + '/search';
            }
            else if (schemaName) {
                getPath = '/shared/' + schemaName + '/search';
            }
            else {
                getPath = '/primary/search';
            }
            $http.get(getPath, { params: params }).success(function (data) {
                receiver(xmlToArray(data));
            });
        };

        this.leaseDocument = function(identifier, accept) {
            $http.get('/document/lease', {params: {document: identifier}}).success(accept);
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