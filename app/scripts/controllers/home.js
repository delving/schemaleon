var OSCR = angular.module('OSCR');

OSCR.controller(
    'HomeController',
    function ($scope, Person, $location) {
        function getAllGroups() {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
            });
        }
        getAllGroups();

        $('#list-current-groups').on('change',function(){
            var path = $(this).val();
            console.log(path);

            $scope.$apply( $location.path(path) );
        });
    }
);