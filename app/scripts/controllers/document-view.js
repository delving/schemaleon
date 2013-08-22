'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentViewController',
    function ($rootScope, $scope, $routeParams, $location, Document) {

        $scope.schema = $routeParams.schema;
        $scope.identifier = $routeParams.identifier;
        $scope.header = { };
        $scope.showingDocument = true;

        function useHeader(h) {
            $scope.header.Identifier = h.Identifier ? h.Identifier : '#IDENTIFIER#';
            $scope.header.Title = h.Title;
            $scope.header.TimeStamp = h.TimeStamp;
        }

        Document.fetchDocument($scope.schema, $scope.identifier, function (document) {
            useHeader(document.Document.Header);
            Document.fetchSchema($scope.schema, function (schema) {
                $scope.tree = schema;
                populateTree($scope.tree, document.Document.Body);
            });
        });

        $scope.$watch('i18n', function (i18n, oldValue) {
            if ($scope.tree && i18n) {
                i18nTree($scope.tree, i18n);
            }
        });
    }
);
