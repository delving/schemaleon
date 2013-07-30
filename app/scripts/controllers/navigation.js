'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('NavigationController',
    ['$scope', '$location',
        function ($scope, $location) {
            $scope.mainMenu = {
                links: [
                    {name: "Dashboard", path: "/#/dashboard", icon: 'icon-home', active: false},
                    {name: "Documents", path: "/#/document/", icon: 'icon-th-list', active: false}
                ],
                activeLabel: 'Dashboard'
            };
            $scope.choose = function (index) {
                var walk = 0;
                _.forEach($scope.mainMenu.links, function (link) {
                    link.active = (walk == index);
                    if (link.active) {
                        $scope.mainMenu.activeLabel = link.label;
                    }
                    walk++;
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
        }]
);