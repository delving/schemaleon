'use strict';

describe('End2End Testing', function () {



    describe('loading the objects page', function () {

//        beforeEach(function(){
//        });
//
//        afterEach(function(){
//        });

//        it("should open on the dashboard page", function () {
//            browser().navigateTo('/#/');
//        });

        it("should show a panel with 5 elements", function () {
            browser().navigateTo('/#/');
            var panels = repeater('td.panel').count();
            expect(panels).toBe(1);
            var links = element('a').count();
            expect(links).toBe(5);
        });

        it("clicking a list element should show a second panel with elements", function () {
            var firstLink = element('a:first');
            firstLink.click();
            var panels = repeater('td.panel').count();
            expect(panels).toBe(2);
        });

        it("clicking the plus icon should create another sibling element", function() {
            var addSibling = element('span.plus.display-true:first');
            addSibling.click();
            expect(repeater('td.level0 ul li').count()).toBe(6);
        });

    });

});
