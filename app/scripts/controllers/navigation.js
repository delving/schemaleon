'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('NavigationController',
    ['$rootScope', '$scope', '$location',
        function ($rootScope, $scope, $location) {

            $scope.mainMenu = {
                links: [
                    {name: "Dashboard", path: "/dashboard", icon: 'icon-home', active: false},
                    {name: "Documents", path: "/document/", icon: 'icon-th-list', active: false}
                ]
            };
            $scope.recent = [];

            var anyActive = false;
            _.forEach($scope.mainMenu.links, function (link) {
                link.active = ($location.path().indexOf(link.path) >= 0);
                if (link.active) anyActive = true;
            });
            if (!anyActive) {
                $scope.mainMenu.links[0].active = true;
            }

            $scope.choosePath = function (path) {
                if ($rootScope.config.showTranslationEditor) {
                    return;
                }
                var activeItem = false;
                _.forEach($scope.mainMenu.links.concat($scope.recent), function (link) {
                    link.active = (link.path === path);
                    if (link.active) activeItem = true;
                });
                if (!activeItem && path.indexOf('OSCR') > 0) {
                    var identifier = path.substring(path.lastIndexOf("/") + 1, path.length);
                    var freshLabel = {
                        name: identifier,
                        path: path,
                        icon: 'icon-th-home',
                        active: true,
                        recent: true
                    };
                    $scope.recent.push(freshLabel);
                }
                $location.path(path);
            };

            $scope.getInclude = function () {
                if ($location.path().indexOf('/object/') >= 0) {
                    return "views/legend.html";
                }
                return "";
            };
        }]
);