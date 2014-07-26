/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Schemaleon = angular.module('Schemaleon');

/**
 * Handle language editing
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'LangEditController',
    function ($rootScope, $scope, $routeParams, I18N, $timeout) {

        $scope.langCode = $routeParams.lang;

        function setLanguage(lang) {
            $timeout(function(){

            $scope.labels = _.map(_.pairs(lang.label), function(pair) {
                $scope.allKeysI18N[pair[0]] = false;
                return {
                    Key: pair[0],
                    Value: pair[1],
                    StoredValue: pair[1]
                };
            });
            var unassigned = _.filter(_.pairs($scope.allKeysI18N), function (pair) {
                return pair[1];
            });


                $scope.unassigned = _.map(unassigned, function(pair) {
                    return {
                        Key: pair[0],
                        Value: '',
                        StoredValue: ''
                    };
                });
                $scope.elements = _.map(_.pairs(lang.element), function(pair) {
                    var key = pair[0];
                    var title = pair[1].title;
                    var doc = pair[1].doc;
                    return {
                        Key: key,
                        Title: title,
                        StoredTitle: title,
                        Doc: doc,
                        StoredDoc: doc
                    };
                });

            if ($scope.langCode == $rootScope.lang) {
                $rootScope.i18n = lang;
            }
            console.log($scope.unassigned);

            });
        }

        // reload the page with new language if user changes interface language
//        $scope.$watch('lang', function(newLang, oldLang){
//            if(newLang != oldLang){
//                $rootScope.choosePath('lang/'+$rootScope.lang);
//            }
//        });

        !function () {
            I18N.getList($scope.langCode, function(lang) {
                setLanguage(lang);
            });
        }();

        I18N.getList($scope.langCode, function(lang) {
            setLanguage(lang);
        });

        $scope.setLabel = function(label) {
            I18N.setLabelAsync($scope.langCode, label.Key, label.Value, function(lang) {
                setLanguage(lang);
            });
        };

        $scope.setTitle = function(element) {
            I18N.setTitleAsync($scope.langCode, element.Key, element.Title, function(lang) {
                setLanguage(lang);
            });
        };

        $scope.setDoc = function(element) {
            I18N.setDocAsync($scope.langCode, element.Key, element.Doc, function(lang) {
                setLanguage(lang);
            });
        };

        $scope.setAllLabels = function(formId) {
            var theForm = angular.element('#'+formId);
            var inputs = theForm.find('input');
            var count = 0;
            angular.forEach(inputs, function(input, $q){
                if(input.value){
                    I18N.setLabelAsync($scope.langCode, input.name, input.value, function(lang) {
                        setLanguage(lang);
                    });
                }
            });
        }
    }
);
