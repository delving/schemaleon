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

var Schemaleon = angular.module('Schemaleon');

/*
 * support the list of documents, including searching them
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, $location, Document, Person) {

        $rootScope.checkLoggedIn();

        $scope.schema = $routeParams.schema;
        $scope.groupIdentifier = $routeParams.groupIdentifier;
        $scope.searchString = '';
        $scope.defaultMaxResults = 12;
        $scope.expectedListLength = $scope.defaultMaxResults;
        $scope.headerList = [];
        $scope.searchParams = {
            startIndex: 1,
            maxResults: $scope.defaultMaxResults
        };

        $scope.$watch('schemaMap', function(schemaMap, before) {
            $scope.schemaIsShared = isSchemaShared($scope.schema, schemaMap);
        });

        function searchDocuments() {
            Document.searchDocuments($scope.schema, $scope.groupIdentifier, $scope.searchParams, function (list) {
                var headerList = _.map(list, function(document) {
                    return document.Header;
                });
                // find unique user id's and map them. then fetch Person Profile for display of email
                var userIds = _.uniq(_.map(headerList, function(header){
                    return header.SavedBy;
                }));
                if (userIds) {
                    _.each(userIds, function(id){
                        Person.getUser(id, function(user) {
                            _.each(headerList, function(element) {
                                if (id == element.SavedBy) {
                                    element.userView = user;
                                }
                            });
                        });
                    });
                }
                if ($scope.searchParams.startIndex == 1) {
                    $scope.headerList = headerList;
                }
                else {
                    $scope.headerList = $scope.headerList.concat(headerList);
                }
                $rootScope.scrollTo({element:'#document-list-container', direction: 'down'});
            });
        }

        // initialize the document list with results
        searchDocuments();

        $scope.doDocumentSearch = function (searchString) {
            $scope.searchParams.searchQuery = searchString;
            $scope.searchParams.startIndex = 1;
            $scope.searchParams.maxResults = $scope.defaultMaxResults;
            $scope.expectedListLength = $scope.defaultMaxResults;
            searchDocuments();
        };

        $scope.couldBeMoreResults = function() {
            return $scope.headerList.length == $scope.expectedListLength;
        };

        $scope.getMoreResults = function() {
            $scope.searchParams.startIndex = $scope.headerList.length + 1;
            $scope.searchParams.maxResults = $scope.searchParams.maxResults * 2;
            $scope.expectedListLength = $scope.headerList.length + $scope.searchParams.maxResults;
            searchDocuments();
        };
    }
);

