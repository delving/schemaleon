'use strict';


var OSCR = angular.module('OSCR');

OSCR.controller(
    'MediaUploadController',
    function ($rootScope, $scope, $http, $timeout, $filter, Document) {

        $rootScope.checkLoggedIn();

        $scope.schema = "MediaMetadata";
        $scope.groupIdentifier = $rootScope.userGroupIdentifier();
        $scope.committedFiles = [];
        $scope.options = {
            url: '/files/'+$scope.groupIdentifier+'/'
        };

        function fetchCommitted() {
            Document.searchDocuments($scope.schema, $scope.groupIdentifier, {}, function (list) {
                $scope.committedFiles = _.map(list, function (doc) {
                    // $rootScope.getProperThumbExtension checks file extension.
                    // For video/audio files the extension will be replaced by .png
//                    doc.thumbnail = '/media/thumbnail/' + $rootScope.getProperThumbExtension(doc.Header.Identifier);;
                    doc.thumbnail = $filter('mediaThumbnail')(doc.Header.Identifier);
                    doc.date = new Date(parseInt(doc.Header.TimeStamp));
                    return doc;
                });
            });
        }
        fetchCommitted();

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
                    MimeType: $rootScope.getMimeTypeFromFileName(file.name)
                }
            };
            Document.saveDocument(header, body, function (header) {
                done();
                fetchCommitted();
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

OSCR.controller(
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
