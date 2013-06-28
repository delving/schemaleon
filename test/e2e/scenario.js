'use strict';

describe('End2End Testing', function () {


//    it('should have panels in the scope', function () {
//        browser().navigateTo('/');
//        expect(scope.panels.length).toBe(1);
//        expect(scope.panels[0].element.name).toBe('Gumby')
//    });

    it("should alert message", function () {
        browser().navigateTo('/#/');
        var btn = element(":button.btn");
        btn.click();


//        pause();
//        var firstA = element("a.level");
//        pause();
//        expect(JSON.stringify(firstA)).toBe('<a href="" class="level" ng-click="choose(member, $parent.$index)">Basics</a>');
    });

//    it("should add another panel", function () {
//        element(':a.level1').click();
//        expect(scope.panels.length).toBe(1000);
//    });


});
