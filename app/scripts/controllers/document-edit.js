'use strict';

var OSCR = angular.module('OSCR');

/* CRM OBJECT RELATED CONTROLLERS */

OSCR.controller(
    'DocumentEditController',
    function ($rootScope, $scope, $dialog, $routeParams, $location, $timeout, Document) {

        $rootScope.checkLoggedIn();

        $scope.blankIdentifier = '#IDENTIFIER#';
        $scope.blankTimeStamp = '#TIMESTAMP#';
        $scope.headerDisplay = '';
        $scope.schema = $routeParams.schema;
        $scope.identifier = $routeParams.identifier;
        $scope.header = {};
        $scope.tree = null;
        $scope.documentDirty = false;

        function getTime(millis) {
            var ONE_SECOND = 1000, ONE_MINUTE = ONE_SECOND * 60, ONE_HOUR = ONE_MINUTE * 60, ONE_DAY = ONE_HOUR * 24;
            var days = Math.floor(millis / ONE_DAY);
            var hourMillis = Math.floor(millis - ONE_DAY * days);
            var hours = Math.floor(hourMillis / ONE_HOUR);
            var minuteMillis = Math.floor(millis - ONE_HOUR * hours);
            var minutes = Math.floor(minuteMillis / ONE_MINUTE);
            var secondMillis = Math.floor(minuteMillis - minutes * ONE_MINUTE);
            var seconds = Math.floor(secondMillis / ONE_SECOND);
            var time = {};
            if (days > 0) {
                time.days = days;
                time.hours = hours;
            }
            else if (hours > 0) {
                time.hours = hours;
                time.minutes = minutes;
            }
            else if (minutes > 0) {
                time.minutes = minutes;
                if (minutes < 10) {
                    time.seconds = seconds;
                }
            }
            else {
                time.seconds = seconds;
            }
            return time;
        }

        function updateTimeString() {
            if (!$scope.header.TimeStamp) {
                delete $scope.time;
            }
            else {
                var timeStamp = $scope.header.TimeStamp;
                var now = new Date().getTime();
                var elapsed = now - timeStamp;
                var timeString = getTime(elapsed);
                $scope.time = getTime(elapsed);
            }
        }

        function tick() {
            if (!$scope.header.TimeStamp) return;
            $timeout(updateTimeString, 60000).then(tick);
        }

        function useHeader(h) {
            $scope.header.SchemaName = $scope.schema;
            $scope.header.Identifier = h.Identifier;
            $scope.headerDisplay = h.Identifier === $scope.blankIdentifier ? null : h.Identifier;
            $scope.header.Title = h.Title;
            delete $scope.header.TimeStamp;
            var millis = parseInt(h.TimeStamp);
            if (!_.isNaN(millis)) {
                $scope.header.TimeStamp = millis;
                tick();
            }
        }

        if ($scope.identifier === 'create') {
            useHeader({
                SchemaName: $scope.schema,
                Identifier: $scope.blankIdentifier
            });
            $scope.document = $scope.schema; // just a name triggers schema fetch
            $scope.documentDirty = false;
        }
        else {
            Document.fetchDocument($scope.schema, $scope.identifier, function (document) {
//                console.log(document);
                useHeader(document.Document.Header);
                $scope.documentJSON = null;
                $scope.documentDirty = false;
                $scope.document = document.Document; // triggers the editor
                $scope.useHeaderInMenu(document.Document.Header); // reaches down to global.js
            });
        }

        $scope.setTree = function (tree) {
            return $scope.tree = tree;
        };

        $scope.validateTree = function () {
            validateTree($scope.tree);
            if (!$scope.documentDirty) {
                if (!$scope.documentJSON) {
                    $scope.documentJSON = JSON.stringify(treeToObject($scope.tree), null, 4);
                }
                else {
                    var json = JSON.stringify(treeToObject($scope.tree), null, 4);
                    if ($scope.documentDirty = (json != $scope.documentJSON)) {
                        updateTimeString();
                    }
                }
            }
        };

        $scope.saveDocument = function () {
            collectSummaryFields($scope.tree, $scope.header);
            $scope.header.TimeStamp = $scope.blankTimeStamp;
            $scope.header.SavedBy = $rootScope.user.Identifier;
            Document.saveDocument($scope.header, treeToObject($scope.tree), function (document) {
                useHeader(document.Header);
                $scope.documentJSON = null;
                $scope.documentDirty = false;
                $scope.choosePath('/document/' + $scope.header.SchemaName + '/edit/' + $scope.header.Identifier, document.Header);
            });
        };

    }
);

/**
 * The document panel array controller handles the set of panels and manages them
 * as a group.
 *
 * It expects a $scope.document variable from a surrounding controller
 */

OSCR.controller(
    'DocumentPanelArrayController',
    function ($rootScope, $scope, Document) {

        $scope.panels = [];
        $scope.selectedWhere = 0;

        $scope.$watch('i18n', function (i18n, oldValue) {
            if ($scope.tree && i18n) {
                i18nTree($scope.tree, i18n);
            }
        });

        $scope.revalidate = function () { // called by fields for live validation bubbling up
            _.each($scope.panels, function (panel) {
                panel.element.dirty = true;
            });
            $scope.validateTree();
        };

        $scope.$watch('document', function (document, oldValue) {
            // maybe use old value for something like making sure they're not making a mistake
            if (!document) return;
            var empty = _.isString(document);
            var schema = empty ? document : document.Header.SchemaName;
            if (!schema) return;
            Document.fetchSchema(schema, function (tree) {
                if (!tree) return;
                tree = $scope.setTree(tree); // todo media.js:96
                $scope.panels = [
                    { selected: 0, element: tree }
                ];
                if (!$scope.annotationMode) {
                    $scope.choose(0, 0);
                }
                if (!empty) {
                    populateTree(tree, document.Body);
                }
                installValidators(tree);
                validateTree(tree);
            });
        });

        $scope.choose = function (choice, panelIndex) {
            $scope.selected = choice;
            $scope.selectedWhere = panelIndex;
            var parentPanel = $scope.panels[panelIndex];
            parentPanel.selected = choice;
            var chosen = parentPanel.element.elements[choice];
            parentPanel.element.elements.forEach(function (el) {
                el.classIndex = panelIndex;
                if (el === chosen) {
                    el.classIndex++;
                }
            });
            var childPanel = $scope.panels[panelIndex + 1] = {
                selected: 0,
                element: chosen
            };
            if (chosen.elements) {
                chosen.elements.forEach(function (el) {
                    el.classIndex = panelIndex + 1;
                });
            }
            $scope.panels.splice(panelIndex + 2, 5);

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

        $scope.addSibling = function (list, index, panelIndex) {
            // should be some kind of deep copy
            var existing = list[index];
            var fresh = cloneTree(existing);
            validateTree(fresh);
//            existing.classIndex = panelIndex + 1; // what does this do?
            list.splice(index + 1, 0, fresh);
        };

        $scope.removeSibling = function (list, index, panelIndex) {
            var hasSibling = false;
            if(index > 0) {
                if (list[index-1].name == list[index].name) {
                     hasSibling = true;
                }
            }
            if(index < list.length-1){
                if (list[index+1].name == list[index].name) {
                    hasSibling = true;
                }
            }
            if(hasSibling) {
                // todo: are you sure?
                list.splice(index,1);
                if(index >= list.length){
                    index--;
                }
                $scope.choose(index, panelIndex);
            }
        };
    }
);

/**
 * There is a document panel controller for each panel in the display
 *
 * It puts "el" in scope, and holds which field is active.
 */

OSCR.controller(
    'DocumentPanelController',
    function ($scope, $timeout) {
        if (!$scope.panel) {
            return;
        }

        $scope.el = $scope.panel.element;

        $scope.enableEditor = function () {
            $scope.el.edit = true;
            $scope.setActive($scope.editActive);
        };

        $scope.disableEditor = function () {
            $scope.el.edit = false; //($scope.el.value === undefined);
        };

        $scope.disableEditor();

        $scope.setActive = function (field) {
            $scope.editActive = field;
            $scope.active = $scope.el.edit ? field : 'hidden';
        };

        $scope.navigationKeyPressed = function (key) {
            if ($scope.annotationMode) return; // is there maybe a better way?
            var elements = $scope.panels[$scope.selectedWhere].element.elements;
            if (!elements) return;
            var size = elements.length;
            switch (key) {
                case 'up':
                    $scope.disableEditor();
                    $scope.choose(($scope.selected + size - 1) % size, $scope.selectedWhere);
                    break;
                case 'down':
                    $scope.disableEditor();
                    $scope.choose(($scope.selected + 1) % size, $scope.selectedWhere);
                    break;
                case 'right':
                    if ($scope.panels[$scope.selectedWhere + 1].element.elements) {
                        $scope.choose(0, $scope.selectedWhere + 1);
                    }
                    else {
                        $scope.enableEditor();
                    }
                    break;
                case 'left':
                    if ($scope.selectedWhere > 0 && $scope.active == 'hidden') {
                        $scope.choose($scope.panels[$scope.selectedWhere - 1].selected, $scope.selectedWhere - 1);
                    }
                    break;
                case 'enter':
                    if (!$scope.el.elements) {
                        $scope.enableEditor();
                    }
                    break;
            }
        };
    }
);

OSCR.directive('focus',
    function ($timeout) {
        return {
            restrict: 'A',
            priority: 100,
            link: function (scope, element, attrs) {
                scope.$watch('active', function(active) {
                    if (attrs.id === active && (attrs.id == 'hidden' || scope.el.edit)) {
                        $timeout(function () {
                            element[0].focus();
                        });
                    }
                });
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

