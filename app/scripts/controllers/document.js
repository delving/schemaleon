'use strict';

var OSCR = angular.module('OSCR');

/* CRM OBJECT RELATED CONTROLLERS */

OSCR.controller(
    'DocumentController',
    function ($rootScope, $scope, Document) {

        $scope.panels = [];

        $scope.$watch('i18n', function (i18n, oldValue) {
            if ($scope.tree && i18n) {
                i18nTree($scope.tree, i18n);
            }
        });

        $scope.setDirty = function () { // called by fields for live validation bubbling up
            _.each($scope.panels, function (panel) {
                panel.element.dirty = true;
            });
        };

        $scope.$watch('document', function (document, oldValue) {
            // maybe use old value for something like making sure they're not making a mistake
            if (!document) return;
            var empty = _.isString(document);
            var schema = empty ? document : document.Header.SchemaName;
            if (!schema) return;
            Document.fetchSchema(schema, function (tree) {
                if (!tree) return;
                installValidators(tree);
                $scope.setTree(tree);
                $scope.panels = [
                    { selected: 0, element: $scope.tree }
                ];
                $scope.choose(0, 0);
                if (!empty) {
                    populateTree(tree, document.Body);
                }
                validateTree(tree);
            });
        });

        $scope.choose = function (choice, parentIndex) {
            $scope.selected = choice;
            $scope.selectedWhere = parentIndex;
            var parentPanel = $scope.panels[parentIndex];
            parentPanel.selected = choice;
            var chosen = parentPanel.element.elements[choice];
            parentPanel.element.elements.forEach(function (el) {
                el.classIndex = parentIndex;
                if (el === chosen) {
                    el.classIndex++;
                }
            });
            var childPanel = $scope.panels[parentIndex + 1] = {
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

            if ($scope.setChoice) {
                $scope.setChoice(childPanel.element);
            }
        };

        $scope.addSibling = function (list, index, parentIndex) {
            // should be some kind of deep copy
            var existing = list[index];
            var fresh = cloneTree(existing);
            existing.classIndex = parentIndex + 1; // what does this do?
            list.splice(index + 1, 0, fresh);
        };
    }
);

OSCR.controller(
    'DocumentPanelController',
    function ($scope) {
        if (!$scope.panel) {
            return;
        }

        $scope.el = $scope.panel.element;

        $scope.enableEditor = function () {
            $scope.el.edit = true;
        };

        $scope.disableEditor = function () {
            $scope.el.edit = false; //($scope.el.value === undefined);
        };

        $scope.disableEditor();

        $scope.setActive = function (field) {
            console.log("active:" + field); // todo: remove
            $scope.active = field;
        };

        $scope.navigationKeyPressed = function (key) {
            var size = $scope.panels[$scope.selectedWhere].element.elements.length;
            switch (key) {
                case 'up':
                    $scope.choose(($scope.selected + size - 1) % size, $scope.selectedWhere);
                    break;
                case 'down':
                    $scope.choose(($scope.selected + 1) % size, $scope.selectedWhere);
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
//                case 'enter':
//                    if (!$scope.el.edit) {
//                        $scope.enableEditor();
//                    }
//                    else if ($scope.active === 'textInput' || $scope.active === 'vocabulary' || scope.active === 'media' ) {
//                        $scope.disableEditor();
//                    }
//                    break;
//                case 'escape':
//                    if ($scope.el.edit) {
//                        $scope.disableEditor();
//                    }
//                    break;
            }
        };

    }
);

OSCR.directive('focus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function (scope, element, attrs) {
                if (attrs.id === scope.active) {
                    console.log("focus:" + attrs.id); // todo: remove
                    element[0].focus();
                }
            }
        };
    }
);

OSCR.directive('documentNavigation', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            elem.bind('keydown', function (e) {
                _.each([
                    { code: 37, name: 'left'},
                    { code: 39, name: 'right'},
                    { code: 38, name: 'up'},
                    { code: 40, name: 'down'},
                    { code: 13, name: 'enter'},
                    { code: 27, name: 'escape'}
                ], function (pair) {
                    if (pair.code === e.keyCode) {
                        scope.$apply(function (s) {
                            s.$eval(attr.documentNavigation, { $key: pair.name });
                        });
                    }
                });
            });
        }
    };
});

