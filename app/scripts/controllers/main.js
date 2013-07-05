'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

/* CRM LIST RELATED CONTROLLERS */

CultureCollectorApp.controller('ObjectListController', ['$scope', 'ObjectList', function ($scope, ObjectList) {

    $scope.objects = ObjectList.query();

}]);

/* CRM OBJECT RELATED CONTROLLERS */

CultureCollectorApp.controller('ObjectEditController', ['$scope', 'Docs', function ($scope, Docs) {

    $scope.panels = [];

    Docs.fetchDocument('ID939393', function (doc) {
        $scope.panels[0] = {
            'element': doc
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
}]);

CultureCollectorApp.controller('RemoteVocabularyController', ['$scope', '$q', 'Vocabulary', function ($scope, $q, Vocabulary) {
    var rv = $scope.panel.element.remoteVocabulary;
    if (!rv) return;
    $scope.value = $scope.panel.element.value;
    $scope.vocab = rv.vocabularyName;
    $scope.rv = rv;
    $scope.field = rv.elements[0];
    $scope.getStates = function (value) {
//        console.log('getStates: '+value);
        var deferred = $q.defer();
        Vocabulary.getStates($scope.vocab, value, function (states) {
            deferred.resolve(states);
        });
        return deferred.promise;
    };
    $scope.$watch('chosenState', function(after, before) {
        if (_.isObject(after)) {
            $scope.panel.element.value = after;
            $scope.value = after;
        }
    })
}]);

CultureCollectorApp.controller('LocalVocabularyController', ['$scope', function ($scope) {
    var lv = $scope.panel.element.localVocabulary;
    if (!lv) return;
    $scope.lv = lv;
    $scope.options = lv.options;
}]);

CultureCollectorApp.controller('NavigationController', ['$scope', '$location', function ($scope, $location) {
    $scope.mainMenu = {
        section: "Main",
        links: [
            {label: "Dashboard", path: "/", active: true},
            {label: "Registered Objects", path: "#/list", active: false},
            {label: "Object", path: "#/object", active: false}
        ]
    };
    $scope.choose = function (index) {
        $scope.mainMenu.links.forEach(function (link) {
            link.active = false;
        });
        $scope.mainMenu.links[index].active = true;

    };
}]);






