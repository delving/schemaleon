'use strict';

describe('End2End Testing', function () {

    it("should show a panel with 5 elements", function () {
        browser().navigateTo('/#/');
        var panels = repeater('td.panel').count();
        expect(panels).toBe(1);
        var links = element('a').count();
        expect(links).toBe(5);
    });

    it("should show a second panel when an element is clicked", function () {
        var firstLink = element('a:first');
        firstLink.click();
        var panels = repeater('td.panel').count();
        expect(panels).toBe(2);
//        pause();
    });

    it("should add a new element to the current list of elements", function() {
       var addSibling = element('span.plus');
        addSibling.click();
        pause();
    });



//    it("should add another panel", function () {
//        element(':a.level1').click();
//        expect(scope.panels.length).toBe(1000);
//    });


});
