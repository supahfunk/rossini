/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('MotionService', ['$rootScope', function($rootScope) {

        var service = this;

        service.x = 0;
        service.y = 0;
        service.z = 0;

        function set(x, y, z) {
            service.x = x;
            service.y = y;
            service.z = z;
            $rootScope.$broadcast('onDeviceMotion', service);
        }

        function onDeviceOrientation(e) {
            var x = (e.alpha) / 90;
            var y = (e.beta - 90) / 90;
            var z = (e.gamma) / 90;
            // console.log('onDeviceOrientation', x, y, z);
            set(x, y, z);
        }

        function onDeviceMotion(e) {
            var x = (e.acceleration.x) / 1;
            var y = (e.acceleration.y) / 1;
            var z = (e.acceleration.z) / 1;
            // console.log('onDeviceMotion', x, y, z);
            set(x, y, z);
        }

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", onDeviceOrientation, true);

        } else if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', onDeviceMotion, true);

        }

    }]);

}());