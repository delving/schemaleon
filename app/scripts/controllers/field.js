'use strict';

var OSCR = angular.module('OSCR');

OSCR.filter('elementDisplay',
    function () {
        return function (element) {
            if (!element.value) {
                return 'empty';
            }
            else if (element.vocabulary) {
                return element.value.Label; // todo
            }
            else if (element.media) {
                return element.value.Body.ImageMetadata.Description; // todo
            }
            else {
                return element.value;
            }
        };
    }
);

OSCR.controller(
    'MediaController',
    function ($scope, $q, Document, Image) {

        if (!$scope.el.media) {
            return;
        }
        $scope.m = $scope.elx.media;
        $scope.setActive('media');

        if (!$scope.m.tree) {
            Document.fetchSchema($scope.m.schemaName, function (schema) {
                $scope.m.tree = {
                    name: 'Entry',
                    elements: schema.elements[0].elements
                };
            });
        }

        $scope.getMediaList = function (schemaName, query) {
            console.log("ignoring query still: " + query); // todo
            var deferred = $q.defer();
            Document.fetchDocuments(schemaName, function (list) {
//                    console.log('list fetched'); // todo
//                    console.log(list);
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.mediaToString = function (media) {
            if (!media) {
                return [];
            }
//                console.log('media to string');
//                console.log(media);
            return media.Body.ImageMetadata.Description; // todo
        };

        $scope.$watch('chosenMedia', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
            }
        });

        $scope.setValue = function (value) {
            $scope.el.value = value.Body.ImageMetadata;
            console.log('setValue');
            console.log($scope.m);
            if ($scope.m.tree) {
                $scope.el.valueFields = _.map($scope.m.tree.elements, function (element) {
                    return  { prompt: element.name, value: $scope.el.value[element.name] };
                });
                console.log('valueFields');
                console.log($scope.el.valueFields);
            }
        };
    }
);

OSCR.controller(
    'VocabularyController',
    function ($scope, $q, Vocabulary) {
        if (!$scope.el.vocabulary) {
            return;
        }
        $scope.v = $scope.el.vocabulary;
        $scope.setActive('vocabulary');

        if (!$scope.v.tree) {
            Vocabulary.getSchema($scope.v.name, function (schema) {
                $scope.v.tree = {
                    name: 'Entry',
                    elements: schema.elements[0].elements
                };
            });
        }

        $scope.getStates = function (query) {
            var deferred = $q.defer();
            Vocabulary.select($scope.v.name, query, function (list) {
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.createNew = function (index, parentIndex) {
            if ($scope.v.tree) {
                $scope.el.elements = _.filter($scope.v.tree.elements, function (el) {
                    el.value = null;
                    return el.name != 'ID'; // todo: how do we know this?
                });
                $scope.choose(0, parentIndex);
            }
        };

        $scope.submitNew = function () {
            $scope.newValue = treeToObject($scope.v.tree);
            Vocabulary.add($scope.v.name, $scope.newValue, function (entry) {
                $scope.panels.pop();
                $scope.el.elements = null;
                $scope.setValue(entry.Entry);
                $scope.disableEditor();
            });
        };

        $scope.cancelNew = function () {
            $scope.el.elements = null;
            $scope.panels.pop(); // kill the new element input panel
        };

        $scope.enableClearedEditor = function () {
            $scope.chosenState = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
            $scope.enableEditor();
        };

        $scope.$watch('chosenState', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
            }
        });

        $scope.stateToString = function (state) {
            if (!state) {
                return [];
            }
            return state.Label; // todo
        };

        $scope.setValue = function (value) {
            $scope.el.value = value;
            if ($scope.v.tree) {
                $scope.el.valueFields = _.map($scope.v.tree.elements, function (element) {
                    return  { prompt: element.name, value: value[element.name] };
                });
            }
        };
    }
);

OSCR.controller(
    'TextInputController',
    function ($scope, Validator) {
        var ti = $scope.el.textInput;
        if (!ti) {
            return;
        }
        $scope.setActive('textInput');
        if (ti.validator) {
            var func = Validator.getFunction(ti.validator);
            if (func) {
                $scope.validator = function () {
                    return func($scope.el.value);
                };
                $scope.invalidMessage = 'Nothing yet';
                $scope.$watch('el.value', function (after, before) {
                    $scope.invalidMessage = $scope.validator();
                });
            }
        }
    }
);

OSCR.controller(
    'TextAreaController',
    function ($scope) {
        var ta = $scope.el.textArea;
        if (!ta) {
            return;
        }
        $scope.setActive('textArea');
    }
);

OSCR.controller(
    'HiddenController',
    function ($scope) {
        if ($scope.el.elements) {
            $scope.setActive('hidden');
        }
    }
);
