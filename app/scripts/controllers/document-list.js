'use strict';

CultureCollectorApp.controller('DocumentListController',
    ['$scope', 'Document',
        function ($scope, Document) {
            Document.fetchList(function (data) {
                $scope.objects = data;
            });
        }]
);
