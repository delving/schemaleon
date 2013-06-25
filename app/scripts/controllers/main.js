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
                        elements: [
                            { name: 'URI' },
                            { name: 'PreferredLabel' }
                        ],
                        fetch: {
                            url: 'http://fetch.eu'
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
    $scope.uri = 'you are eye';
    $scope.preferredLabel = 'preferred label';
}]);