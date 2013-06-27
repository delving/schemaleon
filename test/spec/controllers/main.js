'use strict';

describe('Controller: MainCtrl', function () {

    // load the controller's module
    beforeEach(module('CultureCollectorApp'));

    var MainCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, Docs) {
        scope = $rootScope.$new();
        MainCtrl = $controller('MainCtrl', {
            $scope: scope,
            Docs: Docs
        });
    }));

    it('should have panels in the scope', function () {
        expect(scope.panels.length).toBe(1);
        expect(scope.panels[0].element.name).toBe('Document')
    });

    it("should add another panel", function () {
        element(':a.level0').click();
        expect(scope.panels.length).toBe(2);
    });

    it("should add another panel", function () {
        element(':a.level1').click();
        expect(scope.panels.length).toBe(3);
    });


});
