'use strict';

CultureCollectorApp.controller('DocumentListController',
    ['$scope', 'Document',
        function ($scope, Document) {
            Document.fetchList(function (xml) {
                $scope.objects = xmlToArray(xml);
            });
        }]
);
