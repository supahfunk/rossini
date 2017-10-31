/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    var getNow = Date.now || function() {
        return new Date().getTime();
    };

    function throttle(callback, wait, options) {
        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function() {
            previous = options.leading === false ? 0 : getNow();
            timeout = null;
            result = callback.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = getNow();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = callback.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }

    app.service('MotionService', ['$rootScope', function($rootScope) {

        var service = this;

        service.x = 0;
        service.y = 0;
        service.z = 0;
        service.init = init;

        function set(x, y, z) {
            service.x = x;
            service.y = y;
            service.z = z;
            $rootScope.$broadcast('onDeviceMotion', service);
        }

        function addListeners() {
            if (window.DeviceOrientationEvent) {
                window.addEventListener("deviceorientation", onDeviceOrientation, true);
            }
            /*
            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', onDeviceMotion, true);
            }    
            */
        }

        function onDeviceOrientation(e) {
            var y = e.beta;
            var x = e.gamma;
            var z = 0;

            y = Math.min(y, 30) - 10;

            x /= 30;
            y /= 30;
            z /= 30;

            set(x, y, z);
        }

        function onDeviceMotion(e) {
            var x = (e.acceleration.x) / 1;
            var y = (e.acceleration.y) / 1;
            var z = (e.acceleration.z) / 1;
            // console.log('onDeviceMotion', x, y, z);
            set(x, y, z);
        }

        function init() {
            addListeners();
            console.log('MotionService.init');
        }

    }]);

}());