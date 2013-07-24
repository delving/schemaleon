'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('NavigationController',
    ['$scope', '$location',
        function ($scope, $location) {
            $scope.mainMenu = {
                links: [
                    {label: "Dashboard", path: "/#/dashboard", icon: 'icon-home', active: false},
                    {label: "Registered Objects", path: "/#/list", icon: 'icon-th-list', active: false},
                    {label: "Object", path: "/#/object", icon: 'icon-stop', active: false}
                ],
                activeLabel: 'Dashboard'
            };
            $scope.choose = function (index) {
                var walk = 0;
                _.forEach($scope.mainMenu.links, function (link) {
                    link.active = (walk == index);
                    if (link.active) {
                        $scope.mainMenu.activeLabe = link.label;
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