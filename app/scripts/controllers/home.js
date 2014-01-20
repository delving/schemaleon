var OSCR = angular.module('OSCR');

OSCR.controller(
    'HomeController',
    function ($rootScope, $scope, Person) {
        function getAllGroups() {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
            });
        }
        getAllGroups();
    }
);