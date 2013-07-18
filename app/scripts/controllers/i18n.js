'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.filter('elementTitle',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element) return '';
                if (!element.title) {
                    if (I18N.isReady()) {
                        var title = I18N.title(element.name);
                        if (title) {
                            element.title = title;
                            return title;
                        }
                    }
                    return element.name;
                }
                return element.title;
            }
        }]
);

CultureCollectorApp.controller('I18NController',
    ['$rootScope', '$scope', '$dialog', '$window', 'I18N',
        function ($rootScope, $scope, $dialog, $window, I18N) {

//            var lang = ($window.navigator.userLanguage || $window.navigator.language).substring(0,2);
            var lang = $rootScope.config.interfaceLanguage;

            I18N.fetchList(lang);

            $scope.$watch('config.interfaceLanguage', function(newValue, oldValue){
                console.log('asdfasdf');
               I18N.fetchList(newValue);
            });

            $scope.openTitleDialog = function (element) {
                var dialog = $dialog.dialog({
                    controller: 'TitleDialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop:true,
                    keyboard: true,
                    resolve: { element: function() { return element; } },
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
                        I18N.setTitle(lang, element.name, title);
                    }
                });
            };

            $scope.openDocDialog = function (element) {
                var dialog = $dialog.dialog({
                    controller: 'DocDialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop:true,
                    keyboard: true,
                    resolve: { element: function() { return element; } },
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
                        I18N.setDoc(lang, element.name, doc);
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
