/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var OSCR = angular.module('OSCR');

/*
 * Controller for the public facing page of OSCR.
 * view: views/dashboard.html
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

OSCR.controller(
    'PublicController',
    function ($rootScope, $scope, $filter, $timeout, Person, Document) {

        /**
         * Sets a list of all registered groups. Runs immediately when the controller is called
         * Makes use of the Person service
         * @return $scope.groupList
         */
        !function () {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
            });
        }();

        // target the dropdown with groups and navigate on change
        angular.element('#list-current-groups').on('change', function(){
            var path = this.value;
            $scope.$apply($rootScope.choosePath(path));
        });

        // search result scope variables
        $scope.headerList = [];
        $scope.searchString = '';
        $scope.defaultMaxResults = 12;
        $scope.expectedListLength = $scope.defaultMaxResults;
        $scope.searchParams = {
            startIndex: 1,
            maxResults: $scope.defaultMaxResults
        };

        /**
         * Fills the headerList with return document headers for search result display
         * Makes use of the Document service and the Person service
         * @return $scope.headerList
         */
        function searchDocuments() {
            Document.searchDocuments(null, null, $scope.searchParams, function (list) {
                var headerList, groupIdentifiers;
                headerList = _.map(list, function(document) {
                    return document.Header;
                });
                groupIdentifiers = _.uniq(_.map(headerList, function(header){
                    return header.GroupIdentifier;
                }));
                _.each(groupIdentifiers, function(groupIdentifier){
                    Person.getGroup(groupIdentifier, function(group) {
                        _.each(headerList, function(header) {
                            if (groupIdentifier == header.GroupIdentifier) {
                                header.group = group;
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
                // ui - make sure all the grid items are of equal height for proper grid display
                $timeout(function(){
                    $rootScope.equalHeight($("div.thumbnail"));
                    $rootScope.scrollTo({element:'#document-list-container', direction: 'down'});
                },1000);

            });
        }

        // initial call to fill up the page with search results
        searchDocuments();

        /**
         * Called from the input on the public page document search form
         * @return $scope.headerList
         */
        $scope.doPublicSearch = function (searchString) {
            $scope.searchParams.searchQuery = searchString;
            $scope.searchParams.startIndex = 1;
            $scope.searchParams.maxResults = $scope.defaultMaxResults;
            $scope.expectedListLength = $scope.defaultMaxResults;
            searchDocuments();
        };

        /**
         * check if there could be more results
         * @return Boolean
         */
        $scope.couldBeMoreResults = function() {
            return $scope.headerList.length == $scope.expectedListLength;
        };

        /**
         * Do another search but increment the startIndex so that the search concatinates more results to the $scope.headerList
         */
        $scope.getMoreResults = function() {
            $scope.searchParams.startIndex = $scope.headerList.length + 1;
            $scope.searchParams.maxResults = $scope.searchParams.maxResults * 2;
            $scope.expectedListLength = $scope.headerList.length + $scope.searchParams.maxResults;
            searchDocuments();
        };

        /**
         * Extracts titles from headers
         * @param {Object} header
         * @return Boolean
         */
        $scope.getTitles = function(header) {
            return xmlArray(header.SummaryFields.Title);
        };

        /**
         * Checks if there is a thumbnails present
         * @param {Object} header
         * @return Boolean
         */
        $scope.hasThumbnail = function(header) {
            return header.SummaryFields.Thumbnail;
        };

        /**
         * Returns a path to the thumbnail
         * Makes use of the 'mediaThumbnail' filter defined in global.js
         * Todo: return a default image if no thumbnail found?
         * @param {Object} header
         * @return {String} $filter('mediaThumbnail')(thumbArray[0].Identifier)
         */
        $scope.getThumbPath = function(header) {
            var thumbArray = xmlArray(header.SummaryFields.Thumbnail);
            if (thumbArray.length) {
                return $filter('mediaThumbnail')(thumbArray[0].Identifier);
            }
            else {
                return ''; // todo: an image to indicate?
            }
        };

        /**
         * Extracts mime types from header Thumbnail summaryfield
         * @param {Object} header
         * @return {String} thumbArray[0].MimeType
         */
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