/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('operas', [function() {
        return {
            restrict: 'A',
            templateUrl: 'partials/operas',
            link: function(scope, element, attributes) {}
        };
    }]);

}());