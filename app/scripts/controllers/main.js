'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

/* CRM LIST RELATED CONTROLLERS */

CultureCollectorApp.controller('NavigationController',
    ['$scope', '$location',
        function ($scope, $location) {
            $scope.mainMenu = {
                section: "Main",
                links: [
                    {label: "Dashboard", path: "/#/dashboard", active: false},
                    {label: "Registered Objects", path: "/#/list", active: false},
                    {label: "Object", path: "/#/object", active: false}
                ]
            };
            $scope.choose = function (index) {
                var walk = 0;
                _.forEach($scope.mainMenu.links, function (link) {
                    link.active = (walk == index);
                    walk++;
                });
            };
            var anyActive = false;
            _.forEach($scope.mainMenu.links, function (link) {
                var sought = link.path.substring(3);
                link.active = ($location.path().indexOf(sought) >= 0);
                if (link.active) anyActive = true;
            });
            if (!anyActive) $scope.mainMenu.links[0].active = true;
        }]
);

CultureCollectorApp.filter('title',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                var translated = I18N.translate(element.name);
                if (translated) {
                    return translated;
                }
                return element.title;
            }
        }]
);

CultureCollectorApp.controller('I18NController',
    ['$scope', 'I18N',
        function ($scope, I18N) {
            I18N.fetchList('nl');
        }]
);

CultureCollectorApp.controller('ObjectListController',
    ['$scope', 'ObjectList',
        function ($scope, ObjectList) {
            ObjectList.fetchList(function (data) {
                $scope.objects = data;
            });
        }]
);

/* CRM OBJECT RELATED CONTROLLERS */

CultureCollectorApp.controller('ObjectEditController',
    ['$scope', 'Documents', 'XMLTree', 'I18N',
        function ($scope, Documents, XMLTree, I18N) {

            $scope.panels = [];

            Documents.fetchDocument('ID939393', function (doc) {
                var tree = XMLTree.xmlToTree(doc);
                $scope.panels[0] = {
                    'element': tree
                };
            });

            $scope.choose = function (index, parentIndex) {
                var element = $scope.panels[parentIndex].element.elements[index];
                $scope.panels[parentIndex].element.elements.forEach(function (el) {
                    el.classIndex = parentIndex;
                    if (el == element) el.classIndex++;
                });
                $scope.panels[parentIndex + 1] = {
                    'element': element
                };
                if (element.elements) {
                    element.elements.forEach(function (el) {
                        el.classIndex = parentIndex + 1;
                    });
                }
                $scope.panels.splice(parentIndex + 2, 5);
            };

            $scope.addSibling = function (list, index, parentIndex) {
                // should be some kind of deep copy
                var existing = list[index];
                var fresh = JSON.parse(JSON.stringify(existing));
                fresh.value = '';
                existing.multiple = false;
                existing.classIndex = parentIndex + 1;
                list.splice(index + 1, 0, fresh);
            };

            $scope.getTitle = function (element) {
                var key = element.name;
                if ($scope.i18n) {
                    console.log('i18n key ' + key);
                    var string = $scope.i18n[key];
                    console.log('i18n value ' + string);
                    if (string) {
                        return string;
                    }
                }
                else {
                    console.log('No i18n in scope!');
                }
                return element.title;
            }
        }]
);

CultureCollectorApp.controller('PanelController',
    ['$scope',
        function ($scope) {
            if (!$scope.panel) return;
            $scope.checkEmpty = function () {
                if ($scope.el.value != undefined && $scope.el.value.replace(/^\s+|\s+$/g, '').length == 0) {
                    $scope.el.value = undefined;
                }
            };
            $scope.el = $scope.panel.element;

            // Panel Element Editor Toggles
            $scope.enableEditor = function (element) {
                $scope.el.edit = true;
            };

            $scope.disableEditor = function (element) {
                $scope.checkEmpty();
                $scope.el.edit = ($scope.el.value == undefined);
            };

            $scope.disableEditor();
        }]
);

CultureCollectorApp.controller('VocabularyController',
    ['$scope', '$q', 'Vocabulary',
        function ($scope, $q, Vocabulary) {
            if (!$scope.el.vocabulary) return;
            $scope.createNew = function () {
                Vocabulary.getFields($scope.el.vocabulary.name, function (fields) {
                    $scope.newFields = _.map(fields, function (field) {
                        return { name:field, title:field };
                    });
                });
            };
            $scope.getStates = function (value) {
                var deferred = $q.defer();
                Vocabulary.getStates($scope.el.vocabulary.name, value, function (states) {
                    deferred.resolve(states);
                });
                return deferred.promise;
            };
            $scope.$watch('chosenState', function (after, before) {
                if (_.isObject(after)) {
                    $scope.el.value = after;
                }
            });
        }]
);


CultureCollectorApp.controller('TextInputController',
    ['$scope', 'Validator',
        function ($scope, Validator) {
            var ti = $scope.el.textInput;
            if (!ti) return;
            if (ti.validator) {
                console.log("validator " + ti.validator);
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





