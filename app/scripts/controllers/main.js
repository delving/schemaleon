'use strict';

angular.module('cultureCollectorApp')
  .controller('MainCtrl', ['$scope', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.melvins = [
        'Gerald',
        'Eric',
        'Thomas',
        'Manuel',
        'Sjoerd',
        'Juliane'
    ];
  }]);
