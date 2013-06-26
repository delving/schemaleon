'use strict';

var module = angular.module('cultureCollectorApp');

module.controller('MainCtrl', ['$scope', function ($scope) {

    var doc = {
        identifier: 'DOC123',
        name: 'Document',
        elements: [
            {
                name: 'Basics',
                elements: [
                    { name: 'Type' },
                    { name: 'Condition' }
                ]
            },
            {
                name: 'Object',
                elements: [
                    { name: 'Link' },
                    { name: 'MimeType' }
                ]
            },
            {
                name: 'Source',
                elements: [
                    { name: 'URI' },
                    { name: 'Type' },
                    { name: 'Note' }
                ]
            },
            {
                name: 'Creation',
                elements: [
                    { name: 'Date' },
                    { name: 'Type' },
                    {
                        name: 'Creator',
                        doc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
                        elements: [
                            {
                                name: 'URI',
                                value: 'this was fetched'
                            },
                            {
                                name: 'Literal',
                                value: 'this accompanied the result'
                            },
                            {
                                name: 'Third',
                                value: 'this is a third field'
                            }
                        ],
                        fetch: {
                            fetchURL: 'http://fetch.eu',
                            uriLabel: 'Fetched URI',
                            uriField: 'URI',
                            literalLabel: 'Literal Value',
                            literalField: 'Literal'
                        }
                    }
                ]
            },
            {
                name: 'OtherEvent',
                multiple: true,
                elements: [
                    { name: 'Link' },
                    { name: 'MimeType' }
                ]
            }
        ]
    };

    $scope.choose = function (element, here) {
        $scope.panels[here].element.elements.forEach(function (el) {
            el.selected = (el == element);
            el.classIndex = here;
            if (el.selected) el.classIndex++;
        })
        $scope.panels[here + 1] = {
            'element': element
        };
        $scope.panels.splice(here + 2, 5);
    };

    $scope.panels = [];

    $scope.panels[0] = {
        'element': doc
    };

    $scope.addSibling = function (list, index) {
        // should be some kind of deep copy
        var existing = list[index];
        var fresh = { name: existing.name };
        list.splice(index, 0, fresh)
    }
}]);

module.controller('FetchCtrl', ['$scope', function ($scope) {
    $scope.kickstart = function(fetch, elements) {
        if (!fetch) return; // todo: note that this function gets called all the time

        var findElement = function(soughtName) {
            for (var walk=0; walk<elements.length; walk++) {
                if (elements[walk].name == soughtName) return elements[walk];
            }
            return {name:'unknown'}
        };
        $scope.fetch = fetch;
        $scope.uri = findElement($scope.fetch.uriField);
        $scope.literal = findElement($scope.fetch.literalField);
        $scope.groupFields.push($scope.fetch.uriField);
        $scope.groupFields.push($scope.fetch.literalField);
    }
}]);

module.controller('PanelCtl', ['$scope', function ($scope) {
    $scope.groupFields = [];
}]);