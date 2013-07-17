'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.filter('elementTitle',
    [ 'I18N',
        function (I18N) {
            return function (element) {
                if (!element.translation) {
                    if (I18N.isReady()) {
                        var translation = I18N.translate(element.name);
                        if (translation) {
                            element.translation = translation;
                            return translation;
                        }
                    }
                    return element.name;
                }
                return element.translation;
            }
        }]
);

CultureCollectorApp.controller('I18NController',
    ['$scope', '$dialog', '$window', 'I18N',
        function ($scope, $dialog, $window, I18N) {

            var lang = ($window.navigator.userLanguage || $window.navigator.language).substring(0,2);

            I18N.fetchList(lang);

            $scope.openDialog = function (element) {
                var dialog = $dialog.dialog({
                    controller: 'DialogController',
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop:true,
                    keyboard: true,
                    template: '<div class="modal-header"><h3>Translate</h3></div>' +
                        '<div class="modal-body">' +
                        'Translate &quot;<span>'+element.name+'</span>' +
                        '&quot; to <input autofocus size="30" ng-model="translation"/>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(translation)" class="btn btn-primary">Ok</button>' +
                        '</div>'

                });
                dialog.open().then(function (translation) {
                    if (translation) {
                        element.translation = translation;
                        I18N.setTranslation(lang, element.name, translation);
                    }
                });
            };

        }]
);


// the dialog is injected in the specified controller
function DialogController($scope, dialog) {
    $scope.close = function (result) {
        dialog.close(result);
    };
}
