/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('TestCtrl', ['$scope', '$route', '$routeParams', '$ngSilentLocation', 'MotionService', '$timeout', function($scope, $route, $routeParams, $ngSilentLocation, MotionService, $timeout) {

        var motion = MotionService;
        motion.init();

        function updateParallax() {
            $timeout(function() {
                motion.update();
                console.log(motion);
            });
        }

        function loop() {
            updateParallax();
            requestAnimationFrame(loop);
        }

        $scope.motion = motion;

    }]);

}());