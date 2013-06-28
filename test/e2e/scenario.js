'use strict';

describe('End2End Testing', function () {


//    it('should have panels in the scope', function () {
//        browser().navigateTo('/');
//        expect(scope.panels.length).toBe(1);
//        expect(scope.panels[0].element.name).toBe('Gumby')
//    });

    it("should show a panel with 5 elements", function () {
        browser().navigateTo('/#/');
        var links = element('a').count();
        expect(links).toBe(5);
    });

    it("should show a second panel when an element is clicked", function () {
        var firstLink = element('a:first');
        firstLink.click();
//        expect.
        pause();
    });

//    it("should add another panel", function () {
//        element(':a.level1').click();
//        expect(scope.panels.length).toBe(1000);
//    });


});
