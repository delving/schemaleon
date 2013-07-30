'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.directive('i18n', function () {
        return {
            restrict: 'A',
            replace: false,
            transclude: true,
            scope: true,
            link: function ($scope, $element, $attrs) {
                $scope.$watch('i18n', function (i18n, before) {
                    function setText(text) {
                        var find = $element.find('.i18n');
                        if (find.length) {
                            find.text(text);
                        }
                        else {
                            $element.append(text);
                        }
                    }

                    if (i18n) {
                        var msg = i18n.label[$attrs.i18n];
                        if (msg && msg != '?') {
                            console.log('replacing: ' + $attrs.i18n); // todo
                            console.log(msg);// todo
                            setText(msg);
                            return;
                        }
                    }
                    setText($attrs.i18n);
                });
                $scope.key = $attrs.i18n;
                $attrs.$observe('i18n', function (newValue) {
                    $scope.key = newValue;
                });
                $element.on('click', function (e) {
                    e.preventDefault();
                    e.unbind('click');
                });

            },
            template: '<span ng-transclude></span> ' +
                '<span class="badge badge-warning pointer" ng-show="config.showTranslationEditor" ng-click="openLabelDialog(key)">' +
                '<i class="icon-translate icon-white"></i>' +
                '</span>'
        }
    }
);

CultureCollectorApp.filter('linkTitle',
    [ 'I18N',
        function (I18N) {
            return function (link) {
                if (!link) return '';
                if (I18N.isReady()) {
                    var title = I18N.label(link.name);
                    if (title) return title;
                }
                return link.name;
            };
        }]
);

CultureCollectorApp.filter('elementTitle',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element) return '';
                if (element.title) {
                    if (element.title != '?') return element.title;
                }
                else if (I18N.isReady()) {
                    var title = I18N.title(element.name);
                    if (title) {
                        element.title = title;
                        return title;
                    }
                }
                return element.name;
            };
        }]
);

CultureCollectorApp.filter('elementDoc',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element) return '';
                if (element.doc) {
                    if (element.doc != '?') return element.doc;
                }
                else if (I18N.isReady()) {
                    var doc = I18N.doc(element.name);
                    if (doc) {
                        element.doc = doc;
                        return doc;
                    }
                }
                return element.name;
            };
        }]
);

CultureCollectorApp.controller('I18NController',
    ['$rootScope', '$scope', '$dialog', '$window', 'I18N',
        function ($rootScope, $scope, $dialog, $window, I18N) {

//            var lang = ($window.navigator.userLanguage || $window.navigator.language).substring(0,2);

            $scope.$watch('config.interfaceLanguage', function (newValue, oldValue) {
                I18N.fetchList(newValue);
            });

            $scope.openLabelDialog = function (keyHolder) {
//                console.log('openLabelDialog'); // todo
//                console.log(keyHolder);// todo
                var dialog = $dialog.dialog({
                    controller: 'LabelDialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: {
                        key: function () {
                            return _.isString(keyHolder) ? keyHolder : keyHolder.name;
                        }
                    },
                    template: '<div class="modal-header"><h3>Label</h3></div>' +
                        '<div class="modal-body">' +
                        'Translate &quot;<span>{{ key }}</span>&quot; into language &quot;{{ lang }}&quot;<br/>' +
                        '<input autofocus class="input-block-level" ng-model="label"/>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(label)" class="btn btn-primary">Ok</button>' +
                        '</div>'

                });
                dialog.open().then(function (labelEntry) {
                    if (labelEntry && labelEntry.label) {
                        I18N.setLabel(labelEntry.key, labelEntry.label);
                    }
                });
            };

            $scope.openTitleDialog = function (element) {
                var dialog = $dialog.dialog({
                    controller: 'TitleDialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: { element: function () {
                        return element;
                    } },
                    template: '<div class="modal-header"><h3>Title</h3></div>' +
                        '<div class="modal-body">' +
                        'Translate &quot;<span>{{ element.name }}</span>&quot; into language &quot;{{ lang }}&quot;<br/>' +
                        '<input autofocus class="input-block-level" ng-model="title"/>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(title)" class="btn btn-primary">Ok</button>' +
                        '</div>'

                });
                dialog.open().then(function (title) {
                    if (title) {
                        element.title = title;
                        I18N.setTitle(element.name, title);
                    }
                });
            };

            $scope.openDocDialog = function (element) {
                var dialog = $dialog.dialog({
                    controller: 'DocDialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: { element: function () {
                        return element;
                    } },
                    template: '<div class="modal-header"><h3>Explanation</h3></div>' +
                        '<div class="modal-body">' +
                        'Explain &quot;<span>{{ element.name }}</span>&quot; into language &quot;{{ lang }}&quot;<br/>' +
                        '<textarea autofocus rows="8" ng-model="doc" class="input-block-level"></textarea>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(doc)" class="btn btn-primary">Ok</button>' +
                        '</div>' +
                        '</div>'

                });
                dialog.open().then(function (doc) {
                    if (doc) {
                        element.doc = doc;
                        I18N.setDoc(element.name, doc);
                    }
                });
            };

        }]
);

function LabelDialogController($scope, I18N, dialog, key) {
    $scope.key = key;
    if (I18N.isReady()) {
        $scope.label = I18N.label(key);
    }
//    console.log("Key=" + key); // todo
    $scope.close = function (label) {
        dialog.close({ label: label, key: $scope.key });
    };
}

function TitleDialogController($scope, dialog, element) {
    $scope.element = element;
    $scope.title = element.title;
    $scope.close = function (result) {
        dialog.close(result);
    };
}

function DocDialogController($scope, dialog, element) {
    $scope.element = element;
    $scope.doc = element.doc;
    $scope.close = function (result) {
        dialog.close(result);
    };
}

