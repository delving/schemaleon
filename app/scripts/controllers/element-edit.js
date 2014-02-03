'use strict';

// todo: this should replace field.js

var OSCR = angular.module('OSCR');

OSCR.controller(
    'TextInputController',
    function ($scope) {
        if (!($scope.el.config.line || $scope.el.config.paragraph)) {
            console.warn("TextInputController used in the wrong place");
            return;
        }

        $scope.$watch('el.value', function (after, before) {
            if (after) {
                $scope.valueChanged($scope.el);
            }
        });
    }
);

OSCR.controller(
    'VocabularyController',
    function ($scope, $q, Vocabulary, $rootScope) {

        if (!$scope.el.config.vocabulary) {
            return;
        }
        $scope.schema = $scope.el.config.vocabulary;

        $scope.$watch('chosenEntry', function (value, before) {
            if (_.isObject(value)) {
                $scope.el.value = value;
            }
        });

        $scope.$watch('el.value', function (after, before) {
            $scope.valueChanged($scope.el);
        });
    }
);
OSCR.controller(
    'VocabularySearchController',
    function ($scope, Vocabulary) {

        $scope.el = $scope.panel.element;

        if (!$scope.el.config.vocabulary) {
            return;
        }
        $scope.schema = $scope.el.config.vocabulary;

        $scope.setValue = function (value) {
            $scope.el.value = value;  // vocabulary controller is watching this
            $scope.setEditing(false);
        };

        $scope.createNewValue = function () {
            // todo: "are you sure?" question
            var newValue = {
                "Entry": {
                    "Label": $scope.el.searchValue
                }
            };
            Vocabulary.add($scope.schema, newValue, function (entry) {
                $scope.setValue(entry.Entry);
                console.log('saved ' + JSON.stringify(entry.Entry));
            });
        };

        $scope.$watch('el.searchValue', function (newSearchValue, before) {
            if (newSearchValue) {
                Vocabulary.select($scope.schema, newSearchValue, function (entries) {
                    $scope.el.entries = entries;
                });
            }
        });
    }
);

OSCR.controller( // TODO: this works inconsistently. IN view now commented out. Fix later. Dialog also does not seem to get closed properly
    'MediaElementController',
    function ($rootScope, $scope, $q, $dialog, $filter) {
        $scope.openVideoPreview = function (elem) {
            $scope.videoFile = '';
            var videoMime = elem.value.MimeType;
            $scope.videoFile = $filter('mediaFile')(elem);
            $scope.$watch('videoFile', function () {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    controller: 'previewDialogController',
                    template: '<div class="modal-header"><h3>Video Preview</h3></div>' +
                        '<div class="modal-body">' +
                        '<video width="320" height="240" controls autoplay="true">' +
                        '<source src="' + $scope.videoFile + '" type="' + videoMime + '" />' +
                        '</video>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close()" class="btn btn-primary">Ok</button>' +
                        '</div>'
                });
                if (!$rootScope.config.showTranslationEditor) {
                    dialog.open();
                }
            });
        };
        // todo: should not be needed!
        $scope.enableMediaEditor = function () {
            $scope.setEditing(true);
            $scope.chosenMedia = null;
        };
    }
);

function previewDialogController($scope, dialog) {
    $scope.close = function () {
        dialog.close();
    };
}

OSCR.controller(
    'MediaSearchController',
    function ($rootScope, $scope, $q, $dialog, Document) {
        $scope.el = $scope.panel.element;
        if (!$scope.el.config.media) {
            console.warn("MediaSearchController with no config media");
            return;
        }
        $scope.chosenMedia = null;
        $scope.schema = $scope.el.config.media;
        $scope.groupIdentifier = $rootScope.userGroupIdentifier();

        if (!$scope.el.tree) {
            Document.fetchSchema($scope.schema, function (schema) {
                $scope.el.tree = {
                    name: 'Entry',
                    elements: schema.elements
                };
            });
        }

        function refreshList() {
            Document.searchDocuments($scope.schema, $scope.groupIdentifier, {}, function(list) {
                $scope.mediaList = list;
            });
        }

        refreshList();

        if (!$scope.valueChecked) {
            if ($scope.el.value) {
//                todo $scope.disableEditor();
                Document.fetchDocument($scope.schema, $scope.groupIdentifier, $scope.el.value.Identifier, function (fetchedValue) {
                    $scope.setValue(fetchedValue.Document);
                });
            }
            $scope.valueChecked = true;
        }

        $scope.selectMedia = function(entry) {
            $scope.setValue(entry);
        };

        $scope.setValue = function (value) {
            // make a copy of the body and add header things to it
            var augmentedBody = angular.copy(value.Body);
            augmentedBody.Identifier = value.Header.Identifier;
            augmentedBody.GroupIdentifier = value.Header.GroupIdentifier;
            $scope.el.value = augmentedBody;
//            $scope.setEditing(false);
        };

        $scope.refreshImageList = function () {
            refreshList();
        };

        $scope.$watch('el.value', function (after, before) {
            $scope.validateTree();
        });
    }
);

OSCR.controller(
    'InstanceController',
    function ($scope, $q, $rootScope) {

        if (!$scope.el.config.instance) {
            return;
        }
        $scope.schema = $scope.el.config.instance;

        $scope.$watch('chosenEntry', function (value, before) {
            if (_.isObject(value)) {
                $scope.el.value = value;
                // todo: value's identifier as a link
            }
        });

        $scope.$watch('el.value', function (after, before) {
            $scope.valueChanged($scope.el);
        });
    }
);
OSCR.controller(
    'InstanceSearchController',
    function ($rootScope, $scope, Document) {

        $scope.el = $scope.panel.element;

        $scope.instanceDetails = false;

        $scope.showInstanceDetails = function() {
            $scope.instanceDetails = !$scope.instanceDetails;
            console.log($scope.instanceDetails);
        };

        if (!$scope.el.config.instance) {
            return;
        }

        $scope.schema = $scope.el.config.instance;

//        $scope.instanceList = _.map($rootScope.schemaMap.shared, function(sharedSchema) {
//            var fieldList = [];
//            switch(sharedSchema){
//                case 'Person':
//                fieldList = [
//                    {
//                        'name' :'entry.Body.Person.Birth.DateOfBirth',
//                        'name' :'entry.Body.Person.Birth.DateOfBirth',
//                        'label': 'DateOfBirth'
//                    }
//
//                ]
//            }
//            return {
//                name: sharedSchema,
//                path: "/shared/" + sharedSchema
//                fields: fieldList
//            };
//        });
//
//        console.log( $scope.instanceList);

        $scope.setValue = function (value) {
            $scope.el.value = value.Header;  // instance controller is watching this
            $scope.setEditing(false);
        };

        $scope.$watch('el.searchValue', function (searchValue, oldSearchValue) {
            var searchParams = {
                searchQuery: searchValue
            };
            Document.searchDocuments($scope.schema, null, searchParams, function (entries) {
                $scope.el.entries = entries;
            });
        });
    }
);

OSCR.controller(
    'FieldDocumentationController',
    function ($scope, Document) {
        $scope.el = $scope.panel.element;
    }
);

