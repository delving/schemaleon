/* ==========================================================
 * OSCR v.1.0
 * https://github.com/delving/oscr/app/scripts/global.js
 *
 * ==========================================================
 * Copyright 2013 Delving B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

var OSCR = angular.module('OSCR');

OSCR.controller(
    'LangEditController',
    function ($rootScope, $scope, $routeParams, I18N) {
        $scope.langCode = $routeParams.lang;

        I18N.getList($scope.langCode, function(lang) {
            $scope.language =  lang;
            $scope.labels = [];
            _.each(_.pairs(lang.label), function(pair) {
                console.log(JSON.stringify(pair,null, 4));
                $scope.labels.push({Key: pair[0], Value: pair[1]});
            });
            $scope.elements = [];
            for (var key in lang.element) {
                $scope.elements.push({Key: key, Title: lang.element[key].title, Doc: lang.element[key].doc});
            }
        });
    }
);
