/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.constant('SceneOptions', {
        colors: {
            background: 0xeae8e8,
            lines: 0x3353a4,
            overLines: 0xb4bfdd,
        },
        camera: {
            cameraHeight: 0,
            targetHeight: 5,
        },
        circle: {
            position: new THREE.Vector3(),
        },
        ribbon: {
            points: 40, // 12
            vertices: 3600, // 1200
        },
        audioVolume: 0.9,
        bands: 128,
        points: 128,
        lines: 32,
        radius: 200,
        audioStrength: 100,
        noiseStrength: 25,
        circularStrength: 0.90,
    });

    app.controller('RootCtrl', ['$scope', 'SceneOptions', 'StepperService', 'DatGui', function($scope, SceneOptions, StepperService, DatGui) {

        var scene = {
            objects: {},
            options: SceneOptions,
            stepper: StepperService,
        };

        var objects = scene.objects;
        var options = scene.options;
        var stepper = scene.stepper;

        stepper.init().then(function() {
            $scope.scene = scene;
            $scope.stepper = stepper;
            var gui = new DatGui();
        });

    }]);

    app.service('StepperService', ['$rootScope', '$q', '$http', 'SceneOptions', function($rootScope, $q, $http, SceneOptions) {

        var stepper = this;
        var options = SceneOptions;

        var current = 0;
        var duration = 2.500; // sec
        var steps = [];
        var tweens = [];

        var values = {
            pow: 0,
            background: new THREE.Color(options.colors.background),
            lines: new THREE.Color(options.colors.lines),
            overLines: new THREE.Color(options.colors.overLines),
            cameraHeight: options.camera.cameraHeight,
            targetHeight: options.camera.targetHeight,
        };

        function getItems() {
            var items = new Array(24).fill().map(function(v, i) {
                return {
                    id: i + 1,
                    name: 'Step ' + (i + 1),
                    colors: angular.copy(SceneOptions.colors),
                    camera: {
                        cameraHeight: 0,
                        targetHeight: 0,
                    },
                    circle: {
                        position: new THREE.Vector3(0, 0, 0),
                        texture: 'img/rossini-01.png',
                    },
                    audio: {
                        url: "audio/07-rossini-192.mp3",
                    },
                };
            });
            return items;
        }

        function init() {
            var deferred = $q.defer();
            $http.get('json/rossini.js').then(function(response) {
                var items = response.data; // getItems(); // 
                angular.forEach(items, function(item) {
                    item.circle.position = new THREE.Vector3().copy(item.circle.position);
                    steps.push(item);
                });
                console.log('StepperService.load', steps);
                deferred.resolve(steps);

            }, function(error) {
                deferred.reject(error);

            });
            return deferred.promise;
        }

        function clearTweens() {
            while (tweens.length) {
                var tween = tweens.pop();
                tween.kill();
            }
        }

        function tweenTo(pow, step, duration, callback) {
            clearTweens();
            var background = new THREE.Color(step.colors.background);
            var lines = new THREE.Color(step.colors.lines);
            var overLines = new THREE.Color(step.colors.overLines);
            tweens.push(TweenLite.to(stepper.values, duration, {
                pow: pow,
                cameraHeight: step.camera.cameraHeight,
                targetHeight: step.camera.targetHeight,
                delay: 0,
                ease: Power2.easeInOut,
                onComplete: function() {
                    if (callback) {
                        callback();
                    }
                },
            }));
            tweens.push(TweenLite.to(stepper.values.background, duration, {
                r: background.r,
                g: background.g,
                b: background.b,
                delay: 0,
                ease: Power2.easeInOut,
                onUpdate: function() {
                    var color = stepper.values.background.getHexString();
                    document.body.style.backgroundColor = '#' + color;
                }
            }));
            tweens.push(TweenLite.to(stepper.values.lines, duration, {
                r: lines.r,
                g: lines.g,
                b: lines.b,
                delay: 0,
                ease: Power2.easeInOut,
            }));
            tweens.push(TweenLite.to(stepper.values.overLines, duration, {
                r: overLines.r,
                g: overLines.g,
                b: overLines.b,
                delay: 0,
                ease: Power2.easeInOut,
            }));
        }

        function setTweens(duration) {
            var index = stepper.current;
            var step = steps[index];
            tweenTo(index / steps.length, step, duration, function() {
                clearTweens();
                console.log(step, stepper.values);
            });
        }

        $rootScope.$on('onOptionsChanged', function() {
            var index = stepper.current;
            var step = steps[index];
            stepper.values.cameraHeight = step.camera.cameraHeight;
            stepper.values.targetHeight = step.camera.targetHeight;
            stepper.values.background.copy(new THREE.Color(step.colors.background));
            stepper.values.lines.copy(new THREE.Color(step.colors.lines));
            stepper.values.overLines.copy(new THREE.Color(step.colors.overLines));
            // setTweens(0.250);
        });

        function setStep(index) {
            var previous = stepper.current || 0;
            stepper.current = index;
            var step = steps[index];
            options.colors.background = step.colors.background;
            options.colors.lines = step.colors.lines;
            options.colors.overLines = step.colors.overLines;
            options.camera.cameraHeight = step.camera.cameraHeight;
            options.camera.targetHeight = step.camera.targetHeight;
            options.circle.position.copy(step.circle.position);
            $rootScope.$broadcast('onStepChanged', { current: index, previous: previous });
            setTweens(stepper.duration);
        }

        function next() {
            current++;
            current = Math.min(steps.length - 1, current);
            setStep(current);
        }

        function previous() {
            current--;
            current = Math.max(0, current);
            setStep(current);
        }

        function getCurrentStep() {
            return steps[current];
        }

        function getStepAtIndex(index) {
            return steps[index];
        }

        this.init = init;
        this.values = values;
        this.duration = duration;
        this.steps = steps;
        this.current = current;
        this.next = next;
        this.previous = previous;
        this.getCurrentStep = getCurrentStep;
        this.getStepAtIndex = getStepAtIndex;

    }]);

    app.factory('DatGui', ['$rootScope', 'SceneOptions', 'StepperService', function($rootScope, SceneOptions, StepperService) {

        var downloadFile = function downloadFile() {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function(data, fileName, json, pretty) {
                if (json) {
                    if (pretty) {
                        data = JSON.stringify(data, null, 2); // spacing level = 2
                    } else {
                        data = JSON.stringify(data);
                    }
                }
                var blob = new Blob([data], { type: "octet/stream" }),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }();

        function DatGui() {
            var options = SceneOptions;
            var stepper = StepperService;
            var gui = new dat.GUI();

            options.randomize = function() {
                for (var i = 0; i < gui.__controllers.length; i++) {
                    var c = gui.__controllers[i];
                    if (c.__min) {
                        var value = c.__min + (c.__max - c.__min) * Math.random();
                        this[c.property] = value;
                        c.updateDisplay();
                    }
                    if (c.__color) {
                        c.__color.r = Math.floor(Math.random() * 255);
                        c.__color.g = Math.floor(Math.random() * 255);
                        c.__color.b = Math.floor(Math.random() * 255);
                        c.updateDisplay();
                        c.setValue(c.__color.hex);
                    }
                }
            };

            options.saveJson = function() {
                console.log('saveJson');
                downloadFile(stepper.steps, 'rossini.js', true, true);
            };

            function onOptionsChanged(params) {
                var step = stepper.getCurrentStep();
                step.colors.background = options.colors.background;
                step.colors.lines = options.colors.lines;
                step.colors.overLines = options.colors.overLines;
                step.camera.cameraHeight = options.camera.cameraHeight;
                step.camera.targetHeight = options.camera.targetHeight;
                step.circle.position.copy(options.circle.position);
                $rootScope.$broadcast('onOptionsChanged');
            }

            gui.closed = true;
            gui.add(options.camera, 'cameraHeight', -20.0, 20.0).listen().onChange(onOptionsChanged);
            gui.add(options.camera, 'targetHeight', -20.0, 20.0).listen().onChange(onOptionsChanged);
            var circlePosition = gui.addFolder('circlePosition');
            circlePosition.add(options.circle.position, 'x', -300, 300).listen().onChange(onOptionsChanged);
            circlePosition.add(options.circle.position, 'y', -300, 300).listen().onChange(onOptionsChanged);
            circlePosition.add(options.circle.position, 'z', -300, 300).listen().onChange(onOptionsChanged);
            var colors = gui.addFolder('colors');
            colors.addColor(options.colors, 'background').listen().onChange(onOptionsChanged);
            colors.addColor(options.colors, 'lines').listen().onChange(onOptionsChanged);
            colors.addColor(options.colors, 'overLines').listen().onChange(onOptionsChanged);
            gui.add(options, 'audioVolume', 0.01, 1.0).onChange(onOptionsChanged);
            gui.add(options, 'audioStrength', 10, 100).onChange(onOptionsChanged);
            gui.add(options, 'noiseStrength', 10, 100).onChange(onOptionsChanged);
            gui.add(options, 'circularStrength', 0.01, 0.90).onChange(onOptionsChanged);
            gui.add(options, 'randomize');
            gui.add(options, 'saveJson');

            onOptionsChanged();

            return gui;
        }

        return DatGui;

    }]);

    app.directive('scrollbar', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes, model) {
                var native = element[0];
                var options = {
                    speed: 1,
                    damping: 0.1,
                    overscrollDamping: 1.0,
                    thumbMinSize: 20,
                    continuousScrolling: true,
                    alwaysShowTracks: false
                };
                var scrollbar;

                function Init() {
                    scrollbar = Scrollbar.init(native, options);
                    scope.$watch(scrollbar.targets.content.offsetHeight, function(height) {
                        scrollbar.update();
                    });
                }
                setTimeout(Init, 100);
            }
        };
    }]);

}());