/*
'use strict';

describe('End2End Testing', function () {


    describe('When loggin in', function () {

        it('it should go to the login page', function () {
            browser().navigateTo('/#/login');
            expect(browser().location().url()).toBe('/login');
        });

        it('should log in a pseudo user', function () {
            var btn = element('button#login');
            btn.click();
            expect(browser().location().url()).toBe('/dashboard');
        });

    });


    describe('When going to the Documents section', function () {

        it("should open on the document list page", function () {
            browser().navigateTo('/#/document');
            expect(browser().location().url()).toBe('/document');
        });

        describe('When clicking on the New Document button', function() {
            it('should go to and empty document page', function(){
                element('a[ng-click="newDocument()"').click();
                expect($scope.showingList).toBe(true);
            })
        })

        it("should show one panel", function () {
            browser().navigateTo('/#/object');
            var panels = repeater('td.panel').count();
            expect(panels).toBe(1);
        });

    });

    describe('When clicking on an element in the first panel', function () {

        it("should show a second panel with elements", function () {
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
    });

    describe('When entering a value in a vocabulary typeahead', function () {
        it("should trigger a vocabulary lookup", function() {
            element('.link-Creator').click();
            input('chosenState').enter('a');
            sleep(1);
            var vocabItems = element('td.level2 ul.typeahead li').count();
            expect(vocabItems).toBe(2);
        });

        it('should enter the value of a typeahead value when clicked', function () {
           element('td.level2 ul.typeahead li:first a:first').click();
            element('span#vocabulary-input-yes').click();
        });

        it('should be Bob Marley', function () {
            var theValue = element('div.vocabulary-input a:first').val();
            expect(theValue).toBe('Bob Marley');
            pause();
        });

    });

});
*/
