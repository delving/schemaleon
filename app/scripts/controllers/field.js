'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.filter('elementDisplay',
    function () {
        return function (element) {
            if (_.isObject(element.value)) {
                return element.value[element.vocabulary.displayField];
            }
            else {
                return element.value;
            }
        }
    }
);

CultureCollectorApp.controller('VocabularyController',
    ['$scope', '$q', 'Vocabulary', 'XMLTree',
        function ($scope, $q, Vocabulary, XMLTree) {
            if (!$scope.el.vocabulary) return;
            $scope.v = $scope.el.vocabulary;
            $scope.setActive('vocabulary');

            $scope.getStates = function (query) {
                function filter(list) {
                    var filtered = _.filter(list, function (value) {
                        return value[$scope.v.displayField].toLowerCase().indexOf(query) >= 0;
                    });
                    return (filtered.length == 0) ? list : filtered;
                }

                if (!$scope.v.def) {
                    var deferred = $q.defer();
                    Vocabulary.get($scope.v.name, function (vocabulary) {
                        $scope.v.def = vocabulary;
                        $scope.v.tree = XMLTree.xmlToTree(vocabulary.schema);
                        $scope.v.displayField = $scope.v.tree.elements[0].name;
                        deferred.resolve(filter(vocabulary.list));
                    });
                    return deferred.promise;
                }
                else {
                    return filter($scope.v.def.list);
                }
            };

            if (!$scope.v.def) {
                $scope.getStates('');
            }

            $scope.createNew = function () {
                if ($scope.v.tree) {
                    $scope.el.elements = _.map($scope.v.tree.elements, function (el) {
                        el.value = null;
                        return el;
                    });
                }
            };

            $scope.submitNew = function () {
                $scope.newValue = XMLTree.treeToObject($scope.v.tree);
                Vocabulary.add($scope.v.name, $scope.newValue, function (vocabulary) {
                    $scope.v.def = vocabulary; // freshen
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
                if (!state) return [];
                return state[$scope.v.displayField];
            };

            $scope.setValue = function (value) {
                $scope.el.value = value;
                $scope.el.valueFields = _.map($scope.v.tree.elements, function (element) {
                    return { prompt: element.name, value: value[element.name] };
                });
            }
        }]
);

CultureCollectorApp.controller('TextInputController',
    ['$scope', 'Validator',
        function ($scope, Validator) {
            var ti = $scope.el.textInput;
            if (!ti) return;
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
                    })
                }
            }
        }]
);

CultureCollectorApp.controller('TextAreaController',
    ['$scope',
        function ($scope) {
            var ta = $scope.el.textArea;
            if (!ta) return;
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
