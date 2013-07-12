'use strict';

describe('End2End Testing', function () {

    describe('loading the objects page', function () {

//        afterEach(function(){
//            pause();
//        });

        it("should open on the dashboard page", function () {
            browser().navigateTo('/#/');
        });

        it("should show one panel", function () {
            browser().navigateTo('/#/object');
            var panels = repeater('td.panel').count();
            expect(panels).toBe(1);
        });

        it("should show a second panel with elements when clicking an element in the first panel", function () {
            element('a:last').click();
            var panels = repeater('td.panel').count();
            expect(panels).toBe(2);
        });

        it("should create another sibling element when clicking the plus icon", function() {
            expect(repeater('td.level1 ul li').count()).toBe(6);
            var addSibling = element('span.plus.display-true:first');
            addSibling.click();
            expect(repeater('td.level1 ul li').count()).toBe(7);
        });

        it("should enter a single letter value in the text input and trigger a vocabulary lookup", function() {
            element('.link-Creator').click();
            input('chosenState').enter('a');
            sleep(1);
            var vocabItems = element('td.level2 ul.typeahead li').count();
            expect(vocabItems).toBe(2);
        });

    });

});
