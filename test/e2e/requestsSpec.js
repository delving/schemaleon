describe("E2E: Testing Requests", function() {

    it('should go to the login page', function () {
        browser().navigateTo('/#/login');
        expect(browser().location().url()).toBe('/login');
        expect(element('div[ng-view]').html()).toContain('login');
    });

    it('should log in a pseudo user', function () {
        var btn = element('button#login');
        btn.click();
        expect(browser().location().url()).toBe('/dashboard');
//        expect(element('div[ng-view]').html()).toContain('dashboard');
    });

});