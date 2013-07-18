CultureCollectorApp.controller('ConfigurationController',
    ['$rootScope',
        function($rootScope) {

            $rootScope.config = {
                interfaceLanguages: [
                    {name:'English', code: 'en'},
                    {name:'Nederlands', code: 'nl'}
                ],
                interfaceLanguage: 'en',
                showInlinePreview: true,
                showTranslationEditor: false
            }

            $rootScope.toggleInlinePreview = function () {
                $rootScope.config.showInlinePreview = ($rootScope.config.showInlinePreview != false) ? false : true;
            }

            $rootScope.toggleTranslationEditor = function () {
                $rootScope.config.showTranslationEditor = ($rootScope.config.showTranslationEditor != false) ? false : true;
            }
//
//            $rootScope.setLanguage = function () {
////                $rootScope.config.interfaceLanguage = lang;
//                I18N.fetchList($rootScope.config.interfaceLanguage);
//            }

        }]);