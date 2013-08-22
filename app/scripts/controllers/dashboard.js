var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Statistics) {

        Statistics.getGlobalStatistics(function(statistics) {
            $scope.statistics = statistics;
        });

    }
);