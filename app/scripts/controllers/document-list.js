'use strict';

CultureCollectorApp.controller('DocumentListController',
    ['$scope', 'ObjectList',
        function ($scope, ObjectList) {
            ObjectList.fetchList(function (data) {
                $scope.objects = data;
            });
        }]
);
