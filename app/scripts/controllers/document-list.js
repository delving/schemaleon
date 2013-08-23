'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, Document) {

        $rootScope.checkLoggedIn();

        $scope.schema = $routeParams.schema;

        if ($scope.schema) {

        }

        Document.fetchHeaders($scope.schema, function (list) {
            $scope.headerList = _.sortBy(list, function (val) {
                return -val.TimeStamp;
            });
        });

        $scope.newDocument = function () {
            if ($rootScope.translating()) return;
            $scope.choosePath('/document/' + $scope.schema + '/edit/create');
        };
    }
);

