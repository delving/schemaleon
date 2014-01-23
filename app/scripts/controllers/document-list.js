'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, Document, Person) {

        $rootScope.checkLoggedIn();

        $scope.searchString = '';
        $scope.searchStringUsed = '';
        $scope.schema = $routeParams.schema;
        $scope.groupIdentifier = $routeParams.groupIdentifier;
        $scope.noResults = false;

        function getAllDocuments() {
            Document.listDocuments($scope.schema, $scope.groupIdentifier, function (list) {
                $scope.searchStringUsed = '';
                $scope.searchString = '';
                $scope.headerList = _.map(list, function(document) {
                    return document.Header;
                });
                // find unique user id's and map them. then fetch Person Profile for display of email
                var userIds = _.uniq(_.map($scope.headerList, function(header){
                    return header.SavedBy;
                }));
                _.each(userIds, function(id){
                    Person.getUser(id, function(user) {
                        _.each($scope.headerList, function(element) {
                            if (id == element.SavedBy) {
                                element.userView = user;
                            }
                        });
                    });
                });
            });
        }

        if ($scope.schema) {
            getAllDocuments()
        }

        $scope.search = function() {
            if ($scope.searchString.length == 0) {
                getAllDocuments();
            }
            else {
                Document.searchDocuments($scope.schema, $scope.groupIdentifier, $scope.searchString, function(list) {
                    if (list.length) {
                        $scope.searchStringUsed = $scope.searchString;
                        $scope.noResults = false;
                        $scope.headerList = _.map(list, function(document) {
                            return document.Header;
                        });
                    }
                    else {
//                        $scope.searchString = '';
                        $scope.noResults = true;
                        $scope.headerList = '';
//                        getAllDocuments();
                    }
                });
            }
        };

        $scope.clearSearch = function () {
            $scope.noResults = false;
            getAllDocuments();
        }

    }
);

