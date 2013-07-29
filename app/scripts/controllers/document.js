'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');


/* CRM OBJECT RELATED CONTROLLERS */

CultureCollectorApp.directive('specialKey', function () {
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
                            s.$eval(attr.specialKey, { $key: pair.name });
                        });
                    }
                });
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
                if (attrs.id === scope.active) {
                    element[0].focus();
                }
            }
        };
    }
);

CultureCollectorApp.controller('DocumentController',
    ['$scope', 'Document', 'I18N',
        function ($scope, Document, I18N) {

            var schemaName = 'Photograph';

            $scope.panels = [];

            Document.fetchSchema(schemaName, function (schema) {
                $scope.tree = xmlToTree(schema);
                $scope.header = {
                    // todo: fields in the schema will have to be
                    // todo: marked as title, identifier
                    Identifier: '#IDENTIFIER#',
                    Title: "Big Bang",
                    SchemaName: schemaName
                };
                $scope.panels[0] = {
                    selected: 0,
                    element: $scope.tree
                };
                // initialize with first element in first panel active
                // for immediate keyboard navigation
                $scope.choose(0, 0);
            });

            $scope.$watch('i18n', function (i18n, oldValue) {
                if ($scope.tree && i18n) {
                    cleanTree($scope.tree, i18n);
                }
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

            $scope.saveDocument = function() {
                var object = treeToObject($scope.tree);
                var document = {
                    Document: {
                        Header: $scope.header,
                        Body: object
                    }
                };
                var documentXml = objectToXml(document);
                console.log('turned to xml');
                console.log(documentXml);
                var body = {
                    header: $scope.header,
                    xml: documentXml
                };
                Document.saveXml(body, function(header) {
                    console.log('saved');
                    console.log(header);
                    $scope.header.Identifier = header.Identifier;
                    $scope.header.Title = header.Title;
                    // todo: navigate somewhere!
                });
            }
        }]
);

CultureCollectorApp.controller('PanelController',
    ['$scope',
        function ($scope) {
            if (!$scope.panel) {
                return;
            }

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
                $scope.el.edit = ($scope.el.value === undefined);
            };

            $scope.disableEditor();

            $scope.setActive = function (field) {
                $scope.active = field;
            };

            $scope.specialKeyPressed = function (key) {
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
                    case 'enter':
                        if (!$scope.el.edit) {
                            $scope.enableEditor();
                        }
                        else if ($scope.active === 'textInput' || $scope.active === 'vocabulary') {
                            $scope.disableEditor();
                        }
                        break;
                    case 'escape':
                        if ($scope.el.edit) {
                            $scope.disableEditor();
                        }
                        break;
                }
            };

        }]
);
