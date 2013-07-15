'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

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
