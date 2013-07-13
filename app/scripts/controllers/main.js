'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');


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

            $scope.getInclude = function(){
                if($location.path().indexOf('/object.html')){
                    return "views/legend.html";
                }
                return "";
            }
        }]
);

CultureCollectorApp.filter('elementTitle',
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

CultureCollectorApp.directive('arrowKey', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            elem.bind('keydown', function (e) {
                var direction = null;
                switch (e.keyCode) {
                    case 37: // left
                        direction = 'left';
                        break;
                    case 39: // right
                        direction = 'right';
                        break;
                    case 38: // up
                        direction = 'up';
                        break;
                    case 40: // down
                        direction = 'down';
                        break;
                }
                if (direction) {
                    scope.$apply(function (s) {
                        s.$eval(attr.arrowKey, { $direction: direction });
                    });
                }
            });
        }
    };
});

CultureCollectorApp.directive('focus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function (scope, element, attrs) {
                if (attrs.id == scope.active) {
                    element[0].focus();
                }
            }
        };
    }
);

CultureCollectorApp.controller('ObjectEditController',
    ['$scope', 'Documents', 'XMLTree', 'I18N',
        function ($scope, Documents, XMLTree, I18N) {

            $scope.panels = [];

            Documents.fetchDocument('ID939393', function (doc) {
                var tree = XMLTree.xmlToTree(doc);
                $scope.panels[0] = {
                    selected: 0,
                    element: tree
                };
            });

            $scope.choose = function (choice, parentIndex) {
                $scope.selected = choice;
                $scope.selectedWhere = parentIndex;
                var parentPanel = $scope.panels[parentIndex];
                parentPanel.selected = choice;
                var chosen = parentPanel.element.elements[choice];
                parentPanel.element.elements.forEach(function (el) {
                    el.classIndex = parentIndex;
                    if (el == chosen) el.classIndex++;
                });
                $scope.panels[parentIndex + 1] = {
                    selected: 0,
                    element: chosen
                };
                if (chosen.elements) {
                    chosen.elements.forEach(function (el) {
                        el.classIndex = parentIndex + 1;
                    });
                }
                $scope.panels.splice(parentIndex + 2, 5);

                // slide panels over
                var scroller = $('#panel-container'),
                    table = $('#panel-table'),
                    wTable = table.width(),
                    leftPos = scroller.scrollLeft();

                scroller.animate({scrollLeft: leftPos + wTable}, 800);
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
            };

            $scope.arrowKeyPressed = function (direction) {
                var size = $scope.panels[$scope.selectedWhere].element.elements.length;
                switch (direction) {
                    case 'up':
                        if ($scope.selected > 0) {
                            $scope.choose($scope.selected - 1, $scope.selectedWhere);
                        }
                        else {
                            $scope.choose(size - 1, $scope.selectedWhere);
                        }
                        break;
                    case 'down':
                        if ($scope.selected < size - 1) {
                            $scope.choose($scope.selected + 1, $scope.selectedWhere);
                        }
                        else {
                            $scope.choose(0, $scope.selectedWhere);
                        }
                        break;
                    case 'right':
                        if ($scope.panels[$scope.selectedWhere + 1].element.elements) {
                            $scope.choose(0, $scope.selectedWhere + 1);
                        }
                        break;
                    case 'left':
                        if ($scope.selectedWhere > 0) {
                            $scope.choose($scope.panels[$scope.selectedWhere - 1].selected, $scope.selectedWhere - 1);
                        }
                        break;
                }
            }
        }]
);

CultureCollectorApp.controller('PanelController',
    ['$scope',
        function ($scope) {
            if (!$scope.panel) return;
            $scope.checkEmpty = function () {
                if (!$scope.el.value || /^\s*$/.test($scope.el.value)) {
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

            $scope.setActive = function (field) {
                $scope.active = field;
            };
        }]
);

CultureCollectorApp.controller('VocabularyController',
    ['$scope', '$q', 'Vocabulary', 'XMLTree',
        function ($scope, $q, Vocabulary, XMLTree) {
            if (!$scope.el.vocabulary) return;
            $scope.v = $scope.el.vocabulary;
            $scope.setActive('vocabulary');

            $scope.getStates = function (query) {
                if (!$scope.v.def) {
                    var deferred = $q.defer();
                    Vocabulary.get($scope.v.name, function (vocabulary) {
                        $scope.v.def = vocabulary;
                        $scope.v.tree = XMLTree.xmlToTree(vocabulary.schema);
                        $scope.v.displayField = $scope.v.tree.elements[0].name;
                        deferred.resolve(_.filter(vocabulary.list, function (value) {
                            return value[$scope.v.displayField].toLowerCase().indexOf(query) >= 0;
                        }));
                    });
                    return deferred.promise;
                }
                else {
                    return _.filter($scope.v.def.list, function (value) {
                        return value[$scope.v.displayField].toLowerCase().indexOf(query) >= 0;
                    })
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
                    return { prompt: element.title, value: value[element.name] };
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





