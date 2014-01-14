var OSCR = angular.module('OSCR');

OSCR.controller(
    'HomeController',
    function ($rootScope, $scope, $location, Person) {

        function getAllGroups() {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
                console.log(list);
            });
        }

        getAllGroups();

    }
);