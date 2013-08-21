'use strict';

var OSCR = angular.module('OSCR');

function log(message) {
    console.log(message);
}

OSCR.controller(
    'DocumentListController',
    function ($rootScope, $scope, $routeParams, $location, Document) {

        $scope.header = {};

        $scope.schema = 'Photograph'; // this will have to become adjustable
        $scope.blankIdentifier = '#IDENTIFIER#';
        $scope.blankTimeStamp = '#TIMESTAMP#';

        function useHeader(h) {
            $scope.header.Identifier = h.Identifier;
            $scope.headerDisplay = h.Identifier === $scope.blankIdentifier ? null : h.Identifier;
            $scope.header.Title = h.Title;
            delete $scope.header.TimeStamp;
            var millis = parseInt(h.TimeStamp);
            if (!_.isNaN(millis)) {
                $scope.header.TimeStamp = millis;
            }
        }

        $scope.fetchList = function () {
            Document.fetchHeaders($scope.schema, function (list) {
                $scope.headerList = _.sortBy(list, function (val) {
                    return -val.TimeStamp;
                });
            });
        };
        $scope.fetchList();

        if ($routeParams.id) {
            Document.fetchDocument($scope.schema, $routeParams.id, function (document) {
                $scope.document = document.Document;
                useHeader($scope.document.Header);
            });
        }
        else {
            useHeader({
                SchemaName: $scope.schema,
                Identifier: $scope.blankIdentifier
            });
        }

        $scope.setTree = function (tree) {
            $scope.tree = tree;
        };

        $scope.validateTree = function() {
            if ($scope.tree) {
                validateTree($scope.tree);
            }
        };

        $scope.saveDocument = function () {
            if ($rootScope.translating()) return;
            collectSummaryFields($scope.tree, $scope.header);
            var body = treeToObject($scope.tree);
            $scope.header.SchemaName = $scope.schema;
            $scope.header.TimeStamp = $scope.blankTimeStamp;
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
            $scope.document = $scope.schema;
        };
    }
);

