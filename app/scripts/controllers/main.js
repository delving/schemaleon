'use strict';

var module = angular.module('CultureCollectorApp');

module.controller('MainCtrl', ['$scope', 'Docs', function ($scope, Docs) {

    $scope.panels = [];

    $scope.panels[0] = {
        'element': Docs.query()
    };

    $scope.choose = function (element, parentIndex) {
        $scope.panels[parentIndex].element.elements.forEach(function (el) {
            el.classIndex = parentIndex;
            if (el == element) el.classIndex++;
        });
        $scope.panels[parentIndex + 1] = {
            'element': element
        };
        if (element.elements) {
            element.elements.forEach(function (el) {
                el.classIndex = parentIndex + 1;
            });
        }
        $scope.panels.splice(parentIndex + 2, 5);
    };

    $scope.addSibling = function (list, index, parentIndex) {
        // should be some kind of deep copy
        var existing = list[index];
        var fresh = JSON.parse(JSON.stringify(existing));
        fresh.value = '';
        existing.multiple = false;
        existing.classIndex = parentIndex + 1;
        list.splice(index + 1, 0, fresh)
    }
}]);

module.controller('RemoteVocabularyController', ['$scope', function ($scope) {
}]);

module.controller('PanelCtl', ['$scope', function ($scope) {
}]);