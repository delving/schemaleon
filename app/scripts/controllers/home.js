var OSCR = angular.module('OSCR');

OSCR.controller(
    'HomeController',
    function ($scope, Person, Document, $location) {
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

        $scope.headerList = [];

        $scope.$watch('searchString', function(newValue, oldValue) {
            if(newValue){
                Document.searchDocuments(null, null, newValue, function (list) {
                    $scope.headerList = _.map(list, function(document) {
                        return document.Header;
                    });
                    // find unique user id's and map them. then fetch Person Profile for display of email
                    var userIds = _.uniq(_.map($scope.headerList, function(header){
                        return header.SavedBy;
                    }));
                    _.each(userIds, function(id){
                        Person.getUser(id, function(user) {
                            _.each($scope.headerList, function(element) {
                                if (id == element.SavedBy) {
                                    element.userView = user;
                                }
                            });
                        });
                    });
                });
            }
            else {
                $scope.headerList = [];
            }

        });
    }
);