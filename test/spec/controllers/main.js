'use strict';

describe('Controller: ObjectEditController', function () {

    var mockDoc = {
        name: 'Fake',
        elements: [
            {
                name: 'Bazik',
                elements: [
                    {
                        name: 'Toipe',
                        localVocabulary: {
                            options: [
                                'Landscapes',
                                'Portraits',
                                'Nudes'
                            ]
                        }
                    },
                    {
                        name: "Gumby"
                    }
                ]
            }
        ]
    };

    var mockService = {
        query: function () {
            return mockDoc;
        }
    };

    // load the controller's module
    beforeEach(module('CultureCollectorApp'));

    var MainCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        MainCtrl = $controller('MainCtrl', {
            $scope: scope,
            Docs: mockService
        });
    }));

    it('should have panels in the scope', function () {
        expect(scope.panels.length).toBe(1);
        expect(scope.panels[0].element.name).toBe('Fake');
        scope.choose(0, 0);
        expect(scope.panels.length).toBe(2);
        expect(scope.panels[1].element.name).toBe('Bazik');
        scope.choose(1, 1);
        expect(scope.panels.length).toBe(3);
        expect(scope.panels[2].element.name).toBe('Gumby');
    });

});
