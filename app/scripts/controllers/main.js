'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

/* CRM LIST RELATED CONTROLLERS */



CultureCollectorApp.controller('NavigationController', ['$scope', '$location', function ($scope, $location) {
    $scope.mainMenu = {
        section: "Main",
        links: [
            {label: "Dashboard", path: "#/dashboard", active: false},
            {label: "Registered Objects", path: "#/list", active: false},
            {label: "Object", path: "#/object", active: false}
        ]
    };
//    $scope.choose = function (index) {
//        $scope.mainMenu.links.forEach(function (link) {
//            link.active = false;
//        });
//        $scope.mainMenu.links[index].active = true;
//
//    };
}]);

CultureCollectorApp.controller('ObjectListController', ['$scope', 'ObjectList', function ($scope, ObjectList) {

    $scope.mainMenu.links[1].active = true;

    ObjectList.fetchList(function (data) {
        $scope.objects = data;
    });
}]);

/* CRM OBJECT RELATED CONTROLLERS */

CultureCollectorApp.controller('ObjectEditController', ['$scope', 'Documents', 'XMLTree', function ($scope, Documents, XMLTree) {

    $scope.mainMenu.links[2].active = true;

    $scope.panels = [];

    Documents.fetchDocument('ID939393', function (doc) {
        var tree = XMLTree.xmlToTree(doc);
        $scope.panels[0] = {
            'element': tree
        };
    });

    $scope.choose = function (index, parentIndex) {
        var element = $scope.panels[parentIndex].element.elements[index];
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
        list.splice(index + 1, 0, fresh);
    }
}]);

CultureCollectorApp.controller('PanelController', ['$scope', function ($scope) {

    if (!$scope.panel) return;
    $scope.el = $scope.panel.element;
    $scope.el.editorEnabled = ($scope.el.value == undefined);

    // Panel Element Editor Toggles
    $scope.enableEditor = function (element) {
        $scope.el.editorEnabled = true;
    };

    $scope.disableEditor = function (element) {
        $scope.el.editorEnabled = false;
    }

}]);

CultureCollectorApp.controller('VocabularyController', ['$scope', '$q', 'Vocabulary', function ($scope, $q, Vocabulary) {
    var voc = $scope.el.vocabulary;
    if (!voc) return;
    $scope.voc = voc;
    $scope.getStates = function (value) {
        var deferred = $q.defer();
        Vocabulary.getStates($scope.voc.name, value, function (states) {
            deferred.resolve(states);
        });
        return deferred.promise;
    };
    $scope.$watch('chosenState', function (after, before) {
        if (_.isObject(after)) {
            $scope.el.value = after;
        }
    })
}]);


CultureCollectorApp.controller('TextInputController', ['$scope', 'Validator', function ($scope, Validator) {
    var ti = $scope.el.textInput;
    if (!ti) return;
    $scope.el.value = '';
    if (ti.validator) {
        console.log("validator "+ti.validator);
        var func = Validator.getFunction(ti.validator);
        if (func) {
            $scope.validator = function () {
                return func($scope.el.value);
            }
        }
        $scope.invalidMessage = 'Nothing yet';
        $scope.$watch('el.value', function (after, before) {
            $scope.invalidMessage = $scope.validator();
        })
    }
}]);





