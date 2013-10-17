'use strict';


var OSCR = angular.module('OSCR');

function log(message) {
//    console.log(message);
}

OSCR.controller(
    'CollectionChoiceController',
    function ($scope) {

        $scope.annotationMode = true;
        $scope.document = $scope.schema;
        $scope.tree = null;

        $scope.setTree = function (tree) {
            var collectionTree = tree.elements[0]; // only "collection"
            var json = JSON.stringify(tree);
            $scope.prepareMediaUploadController(json, collectionTree);
            return $scope.tree = collectionTree;
        };

        $scope.validateTree = function () {
            if ($scope.tree) validateTree($scope.tree);
        };
    }
);

OSCR.controller(
    'MediaUploadController',
    function ($rootScope, $scope, $http, Document) {

        $rootScope.checkLoggedIn();

        $scope.schema = "MediaMetadata";
        $scope.committedFiles = [];
        $scope.options = {
            url: '/files'
        };

        function treeOf(file) {
            if (!file.tree && $scope.treeJSON) file.tree = JSON.parse($scope.treeJSON);
            return file.tree;
        }

        function getMimeType(fileName) {
            var matches = fileName.match(/\.(...)$/);
            var extension = matches[1].toLowerCase();
            switch (extension) {
                case 'jpg':
                    return 'image/jpeg';
                case 'png':
                    return 'image/png';
                case 'gif':
                    return 'image/gif';
                case 'mp4':
                    return 'video/mp4';
                default:
                    log("UNRECOGNIZED extension: " + extension);
                    return 'image/jpeg';
            }
        }

        function fetchCommitted() {
            Document.fetchAllDocuments($scope.schema, function (list) {
                $scope.committedFiles = _.map(list, function (doc) {
                    var header = doc.Header;
                    header.thumbnail = '/media/thumbnail/' + header.Identifier;
                    header.date = new Date(parseInt(header.TimeStamp));
                    return header;
                });
            });
        }
        fetchCommitted();

        $scope.prepareMediaUploadController = function (treeJSON, collectionTree) { // set by CollectionChoiceController
            $scope.treeJSON = treeJSON;
            $scope.collectionTree = collectionTree;
            $http.get($scope.options.url).then(function (response) {
                $scope.queue = response.data.files || [];
            });
        };

        $scope.$watch('queue', function(queue, before) {
            _.each(queue, function (file) {
                treeOf(file);
            });
        });

        $scope.showCommit = function (file) {
            if (!file) return false;
            var fileTree = treeOf(file);
            var collectionElement = fileTree.elements[1];
            collectionElement.value = $scope.collectionTree.value;
            if (file.notes) {
                if (!!collectionElement.value) {
                    file.collection = collectionElement.value;
                    file.selectCollectionWarning = false;
                    return true;
                }
                else {
                    file.selectCollectionWarning = true;
                    return false;
                }
            }
            else {
                return false;
            }
        };

        $scope.commit = function (file) {
            log('commit');
            log(file);
            var header = {
                SchemaName: $scope.schema,
                Identifier: '#IDENTIFIER#',
                TimeStamp: "#TIMESTAMP#",
                CommittedBy: $rootScope.user.Identifier,
                MediaObject: {
                    fileName: file.name,
                    mimeType: getMimeType(file.name)
                }
            };
            var fileTree = treeOf(file);
            _.each(fileTree.elements, function (el) { // cheat
                switch (el.name) {
                    case 'Notes':
                        el.value = file.notes;
                        break;
                    case 'Collection':
                        el.value = file.collection;
                        break;
                }
            });
            collectSummaryFields(fileTree, header);
            var body = treeToObject(fileTree);
            Document.saveDocument(header, body, function (header) {
                log("saved image");
                log(header);
                file.$destroy();
                fetchCommitted();
            });
        };

        $scope.showDestroy = function (file) {
            return !!file.$destroy && !file.notes;
        };

        $scope.fileDestroy = function (file) {
            if ($rootScope.config.showTranslationEditor) return;
            file.$destroy();
        };

        $scope.fileSubmit = function (file) {
            if ($rootScope.config.showTranslationEditor) return;
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
    function ($scope, $http) {
        var file = $scope.file, state;
        if (file.url) {
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
        }
        else if (!file.$cancel && !file._index) {
            file.$cancel = function () {
                $scope.clear(file);
            };
        }
    }
);
