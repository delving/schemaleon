'use strict';

var module = angular.module('cultureCollectorApp');

var doc = {
    identifier: 'DOC123',
    name: 'Document',
    elements: [
        {
            name: 'Basics',
            elements: [
                {
                    name: 'Type',
                    controlled: [
                        'Landscapes',
                        'Portraits',
                        'Nudes'
                    ]
                },
                {
                    name: 'Condition',
                    controlled: [
                        'Shitty',
                        'Reasonable',
                        'Superduper'
                    ]
                }
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
                {
                    name: 'Date',
                    value: 'August 30, 2010'
                },
                {
                    name: 'Type',
                    controlled: [
                        'First',
                        'Second',
                        'Third'
                    ]
                },
                {
                    name: 'Creator',
                    doc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
                    fetch: {
                        source: 'http://fetch.eu',
                        elements: [
                            {
                                label: 'Fetched URI',
                                name: 'URI',
                                value: 'this was fetched'
                            },
                            {
                                label: 'Literal value',
                                name: 'Literal',
                                value: 'this accompanied the result'
                            }
                        ]
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

module.service("Docs", function() {
    this.query = function() {
        return doc;
    };
});

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