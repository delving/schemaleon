var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Statistics) {
        $rootScope.checkLoggedIn();

        Statistics.getGlobalStatistics(function(statistics) {
            $scope.statistics = statistics;
        });

        Statistics.getLogEntries(function(entries) {
            $scope.logEntries = entries;
        });

    }
);