'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.directive('i18n', function () {
        return function (scope, elem, attrs) {
            console.log('Why does the i18n direcive get called twice to create watch?:' + attrs.i18n);
            scope.$watch('i18n', function (i18n, before) {
                if (!i18n) return;
                var replacement = i18n.label[attrs.i18n];
                if (replacement) {
                    elem.text(replacement);
                }
            });
        };
    }
);

CultureCollectorApp.filter('elementTitle',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element) return '';
                if (element.title) return element.title;
                if (I18N.isReady()) {
                    var title = I18N.title(element.name);
                    if (title) {
                        element.title = title;
                        return title;
                    }
                }
                return element.name;
            }
        }]
);

CultureCollectorApp.filter('elementDoc',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element) return '';
                if (element.doc) return element.doc;
                if (I18N.isReady()) {
                    var doc = I18N.doc(element.name);
                    if (doc) {
                        element.doc = doc;
                        return doc;
                    }
                }
                return element.name;
            }
        }]
);

CultureCollectorApp.controller('I18NController',
    ['$rootScope', '$scope', '$dialog', '$window', 'I18N',
        function ($rootScope, $scope, $dialog, $window, I18N) {

//            var lang = ($window.navigator.userLanguage || $window.navigator.language).substring(0,2);

            $scope.$watch('config.interfaceLanguage', function (newValue, oldValue) {
                I18N.fetchList(newValue);
            });

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
                        'Translate &quot;<span>{{ element.name }}</span>&quot;<br/>' +
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
                        'Explain &quot;<span>{{ element.name }}</span>&quot;<br/>' +
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
