'use strict';

var OSCR = angular.module('OSCR');

/* CRM OBJECT RELATED CONTROLLERS */

OSCR.controller(
    'ImageCollectionController',
    function ($rootScope, $scope) {
        $scope.annotationMode = true;
        $scope.schema = 'ImageMetadata';
        $scope.tree = null;

        $scope.document = $scope.schema; // just a name triggers schema fetch

        $scope.setTree = function (tree) {
            return $scope.tree = tree.elements[0]; // i happen to know that this is collection from Schemas.xml
        };

        $scope.validateTree = function () {
            validateTree($scope.tree);
        };

        $scope.showCommit = function (file) {
            if (!file || !file.tree || !$scope.tree) return false;
            var coll = file.tree.elements[1];
            coll.value = $scope.tree.value;
            if (file.description) {
                if (!!coll.value) {
                    file.collection = coll.value;
                    file.selectCollectionWarning = false;
                    return true;
                }
                else {
                    file.selectCollectionWarning = true;
                    return false;
                }
            }
            else {
                return false;
            }
        };

        $scope.showDestroy = function (file) {
            return !!file.description && !!file.$destroy;
        };
    }
);

String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

OSCR.controller(
    'DocumentEditController',
    function ($rootScope, $scope, $routeParams, $location, $timeout, Document) {

        $rootScope.checkLoggedIn();

        $scope.blankIdentifier = '#IDENTIFIER#';
        $scope.blankTimeStamp = '#TIMESTAMP#';
        $scope.headerDisplay = '';
        $scope.schema = $routeParams.schema;
        $scope.identifier = $routeParams.identifier;
        $scope.header = {};
        $scope.tree = null;

        function getTimeString(millis) {
            var ONE_SECOND = 1000, ONE_MINUTE = ONE_SECOND * 60, ONE_HOUR = ONE_MINUTE * 60, ONE_DAY = ONE_HOUR * 24;
            var days = Math.floor(millis / ONE_DAY);
            var hourMillis = Math.floor(millis - ONE_DAY * days);
            var hours = Math.floor(hourMillis / ONE_HOUR);
            var minuteMillis = Math.floor(millis - ONE_HOUR * hours);
            var minutes = Math.floor(minuteMillis / ONE_MINUTE);
            var secondMillis = Math.floor(minuteMillis - minutes * ONE_MINUTE);
            var seconds = Math.floor(secondMillis / ONE_SECOND);
            if (days > 0) {
                return "{0}d {1}h".format(days, hours);
            }
            else if (hours > 0) {
                return "{0}h {1}m".format(hours, minutes);
            }
            else if (minutes > 0) {
                if (minutes > 10) {
                    return "{0}m".format(minutes);
                }
                else {
                    return "{0}m {1}s".format(minutes, seconds);
                }
            }
            else {
                return "{0}s".format(seconds);
            }
        }

        function updateTimeString() {
            if (!$scope.header.TimeStamp) return;
            var timeStamp = $scope.header.TimeStamp;
            var now = new Date().getTime();
            var elapsed = now - timeStamp;
            var timeString = getTimeString(elapsed);
            if (timeString === $scope.timeString) return;
            $scope.timeString = timeString;
        }

        function tick() {
            if (!$scope.header.TimeStamp) return;
            $timeout(updateTimeString, 1000).then(tick);
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
        }
        else {
            Document.fetchDocument($scope.schema, $scope.identifier, function (document) {
//                console.log(document);
                useHeader(document.Document.Header);
                $scope.document = document.Document; // triggers the editor
            });
        }

        $scope.setTree = function (tree) {
            return $scope.tree = tree;
        };

        $scope.validateTree = function () {
            validateTree($scope.tree);
        };

        $scope.saveDocument = function () {
            if ($rootScope.translating()) return;
            collectSummaryFields($scope.tree, $scope.header);
            $scope.header.TimeStamp = $scope.blankTimeStamp;
            $scope.header.EMail = $rootScope.user.Profile.email;
            Document.saveDocument($scope.header, treeToObject($scope.tree), function (document) {
                $scope.documentJSON = JSON.stringify(document.Document);
                useHeader(document.Header);
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
                tree = $scope.setTree(tree);
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
            validateTree(fresh);
            existing.classIndex = parentIndex + 1; // what does this do?
            list.splice(index + 1, 0, fresh);
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
                case 'enter':
                    if ($scope.el.config.paragraph && $scope.el.edit) break;
                    $scope.choose(($scope.selected + 1) % size, $scope.selectedWhere);
                    break;
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

