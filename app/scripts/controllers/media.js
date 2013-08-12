'use strict';


var OSCR = angular.module('OSCR');

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
                    $scope.cloneTree();
                },
                function () {
                    $scope.loadingFiles = false;
                }
            );
        }

        loadFiles();

        $scope.document = 'ImageMetadata';
        $scope.tree = null;
        $scope.chosenElement = null;
        $scope.annotationMode = true;


        $scope.cloneTree = function () {
            console.log('cloneTree');
            if ($scope.queue && $scope.treeJSON) {
                _.each($scope.queue, function (file) {
                    file.tree = JSON.parse($scope.treeJSON);
                });
            }
        };


        $scope.setTree = function (tree) {
            console.log('setTree');
            $scope.tree = tree;
            $scope.treeJSON = JSON.stringify(tree);
            $scope.cloneTree();
            if ($scope.queue) {
                _.each($scope.queue, function (file) {
                    file.tree = JSON.parse($scope.treeJSON);
                });
            }
        };



        $scope.setChoice = function (element) {
            $scope.chosenElement = element;
        };

        $scope.setValue = function () {
            if (!$scope.chosenElement) return;
            _.each($scope.queue, function (file) {
                if (file.selected && file.tree) {
                    var complete = true;
                    _.each(file.tree.elements, function (element) {
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
            console.log(' toggle ');
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
                    console.log("UNRECOGNIZED extension: " + extension);
                    return 'image/jpeg';
            }
        }

        $scope.commit = function (file) {
            if ($rootScope.translating()) return;
            console.log('commit');
            console.log(file);
            var header = {
                SchemaName: $scope.document,
                Identifier: '#IDENTIFIER#',
                TimeStamp: "#TIMESTAMP#",
                EMail: $rootScope.user.email,
                DigitalObject: {
                    fileName: file.name,
                    mimeType: getMimeType(file.name)
                }
            };
            collectSummaryFields(file.tree, header);
            var body = treeToObject(file.tree);
            Document.saveDocument(header, body, function (header) {
                console.log("saved image");
                console.log(header);
                file.$destroy();
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
