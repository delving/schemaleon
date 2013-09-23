'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, Document) {

        $rootScope.checkLoggedIn();

        $scope.searchString = '';
        $scope.searchStringUsed = '';
        $scope.schema = $routeParams.schema;
        $scope.noResults = false;

        function getAllDocuments() {
            Document.fetchAllDocuments($scope.schema, function (list) {
                $scope.searchStringUsed = '';
                $scope.searchString = '';
                $scope.headerList = _.map(list, function(document) {
                    return document.Header;
                });
            });
        }

        if ($scope.schema) {
            getAllDocuments()
        }

        $scope.newDocument = function () {
            $scope.choosePath('/document/' + $scope.schema + '/edit/create');
        };

        $scope.search = function() {
            if ($scope.searchString.length == 0) {
                getAllDocuments();
            }
            else {
                Document.selectDocuments($scope.schema, $scope.searchString, function(list) {
                    if (list.length) {
                        $scope.searchStringUsed = $scope.searchString;
                        $scope.noResults = false;
                        $scope.headerList = _.map(list, function(document) {
                            return document.Header;
                        });
                    }
                    else {
                        $scope.searchString = '';
                        $scope.noResults = true;
                        getAllDocuments();
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

