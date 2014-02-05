'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, $location, Document, Person) {

        $rootScope.checkLoggedIn();

        $scope.schema = $routeParams.schema;
        $scope.groupIdentifier = $routeParams.groupIdentifier;
        $scope.searchString = '';
        $scope.defaultMaxResults = 10;
        $scope.expectedListLength = $scope.defaultMaxResults;
        $scope.headerList = [];
        $scope.searchParams = {
            startIndex: 1,
            maxResults: $scope.defaultMaxResults
        };

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

