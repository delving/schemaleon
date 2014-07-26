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

var Schemaleon = angular.moSchemaleon('Schemaleon');

/**
 * Various directives used pages throughout the app
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delviSchemaleonu>
 */

Schemaleon.directive('private',
    function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$watch(attrs.private, function (ok) {
                    if (!ok) {
                        element.text('');
                    }
                });
            }
        };
    }
);

Schemaleon.directive('scrollable', function($window, $timeout) {
    return {
        restrict: 'E,A',
        replace: false,
        scope: true,
        link: function($scope, $element, $attrs){
            // wrap in timeout because this directive is also called inside the mediaList directive (media.js)
            // and needs to run the $apply cycle to pick up it's offsetHeight attribute to pass into here
            $timeout(function(){
                var offset = $attrs.offset,
                    height = $attrs.fixedHeight;
                $scope.elHeight = null;
                function initialize () {
                    if(!height){
                        $scope.elHeight = $window.innerHeight - offset;
                    }
                    else {
                        $scope.elHeight = height;
                    }
                }
                initialize();
                return angular.element($window).bind('resize', function() {
                    initialize();
                    return $scope.$apply();
                });
            });
        }
    }
});


Schemaleon.directive('chatEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.chatEnter);
                });
                event.preventDefault();
            }
        });
    };
});

Schemaleon.directive('documentNavigation', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            elem.bind('keydown', function (e) {
                _.each([
                    { code: 37, name: 'left'},
                    { code: 39, name: 'right'},
                    { code: 38, name: 'up'},
                    { code: 40, name: 'down'},
                    { code: 13, name: 'enter'},
                    { code: 27, name: 'escape'}
                ], function (pair) {
                    if (pair.code === e.keyCode) {
                        scope.$apply(function (s) {
                            $('body').addClass('keyboard-on');
                            s.$eval(attr.documentNavigation, { $key: pair.name });
                        });
                    }
                });
            });
        }
    };
});

Schemaleon.directive('elFocus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function ($scope, $element) {
                // add this element to the focus element array and tell it which one it is
                $scope.el.focusElementIndex = $scope.focusElementArray.length;
                $scope.focusElementArray.push($element[0]);
            }
        };
    }
);

Schemaleon.directive('elHiddenFocus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function ($scope, $element) {
                // add this element to the focus element array and tell it which one it is
                $scope.el.hiddenFocusElementIndex = $scope.hiddenFocusElementArray.length;
                $scope.hiddenFocusElementArray.push($element[0]);
            }
        };
    }
);

Schemaleon.directive('uiVideo', function () {
    var vp; // video player object to overcome one of the angularjs issues in #1352 (https://github.com/angular/angular.js/issues/1352). when the videojs player is removed from the dom, the player object is not destroyed and can't be reused.
    var videoId = Math.floor((Math.random() * 1000) + 100); // in random we trust. you can use a hash of the video uri
    return {
        template: '<div class="video-player">' +
            '<video ng-src="{{ videoSrc }}" id="video-' + videoId + '" class="video-js vjs-default-skin" controls preload="auto">' +
            'Your browser does not support the video tag. ' +
            '</video></div>',
        link: function (scope, element, attrs) {
//            if (vp) vp.dispose();
            vp = videojs('video-' + videoId, {"width": '100%', "height": 400 });
            scope.$on('$destroy', function () {
                vp.dispose();
            });

        }
    };
});

Schemaleon.directive(
    'i18n',
    function () {
        return {
            restrict: 'A',
            replace: false,
            transclude: true,
            scope: true,
            link: function ($scope, $element, $attrs) {
                $scope.$watch('i18n', function (i18n, before) {
                    function setText(text) {
                        var find = $element.find('.i18n');
                        if (find.length) {
                            find.text(text);
                        }
                        else {
                            $element.text(text);
                        }
                    }

                    if (i18n) {
                        var msg = i18n.label[$attrs.i18n];
                        if (msg && msg != '?') {
                            setText(msg);
                            return;
                        }
                    }
                    setText($attrs.i18n);
                });
                $scope.key = $attrs.i18n;
                $scope.allKeysI18N[$attrs.i18n] = true;
                $attrs.$observe('i18n', function (newValue) {
                    $scope.key = newValue;
                });
            },
            template:
                '<span ng-transclude></span> ' +
                    '<span class="badge badge-warning badge-translate pointer" ng-show="config.showTranslationEditor" ng-click="openLabelDialog(key)">' +
                    '<i class="glyphicon glyphicon-globe"></i>' +
                    '</span>'
        }
    }
);


Schemaleon.directive('schemaleonMediaList', function($document){
    var viewHeight = $document.height() - 380;
    return {
        restrict: 'E,A',
        templateUrl: 'template/media/mediaList.html',
        replace: false,
        link: function($scope, $element, $attrs){
            $scope.gridSize = $attrs.gridSize;
            $scope.selectMedia = $attrs.selectMedia;
            // eval this attr to pass it onto the scrollable directive (global.js)
            $scope.offsetHeight = $scope.$eval($attrs.offsetHeight);
        }
    }
});

Schemaleon.directive('schemaleonMediaAsideSelect', function(){
    return {
        restrict: 'E,A',
        templateUrl: 'template/media/mediaAsideSelect.html',
        replace: false
    }
});

Schemaleon.directive('schemaleonMediaAsideUpload', function(){
    return {
        restrict: 'A',
        templateUrl: 'template/media/mediaAsideUpload.html',
        replace: false
    }
});
