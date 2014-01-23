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

        $scope.enableVocabularyEditor = function () {
            console.log("enableVocabularyEditor", $scope.el);
            $scope.enableEditor();
            $scope.el.searching = true;
        };

        $scope.enableClearedEditor = function () {
            if ($rootScope.config.showTranslationEditor) return;
            $scope.chosenEntry = null;
            $scope.el.value = null;
            $scope.enableEditor();
        };

        $scope.$watch('chosenEntry', function (value, before) {
            if (_.isObject(value)) {
                $scope.el.value = value;
            }
        });

        $scope.entryToString = function (entry) {
            if (!entry || !entry.Label) return '';
            return entry.Label;
        };

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
            $scope.el.searching = false;
        };

//        $scope.createNew = function (index, parentIndex) { may want to move to the next place
//            $scope.choose(0, parentIndex);
//        };

        $scope.createNewValue = function () {
            // todo: "are you sure" question
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

OSCR.controller(
    'MediaElementController',
    function ($rootScope, $scope, $q, $dialog, Document) {
        $scope.openVideoPreview = function (srcFile) {
            var srcPath = '/media/fetch/' + srcFile;
            var dialog = $dialog.dialog({
                dialogFade: true,
                backdrop: true,
                fadeBackdrop: true,
                keyboard: true,
                controller: 'previewDialogController',
                template: '<div class="modal-header"><h3>Video Preview</h3></div>' +
                    '<div class="modal-body">' +
                    '<video width="320" height="240" controls>' +
                    '<source src="' + srcPath + '" type="video/mp4" />' +
                    '</video>' +
                    '<div class="modal-footer">' +
                    '<button ng-click="close()" class="btn btn-primary">Ok</button>' +
                    '</div>'

            });
            if(!$rootScope.config.showTranslationEditor){
                dialog.open();
            }
        };

        $scope.enableMediaEditor = function () {
            $scope.enableEditor();
            $scope.el.searching = true;
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
        $scope.groupIdentifier = $rootScope.user.groupIdentifier;

        if (!$scope.el.tree) {
            Document.fetchSchema($scope.schema, function (schema) {
                $scope.el.tree = {
                    name: 'Entry',
                    elements: schema.elements
                };
            });
        }
//
        function refreshList() {
            Document.listDocuments($scope.schema, $scope.groupIdentifier, function(list) {
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
            $scope.el.value = angular.copy(value.Body);
            $scope.el.value.Identifier = value.Header.Identifier;
            if ($scope.el.tree) {
                $scope.el.valueFields = _.map($scope.el.tree.elements, function (element) {
                    return  { prompt: element.name, value: $scope.el.value[element.name] };
                });
            }
//            todo: $scope.disableEditor();
        };

        $scope.refreshImageList = function () {
            refreshList();
        };

        $scope.$watch('el.value', function (after, before) {
            $scope.revalidate();
        });
    }
);



OSCR.filter('mediaThumbnail',
    function ($rootScope) {
        return function (element) {
            if (element.value && element.config.media) {
                return '/media/thumbnail/' + $rootScope.getProperThumbExtension(element.value.Identifier);
            }
            else {
                return '';
            }
        };
    }
);

OSCR.filter('mediaFile',
    function ($rootScope) {
        return function (element) {
            if (element.value && element.config.media) {
                return '/media/fetch/' + element.value.Identifier;
            }
            else {
                return '';
            }
        };
    }
);

OSCR.filter('mediaLabel',
    function () {
        return function (element) {
            if (_.isString(element.value)) {
                return element.value;
            }
            else if (element.value) {
                return element.value.Label;
            }
            else {
                return '';
            }
        };
    }
);

OSCR.filter('elementDisplay',
    function () {
        return function (element) {
            if (!element.value) {
                return 'empty';
            }
            else if (element.config.vocabulary) {
                return element.value.Label; // todo
            }
            else if (element.config.media) {
                return element.value.Identifier;
            }
            else {
                return element.value;
            }
        };
    }
);

