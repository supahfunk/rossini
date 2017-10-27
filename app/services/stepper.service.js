/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('StepperService', ['$rootScope', '$timeout', '$q', '$http', '$sce', 'SceneOptions', function($rootScope, $timeout, $q, $http, $sce, SceneOptions) {

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
            var titles = [
                'Il periodo francese:<br> la nascita della <em>Grand Opéra</em>',
                'Il Barbiere di Siviglia<br> al teatro Argentina<br> di Roma',
                'Il Silenzio',
            ];
            var paragraphs = [
                'Il giovane Gioacchino',
                'Il folgorante debutto',
                'La frenesia della produzione',
                'Sulle strade di Parigi',
            ];
            var audioTitles = [
                'Il Barbiere di Siviglia',
                'L\'italiana in Algeri',
            ];
            var audios = [
                'audio/07-rossini-192.mp3',
                'audio/08-rossini-192.mp3',
            ];
            var backgrounds = [
                'img/tunnel-1.jpg',
                'img/tunnel-2.jpg',
                'img/tunnel-3.jpg',
            ];
            var contrasts = [
                'light-bg',
                'light-bg',
                'dark-bg',
            ];
            var items = new Array(options.ribbon.steps).fill().map(function(v, i) {
                return {
                    id: i + 1,
                    title: titles[i % titles.length],
                    chapter: 'Passione, Genio e Silenzio',
                    paragraph: paragraphs[Math.floor(i / 3) % paragraphs.length],
                    years: {
                        from: 1812 + Math.round(Math.random() * 50),
                        to: 1812 + Math.round(Math.random() * 50),
                    },
                    background: backgrounds[i % backgrounds.length],
                    contrast: contrasts[i % contrasts.length],
                    colors: angular.copy(SceneOptions.colors),
                    camera: {
                        cameraHeight: 0,
                        targetHeight: 0,
                    },
                    circle: {
                        position: new THREE.Vector3(0, 0, 0),
                        texture: 'img/rossini-01.png',
                    },
                    audio: i > 0 ? {
                        url: audios[i % audios.length],
                        title: audioTitles[i % audioTitles.length],
                        orchestra: 'Academy of St Martin in the Fields Orchestra',
                    } : null,
                };
            });
            return items;
        }

        function init() {
            var deferred = $q.defer();
            $http.get('json/rossini.js').then(function(response) {
                // var items = response.data;
                var items = getItems();
                angular.forEach(items, function(item) {
                    item.titleTrusted = $sce.trustAsHtml(item.title);
                    item.circle.position = new THREE.Vector3().copy(item.circle.position);
                    steps.push(item);
                });
                setStep(0);
                // console.log('StepperService.load', steps);
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
                // console.log(step, stepper.values);
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

        $rootScope.$on('onSlickBeforeChange', function($scope, slick) {
            setStep(slick.current);
        });

        function setStep(index) {
            $timeout(function() {
                var previous = stepper.current || 0;
                stepper.current = index;
                var step = steps[index];
                stepper.step = step;
                options.colors.background = step.colors.background;
                options.colors.lines = step.colors.lines;
                options.colors.overLines = step.colors.overLines;
                options.camera.cameraHeight = step.camera.cameraHeight;
                options.camera.targetHeight = step.camera.targetHeight;
                options.circle.position.copy(step.circle.position);
                $rootScope.$broadcast('onStepChanged', { current: index, previous: previous });
                // console.log('onStepChanged', index, step);
                setTweens(stepper.duration);
            });
        }

        function next() {
            current++;
            current = Math.min(steps.length - 1, current);
            setStep(current);
            $rootScope.$broadcast('onGoStep', current);
        }

        function previous() {
            current--;
            current = Math.max(0, current);
            setStep(current);
            $rootScope.$broadcast('onGoStep', current);
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

}());