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
    ['$rootScope', '$scope', '$routeParams', '$location', 'Document', 'I18N',
        function ($rootScope, $scope, $routeParams, $location, Document, I18N) {
            $scope.panels = [];
            $scope.header = { SchemaName: 'Photograph' };
            $scope.showingList = true;

            function fetchList() {
                Document.fetchList(function (xml) {
                    $scope.headerList = _.sortBy(xmlToArray(xml), function (val) {
                        return -val.TimeStamp;
                    });
                    $scope.showingList = true;
                });
            }

            fetchList();

            function useHeader(h) {
                $scope.header.Identifier = h.Identifier ? h.Identifier : '#IDENTIFIER#';
                $scope.header.Title = h.Title;
                delete $scope.header.TimeStamp;
                var millis = parseInt(h.TimeStamp);
                if (!_.isNaN(millis)) {
                    $scope.header.TimeStamp = millis;
                }
            }

            function fetchSchema() {
                Document.fetchSchema($scope.header.SchemaName, function (schema) {
                    $scope.tree = xmlToTree(schema);
                    $scope.panels[0] = {
                        selected: 0,
                        element: $scope.tree
                    };
                    $scope.choose(0, 0);

                    if ($routeParams.id) {
                        Document.fetchDocument($routeParams.id, function (documentXml) {
                            var object = xmlToObject(documentXml);
                            populateTree($scope.tree, object.Document.Body);
                            useHeader(object.Document.Header);
                            $scope.showingList = false;
                        });
                    }
                    else {
                        $scope.header = {
                            SchemaName: 'Photograph',
                            Identifier: '#IDENTIFIER#'
                        }
                    }
                });
            }

            fetchSchema();

            $scope.$watch('i18n', function (i18n, oldValue) {
                if ($scope.tree && i18n) {
                    cleanTree($scope.tree, i18n);
                }
            });

            $scope.newDocument = function () {
                if ($rootScope.translating()) return;
                $scope.choosePath('/document/');
                $scope.showingList = false;
                fetchSchema();
            };

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

            $scope.saveDocument = function () {
                if ($rootScope.translating()) return;
                collectSummaryFields($scope.tree, $scope.header);
                var object = treeToObject($scope.tree);
                $scope.header.TimeStamp = "#TIMESTAMP#";
                $scope.header.EMail = $rootScope.user.email;
                var document = {
                    Document: {
                        Header: $scope.header,
                        Body: object
                    }
                };
                var documentXml = objectToXml(document);
                var body = {
                    header: $scope.header,
                    xml: documentXml
                };
                Document.saveXml(body, function (header) {
                    useHeader(header);
                    fetchList();
                    $location.path('/document/');
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

CultureCollectorApp.controller('DocumentViewController',
    ['$rootScope', '$scope', '$routeParams', '$location', 'Document', 'I18N',
        function ($rootScope, $scope, $routeParams, $location, Document, I18N) {
            $scope.header = { SchemaName: 'Photograph' };
            $scope.showingDocument = true;

            function useHeader(h) {
                $scope.header.Identifier = h.Identifier ? h.Identifier : '#IDENTIFIER#';
                $scope.header.Title = h.Title;
                $scope.header.TimeStamp = h.TimeStamp;
            }

            function fetchSchema() {
                Document.fetchSchema($scope.header.SchemaName, function (schema) {
                    $scope.tree = xmlToTree(schema);

                    if ($routeParams.id) {
                        Document.fetchDocument($routeParams.id, function (documentXml) {
                            var object = xmlToObject(documentXml);
                            populateTree($scope.tree, object.Document.Body);
                            useHeader(object.Document.Header);
                        });
                    }
                    else {
                        $scope.header = {
                            SchemaName: 'Photograph',
                            Identifier: '#IDENTIFIER#',
                            Title: 'Document not found'
                        }
                        $scope.showingDocument = false;
                    }
                    console.log($scope.tree);

                });
            }

            fetchSchema();

            $scope.$watch('i18n', function (i18n, oldValue) {
                if ($scope.tree && i18n) {
                    cleanTree($scope.tree, i18n);
                }
            });

        }]
);
