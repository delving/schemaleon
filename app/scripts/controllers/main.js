'use strict';

var module = angular.module('CultureCollectorApp');

module.controller('MainCtrl', ['$scope', 'Docs', function ($scope, Docs) {

    $scope.panels = [];

    $scope.panels[0] = {
        'element': Docs.query()
    };

    $scope.choose = function (element, here) {
        $scope.panels[here].element.elements.forEach(function (el) {
            el.selected = (el == element);
            el.classIndex = here;
            if (el.selected) el.classIndex++;
        });
        $scope.panels[here + 1] = {
            'element': element
        };
        if (element.elements) {
            element.elements.forEach(function (el) {
                el.selected = false;
                el.classIndex = here + 1;
            });
        }
        $scope.panels.splice(here + 2, 5);
    };

    $scope.addSibling = function (list, index) {
        // should be some kind of deep copy
        var existing = list[index];
        var fresh = { name: existing.name };
        list.splice(index, 0, fresh)
    }
}]);

module.controller('FetchCtrl', ['$scope', function ($scope) {
    $scope.kickstart = function (fetch, elements) {
        if (!fetch) return; // todo: note that this function gets called all the time
        $scope.fetch = fetch;
        $scope.uri = fetch.elements[0];
        $scope.literal = fetch.elements[1];
    }
}]);

module.controller('PanelCtl', ['$scope', function ($scope) {
    $scope.groupFields = [];
}]);