/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('navTo', ['$parse', '$timeout', function($parse, $timeout) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                function onTap(e) {
                    console.log('navTo.onTap', attributes.navTo);
                    $timeout(function() {
                        var callback = $parse(attributes.navTo);
                        callback(scope);
                    });
                }

                function onTouchStart(e) {
                    onTap();
                    element
                        .off('mousedown', onMouseDown);
                    // e.preventDefault();
                    // return false;
                }

                function onMouseDown(e) {
                    onTap();
                    element
                        .off('touchstart', onTouchStart);
                    // e.preventDefault();
                    // return false;
                }

                function addListeners() {
                    element
                        .on('touchstart', onTouchStart)
                        .on('mousedown', onMouseDown);
                }

                function removeListeners() {
                    element
                        .off('touchstart', onTouchStart)
                        .off('mousedown', onMouseDown);
                }

                addListeners();

                scope.$on('$destroy', function() {
                    removeListeners();
                });

            }
        };
    }]);

}());