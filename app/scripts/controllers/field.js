'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.filter('elementDisplay',
    function () {
        return function (element) {
            if (_.isObject(element.value)) {
                return element.value.Label;
            }
            else {
                return element.value;
            }
        };
    }
);

CultureCollectorApp.controller('VocabularyController',
    ['$scope', '$q', 'Vocabulary',
        function ($scope, $q, Vocabulary) {
            if (!$scope.el.vocabulary) {
                return;
            }
            $scope.v = $scope.el.vocabulary;
            $scope.setActive('vocabulary');

            if (!$scope.v.tree) {
                Vocabulary.getSchema($scope.v.name, function(schema) {
                    var treePlus = xmlToTree(schema);
                    $scope.v.tree = { elements: treePlus.elements[0].elements };
                });
            }

            $scope.getStates = function (query) {
                var deferred = $q.defer();
                Vocabulary.select($scope.v.name, query, function(xml) {
                    deferred.resolve(xmlToObject(xml));
                });
                return deferred.promise;
            };

            $scope.createNew = function (index, parentIndex) {
                if ($scope.v.tree) {
                    $scope.el.elements = _.map($scope.v.tree.elements, function (el) {
                        el.value = null;
                        return el;
                    });
                    $scope.choose(0, parentIndex);
                }
            };

            $scope.submitNew = function () {
                $scope.newValue = treeToObject($scope.v.tree);
                Vocabulary.add($scope.v.name, $scope.newValue, function (entry) {
                    $scope.panels.pop();
                    $scope.el.elements = null;
                    $scope.setValue($scope.newValue.Entry);
                    $scope.disableEditor();
                });
            };

            $scope.cancelNew = function () {
                $scope.el.elements = null;
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
                return state[$scope.v.displayField];
            };

            $scope.setValue = function (value) {
                $scope.el.value = value;
                $scope.el.valueFields = _.map($scope.v.tree.elements, function (element) {
                    return { prompt: element.name, value: value[element.name] };
                });
            };
        }]
);

CultureCollectorApp.controller('TextInputController',
    ['$scope', 'Validator',
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
        }]
);

CultureCollectorApp.controller('TextAreaController',
    ['$scope',
        function ($scope) {
            var ta = $scope.el.textArea;
            if (!ta) {
                return;
            }
            $scope.setActive('textArea');
        }]
);

CultureCollectorApp.controller('HiddenController',
    ['$scope',
        function ($scope) {
            if ($scope.el.elements) {
                $scope.setActive('hidden');
            }
        }]
);
