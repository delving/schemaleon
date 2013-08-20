'use strict';

var OSCR = angular.module('OSCR');

function log(message) {
    console.log(message);
}

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, $location, Document) {

        $scope.header = {};

        function useHeader(h) {
            $scope.header.Identifier = h.Identifier ? h.Identifier : '#IDENTIFIER#';
            $scope.header.Title = h.Title;
            delete $scope.header.TimeStamp;
            var millis = parseInt(h.TimeStamp);
            if (!_.isNaN(millis)) {
                $scope.header.TimeStamp = millis;
            }
        }

        $scope.fetchList = function () {
            Document.fetchHeaders('Photograph', function (list) { // todo: all schemas?
                $scope.headerList = _.sortBy(list, function (val) {
                    return -val.TimeStamp;
                });
            });
        };
        $scope.fetchList();

        if ($routeParams.id) {
            Document.fetchDocument('Photograph', $routeParams.id, function (document) { // todo: all schemas
                $scope.document = document.Document;
                useHeader($scope.document.Header);
            });
        }
        else {
            useHeader({
                SchemaName: $scope.document,
                Identifier: '#IDENTIFIER#'
            });
        }

        $scope.setTree = function (tree) {
            $scope.tree = tree;
        };

        $scope.saveDocument = function () {
            if ($rootScope.translating()) return;
//            console.log('saveDocument');// todo
//            console.log($scope.tree);// todo
            collectSummaryFields($scope.tree, $scope.header);
            var body = treeToObject($scope.tree);
            $scope.header.SchemaName = 'Photograph';
            $scope.header.TimeStamp = "#TIMESTAMP#";
            $scope.header.EMail = $rootScope.user.Profile.email;
            Document.saveDocument($scope.header, body, function (header) {
                useHeader(header);
                $scope.fetchList();
                $scope.document = null;
                $location.path('/document');
            });
        };

        $scope.newDocument = function () {
            if ($rootScope.translating()) return;
            $scope.choosePath('/document');
            $scope.document = 'Photograph';
        };
    }
);

