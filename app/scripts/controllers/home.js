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
                Document.searchDocuments(null, null, newValue, function (list) {
                    $scope.headerList = _.map(list, function(document) {
                        return document.Header;
                    });
                    var groupIdentifiers = _.uniq(_.map($scope.headerList, function(header){
                        return header.GroupIdentifier;
                    }));
                    _.each(groupIdentifiers, function(groupIdentifier){
                        Person.getGroup(groupIdentifier, function(group) {
                            _.each($scope.headerList, function(header) {
                                if (groupIdentifier == header.GroupIdentifier) {
                                    header.group = group.Group;
                                }
                            });
                        });
                    });
                });
        });

        // trigger fetching the list
        $scope.searchString = '';
    }
);