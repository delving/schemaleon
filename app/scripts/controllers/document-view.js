'use strict';

var OSCR = angular.module('OSCR');

OSCR.controller(
    'DocumentViewController',
    function ($rootScope, $scope, $routeParams, $location, Document) {
        $scope.header = { SchemaName: 'Photograph' };
        $scope.showingDocument = true;

        function useHeader(h) {
            $scope.header.Identifier = h.Identifier ? h.Identifier : '#IDENTIFIER#';
            $scope.header.Title = h.Title;
            $scope.header.TimeStamp = h.TimeStamp;
        }

        function fetchSchema() {
            Document.fetchSchema($scope.header.SchemaName, function (schema) {
                $scope.tree = schema;

                if ($routeParams.id) {
                    Document.fetchDocument('Photograph', $routeParams.id, function (object) {
                        populateTree($scope.tree, object.Document.Body);
                        useHeader(object.Document.Header);
                    });
                }
                else {
                    $scope.header = {
                        SchemaName: 'Photograph',
                        Identifier: '#IDENTIFIER#',
                        Title: 'Document not found'
                    };
                    $scope.showingDocument = false;
                }
                console.log($scope.tree);

            });
        }

        fetchSchema();

        $scope.$watch('i18n', function (i18n, oldValue) {
            if ($scope.tree && i18n) {
                i18nTree($scope.tree, i18n);
            }
        });

    }
);
