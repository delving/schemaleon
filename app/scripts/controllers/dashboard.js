var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Person) {

        // GLOBAL OSCR STATS
        $scope.counts = [
            {type: "Groups", count: 5},
            {type: "Users", count: 32},
            {type: "Documents", count: 324},
            {type: "Media items", count: 200}
        ];

        // LOGGED IN USER STATS
        $scope.currentUserStats = {
            username: "Oscar Wilde",
            memberships: [
                {groupName: "OSCR", memberSince: "22-08-2013"},
                {groupName: "Group x", memberSince: "22-08-2013"},
                {groupName: "Group y", memberSince: "22-08-2013"},
                {groupName: "Group z", memberSince: "22-08-2013"}
            ]
        };



    }
);