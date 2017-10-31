/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {

        // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('');

        $routeProvider.when('/years/', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        }).when('/years/:yearsKey', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        }).when('/years/:yearsKey/detail', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        });

        $routeProvider.otherwise('/years');

    }]);

}());