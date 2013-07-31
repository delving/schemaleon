'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('NavigationController',
    ['$rootScope','$scope', '$location',
        function ($rootScope, $scope, $location) {
            $scope.mainMenu = {
                links: [
                    {name: "Dashboard", path: "/#/dashboard", icon: 'icon-home', active: false},
                    {name: "Documents", path: "/#/document/", icon: 'icon-th-list', active: false}
                ],
                activeLabel: 'Dashboard'
            };
            $scope.choose = function (path) {
                _.forEach($scope.mainMenu.links, function (link) {
                    link.active = (link.path == path);
                    if (link.active) {
                        $scope.mainMenu.activeLabel = link.label;
                        $location.path(link.path);
                    }
                });
            };
            var anyActive = false;
            _.forEach($scope.mainMenu.links, function (link) {
                var sought = link.path.substring(3);
                link.active = ($location.path().indexOf(sought) >= 0);
                if (link.active) {
                    anyActive = true;
                    $scope.mainMenu.activeLabel = link.label;
                }
            });
            if (!anyActive) {
                $scope.mainMenu.links[0].active = true;
            }

            $scope.getInclude = function(){
                if($location.path().indexOf('/object/') >= 0){
                    return "views/legend.html";
                }
                return "";
            };

            $scope.onwards = function (loco) {
                console.log('onwards');
                if(!$rootScope.config.showTranslationEditor){
                    $location.path(loco);
                }
            }

        }]
);