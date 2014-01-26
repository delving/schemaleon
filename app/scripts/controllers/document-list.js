'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, $location, Document, Person) {

        $rootScope.checkLoggedIn();

        $scope.schema = $routeParams.schema;

        $scope.documentShared = function () {
            if ($location.path().indexOf('/shared/') > -1 ){
                return true;
            }
        }

        $scope.groupIdentifier = $routeParams.groupIdentifier;
        $scope.headerList = [];

        $scope.$watch('searchString', function(newValue, oldValue) {
            Document.searchDocuments($scope.schema, $scope.groupIdentifier, newValue, function (list) {
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
        });

        $scope.searchString = '';
    }
);

