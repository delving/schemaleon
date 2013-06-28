'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('ObjectEditController', ['$scope', 'Docs', function ($scope, Docs) {

    $scope.panels = [];

    $scope.panels[0] = {
        'element': Docs.query()
    };

    $scope.choose = function (index, parentIndex) {
        var element = $scope.panels[parentIndex].element.elements[index];
        $scope.panels[parentIndex].element.elements.forEach(function (el) {
            el.classIndex = parentIndex;
            if (el == element) el.classIndex++;
        });
        $scope.panels[parentIndex + 1] = {
            'element': element
        };
        console.log(JSON.stringify(element) + ' added to ' + (parentIndex + 1));
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
        list.splice(index + 1, 0, fresh);
    }
}]);

CultureCollectorApp.controller('PanelController', ['$scope', function ($scope) {
    if (!$scope.panel) return;
    $scope.el = $scope.panel.element;
}]);

CultureCollectorApp.controller('RemoteVocabularyController', ['$scope', function ($scope) {
    var rv = $scope.panel.element.remoteVocabulary;
    if (!rv) return;
    $scope.rv = rv;
    $scope.uri = rv.elements[0];
    $scope.literal = rv.elements[1];
}]);

CultureCollectorApp.controller('LocalVocabularyController', ['$scope', function ($scope) {
    var lv = $scope.panel.element.localVocabulary;
    if (!lv) return;
    $scope.lv = lv;
    $scope.options = lv.options;
}]);

CultureCollectorApp.controller('NavigationController', ['$scope', function ($scope) {
    $scope.mainMenu =
    {
        section: "Main",
        links: [
            {label: "Dashboard", path: "#/dashboard.html", active: true},
            {label: "Registered Objects", path: "#/list.html", active: false},
            {label: "Object", path: "#/object.html", active: false}
        ]
    };



    $scope.choose = function (index) {
        $scope.mainMenu.links.forEach(function (link) {
            link.active = false;
        });
        $scope.mainMenu.links[index].active = true;

    }
}]);
