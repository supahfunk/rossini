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
        service.compass = 0;

        service.update = throttle(update, 100);
        service.init = init;

        function set(x, y, z, degree) {
            service.x = x;
            service.y = y;
            service.z = z;
            service.compass = degree;
            $rootScope.$broadcast('onDeviceMotion', service);
        }

        function update() {
            var device = service.device;
            if (device) {
                // Obtain the *screen-adjusted* normalized device rotation
                // as Quaternion, Rotation Matrix and Euler Angles objects
                // from our FULLTILT.DeviceOrientation object
                // var quaternion = device.getScreenAdjustedQuaternion();
                // var matrix = device.getScreenAdjustedMatrix();
                var e = device.getScreenAdjustedEuler();
                var x = e.alpha / 90;
                var y = (e.beta - 90) / 90;
                var z = e.gamma / 90;
                // console.log('onDeviceOrientation', x, y, z);

                var direction = Math.round(e.alpha);
                var tiltFB = Math.round(e.beta);
                var tiltLR = Math.round(e.gamma);

                //update longitude
                if (tiltFB < 0) {
                    tiltFB = tiltFB * -1;
                }
                var latitude = (tiltFB) - (180 / 2);

                var alphaRad = e.alpha * (Math.PI / 180);
                var betaRad = e.beta * (Math.PI / 180);
                var gammaRad = e.gamma * (Math.PI / 180);

                var cA = Math.cos(alphaRad);
                var sA = Math.sin(alphaRad);
                var cB = Math.cos(betaRad);
                var sB = Math.sin(betaRad);
                var cG = Math.cos(gammaRad);
                var sG = Math.sin(gammaRad);

                //Calculate A, B, C rotation components
                var rA = -cA * sG - sA * sB * cG;
                var rB = -sA * sG + cA * sB * cG;
                var rC = -cB * cG;

                //Calculate compass heading
                var compassHeading = Math.atan(rA / rB);

                //Convert from half unit circle to whole unit circle
                if (rB < 0) {
                    compassHeading += Math.PI;
                } else if (rA < 0) {
                    compassHeading += 2 * Math.PI;
                }

                //Convert radians to degrees
                compassHeading *= 180 / Math.PI;

                set(x, y, z, compassHeading);
            }
            console.log('MotionService.update', device);
        }

        function addListeners() {
            if (window.DeviceOrientationEvent) {
                /*
                var orientation = FULLTILT.getDeviceOrientation({ 'type': 'world' }).then(function(controller) {
                    service.device = controller;
                }).catch(function(error) {
                    console.log('MotionService.getDeviceOrientation', error);
                });
                */
                window.addEventListener("deviceorientation", onDeviceOrientation, true);
            }
            /*
            if (window.DeviceMotionEvent) {
                var motion = FULLTILT.getDeviceMotion({ 'type': 'world' }).then(function(controller) {
                    service.device = controller;
                }).catch(function(error) {
                    console.log('MotionService.getDeviceMotion', error);
                });
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