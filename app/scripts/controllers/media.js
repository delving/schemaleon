'use strict';


var OSCR = angular.module('OSCR');

function log(message) {
//    console.log(message);
}

var url = 'http://localhost:8888';
// todo: var url = '/media';

OSCR.controller(
    'MediaUploadController',
    function ($rootScope, $scope, $http, Document) {
        $scope.options = {
            url: url
        };

        function loadFiles() {
            $scope.loadingFiles = true;
            $http.get(url).then(
                function (response) {
                    $scope.loadingFiles = false;
                    $scope.queue = response.data.files || [];
                },
                function () {
                    $scope.loadingFiles = false;
                }
            );
        }

        loadFiles();

        function treeOf(file) {
            if (!file.tree) {
                if (!$scope.treeJSON) {
                    log('Could not add tree!');
                }
                file.tree = JSON.parse($scope.treeJSON);
            }
            return file.tree;
        }

        $scope.document = 'ImageMetadata';
        $scope.ingestedHeaders = [];

        function fetchIngested() {
            Document.fetchAllDocuments($scope.document, function (list) {
                console.log('ingestedDocuments'); // todo
                console.log(list);
                $scope.ingestedHeaders = _.map(list, function (doc) {
                    var header = doc.Header;
                    header.thumbnail = '/media/fetch/' + header.Identifier;
                    header.date = new Date(parseInt(header.TimeStamp));
                    return  header;
                });
            });
        }

        Document.fetchSchema($scope.document, function (tree) {
            $scope.setTree(tree);
            fetchIngested();
        });

        $scope.setTree = function (tree) {
            log('setTree');
            $scope.tree = tree;
            $scope.treeJSON = JSON.stringify(tree);
            _.each($scope.queue, function (file) {
                treeOf(file);
            });
        };

// this is only for the document controller within
//        $scope.chosenElement = null;
//        $scope.annotationMode = true;
//        $scope.tree = null;
//        $scope.setChoice = function (element) {
//            $scope.chosenElement = element;
//        };

        $scope.setValue = function () {
            log('setValue');
            log($scope.chosenElement);
            if (!$scope.chosenElement) return;
            _.each($scope.queue, function (file) {
                log(file);
                if (file.selected && treeOf(file)) {
                    var complete = true;
                    _.each(treeOf(file).elements, function (element) {
                        if (element.name == $scope.chosenElement.name) {
                            element.value = $scope.chosenElement.value;
                        }
                        if (!element.value) {
                            complete = false;
                        }
                    });
                    file.complete = complete;
                }
            });
        };

        $scope.showAnnotationPanel = false;
        $scope.allFilesSelected = false;

        $scope.selectAllFiles = function (value) {
            $scope.allFilesSelected = !$scope.allFilesSelected;
            _.each($scope.queue, function (file) {
                file.selected = $scope.allFilesSelected;
            });
        };

        $scope.toggleAnnotationPanel = function (file) {
            log(' toggle ');
            $scope.showAnnotationPanel = !$scope.showAnnotationPanel;
            if (file) {
                file.selected = !file.selected;
//                $scope.showAnnotationPanel = true;
            }
        };

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
                default:
                    log("UNRECOGNIZED extension: " + extension);
                    return 'image/jpeg';
            }
        }

        $scope.commit = function (file) {
            if ($rootScope.translating()) return;
            log('commit');
            log(file);
            var header = {
                SchemaName: $scope.document,
                Identifier: '#IDENTIFIER#',
                TimeStamp: "#TIMESTAMP#",
                EMail: $rootScope.user.email,
                MediaObject: {
                    fileName: file.name,
                    mimeType: getMimeType(file.name)
                }
            };
            var fileTree = treeOf(file);
            _.each(fileTree.elements, function (el) { // cheat
                if (el.name === 'Description') {
                    el.value = file.description;
                }
            });
            collectSummaryFields(fileTree, header);
            var body = treeToObject(fileTree);
            Document.saveDocument(header, body, function (header) {
                log("saved image");
                log(header);
                file.$destroy();
                fetchIngested();
            });
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
