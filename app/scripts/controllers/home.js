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
        $scope.searchString = '';
        $scope.defaultMaxResults = 5;
        $scope.expectedListLength = $scope.defaultMaxResults;
        $scope.headerList = [];
        $scope.searchParams = {
            startIndex: 1,
            maxResults: $scope.defaultMaxResults
        };

        function searchDocuments() {
            Document.searchDocuments(null, null, $scope.searchParams, function (list) {
                var headerList = _.map(list, function(document) {
                    return document.Header;
                });
                var groupIdentifiers = _.uniq(_.map(headerList, function(header){
                    return header.GroupIdentifier;
                }));
                _.each(groupIdentifiers, function(groupIdentifier){
                    Person.getGroup(groupIdentifier, function(group) {
                        _.each(headerList, function(header) {
                            if (groupIdentifier == header.GroupIdentifier) {
                                header.group = group.Group;
                            }
                        });
                    });
                });

                if ($scope.searchParams.startIndex == 1) {
                    $scope.headerList = headerList;
                }
                else {
                    $scope.headerList = $scope.headerList.concat(headerList);
                }

            });
        }

        $scope.$watch('searchString', function(searchString, oldSearchString) {
            $scope.searchParams.searchQuery = searchString;
            $scope.searchParams.startIndex = 1;
            $scope.searchParams.maxResults = $scope.defaultMaxResults;
            $scope.expectedListLength = $scope.defaultMaxResults;
            searchDocuments();
        });

        $scope.couldBeMoreResults = function() {
            return $scope.headerList.length == $scope.expectedListLength;
        };

        $scope.getMoreResults = function() {
            $scope.searchParams.startIndex = $scope.headerList.length + 1;
            $scope.searchParams.maxResults = $scope.searchParams.maxResults * 2;
            $scope.expectedListLength = $scope.headerList.length + $scope.searchParams.maxResults;
            searchDocuments();
        };

        $scope.getTitles = function(header) {
            return xmlArray(header.SummaryFields.Title);
        };

        $scope.hasThumbnail = function(header) {
            return header.SummaryFields.Thumbnail;
        };

        $scope.getThumbPath = function(header) {
            var thumbArray = xmlArray(header.SummaryFields.Thumbnail);
            if (thumbArray.length) {
                var thumbName = $scope.getProperThumbExtension(thumbArray[0].Identifier);
                return '/media/thumbnail/' + thumbName;
            }
            else {
                return ''; // todo: an image to indicate?
            }
        };

        $scope.getMimeType = function(header) {
            var thumbArray = xmlArray(header.SummaryFields.Thumbnail);
            if (thumbArray.length) {
                return thumbArray[0].MimeType;
            }
            else {
                return '?';
            }
        };
    }
);