var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Person) {
        $scope.counts = [
            {type: "Groups", count: 5},
            {type: "Users", count: 32},
            {type: "Documents", count: 324},
            {type: "Media items", count: 200}
        ];
    }
);