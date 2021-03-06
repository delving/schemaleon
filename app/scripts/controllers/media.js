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

'use strict';

var Schemaleon = angular.module('Schemaleon');

/**
 * Handle the page for uploading media
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'MediaController',
    function ($rootScope, $scope, $http, $timeout, $filter, Document) {

        $rootScope.checkLoggedIn();

        $scope.schema = "MediaMetadata";
        $scope.groupIdentifier = $rootScope.userGroupIdentifier();
        $scope.committedFiles = [];
        $scope.options = {
            url: '/files/'+$scope.groupIdentifier+'/'
        };

        $scope.mediaList = [];
        $scope.defaultMaxResults = 20;
        $scope.expectedListLength = $scope.defaultMaxResults;
        $scope.searchParams = {
            startIndex: 1,
            maxResults: $scope.defaultMaxResults
        };

        function getMedia() {
            Document.searchDocuments($scope.schema, $scope.groupIdentifier, $scope.searchParams, function (list) {
                var mediaList = _.map(list, function(doc) {
                    doc.thumbnail = $filter('mediaThumbnail')(doc.Header.Identifier);
                    doc.date = new Date(parseInt(doc.Header.TimeStamp));
                    return doc;
                });

                if ($scope.searchParams.startIndex == 1) {
                    $scope.mediaList = mediaList;
                }
                else {
                    $scope.mediaList = $scope.mediaList.concat(mediaList);
                }
                $rootScope.scrollTo({element:'#media-thumbnail-list', direction: 'down'});
            });
        }

        $scope.couldBeMoreMedia = function() {
            return $scope.mediaList.length == $scope.expectedListLength;
        };

        $scope.getMoreMedia = function() {
            $scope.searchParams.startIndex = $scope.mediaList.length + 1;
            $scope.searchParams.maxResults = $scope.searchParams.maxResults * 2;
            $scope.expectedListLength = $scope.mediaList.length + $scope.searchParams.maxResults;
            getMedia();
        };

        getMedia();

        $scope.commitFile = function (file, done) {
            console.log('commit', file);
            var header = {
                SchemaName: $scope.schema,
                GroupIdentifier: $scope.groupIdentifier,
                Identifier: '#IDENTIFIER#',
                TimeStamp: "#TIMESTAMP#"
            };
            var body = {
                MediaMetadata: {
                    UserIdentifier: $rootScope.user.Identifier,
                    OriginalFileName: file.name,
                    MimeType: getMimeTypeFromFileName(file.name)
                }
            };
            Document.saveDocument(header, body, function (header) {
                done();
                // reset the image list;
                getMedia();
            });
        };

        $scope.fileDestroy = function (file) {
            if ($rootScope.config.showTranslationEditor) return;
            file.$destroy();
        };

        $scope.fileSubmit = function (file) {
            if ($rootScope.config.showTranslationEditor) return;
            console.log("submitted file is ", file);
            file.$submit();
        };

        $scope.fileCancel = function (file) {
            if ($rootScope.config.showTranslationEditor) return;
            file.$cancel();
        };

    }
);

Schemaleon.controller(
    'FileDestroyController',
    function ($scope, $http, $timeout) {
        var file = $scope.file, state;
        if (file.url) {
            $scope.commitFile(file, function() {
                file.$state = function () {
                    return state;
                };
                file.$destroy = function () {
                    state = 'pending';
                    return $http({
                        url: file.deleteUrl,
                        method: file.deleteType
                    }).then(
                        function () {
                            state = 'resolved';
                            $scope.clear(file);
                        },
                        function () {
                            state = 'rejected';
                        }
                    );
                };
                $timeout(function () {
                    file.$destroy(); // as soon as you've got it, kill it
                }, 1000);
            });
        }
        else if (!file.$cancel && !file._index) {
            file.$cancel = function () {
                $scope.clear(file);
            };
        }
    }
);

