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

        function init(yearsKey) {
            var deferred = $q.defer();
            var index = 0;
            if (steps.length) {
                angular.forEach(steps, function(item, i) {
                    if (item.years.key === yearsKey) {
                        index = i;
                    }
                });
                values.pow = index / steps.length;
                stepper.current = current = index;
                navStep(index);
                deferred.resolve(steps);
            } else {
                $http.get('json/rossini.js').then(function(response) {
                    var items = response.data;
                    // var items = getItems();
                    angular.forEach(items, function(item, i) {
                        // console.log(item);
                        item.years.key = String(item.years.to ? item.years.from + '-' + item.years.to : item.years.from); // da riattivare !!!
                        item.url = '/years/' + item.years.key;
                        item.detailUrl = item.url + '/detail';
                        // console.log('stepper.init', item.years.key, yearsKey);
                        if (item.years.key === yearsKey) {
                            index = i;
                        }
                        item.titleTrusted = $sce.trustAsHtml(item.title);
                        item.contrast = getContrast(item.colors.background);
                        item.circle.position = new THREE.Vector3().copy(item.circle.position);
                        steps.push(item);
                    });
                    values.pow = index / steps.length;
                    stepper.current = current = index;
                    navStep(index);
                    // console.log('StepperService.load', steps);
                    deferred.resolve(steps);

                }, function(error) {
                    deferred.reject(error);

                });
            }
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
            // console.log('StepperService.onOptionsChanged', index);
            setBackground(index);
        });

        $rootScope.$on('onSlickBeforeChange', function($scope, slick) {
            navStep(slick.current);
        });

        function setStep(index) {
            // console.log('StepperService.setStep', index);
            $timeout(function() {
                var previous = stepper.current || 0;
                stepper.current = current = index;
                var step = steps[index];
                stepper.step = step;
                options.colors.background = step.colors.background;
                options.colors.lines = step.colors.lines;
                options.colors.overLines = step.colors.overLines;
                options.camera.cameraHeight = step.camera.cameraHeight;
                options.camera.targetHeight = step.camera.targetHeight;
                options.circle.position.copy(step.circle.position);
                setBackground(index);
                $rootScope.$broadcast('onStepChanged', { current: index, previous: previous });
                // console.log('onStepChanged', index, step);
                setTweens(stepper.duration);
            });
        }

        function getCurrentStep() {
            return steps[current];
        }

        function getStepAtIndex(index) {
            return steps[index];
        }

        function previous() {
            if (stepper.slicking) {
                return;
            }
            current--;
            current = Math.max(0, current);
            navStep(current);
            $rootScope.$broadcast('onGoStep', current);
        }

        function next() {
            if (stepper.slicking) {
                return;
            }
            current++;
            current = Math.min(steps.length - 1, current);
            navStep(current);
            $rootScope.$broadcast('onGoStep', current);
        }

        function navStep(index) {
            setStep(index);
            $rootScope.$broadcast('onGoStep', index);
            $timeout(function() {
                var element = $('.tunnel-nav__step.active');
                if (element.length) {
                    var position = element.position().top;
                    var width = element.width() + 16;
                    $('.tunnel-nav__follower').css({ width: width + 'px', '-webkit-transform': 'translateY(' + position + 'px)', '-moz-transform': 'translateY(' + position + 'px)', '-ms-transform': 'translateY(' + position + 'px)', 'transform': 'translateY(' + position + 'px)' });
                }
            });
        }

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
            var items = new Array(options.ribbon.steps).fill().map(function(v, i) {
                var item = {
                    id: i + 1,
                    title: titles[i % titles.length],
                    url: 'view.html',
                    chapter: 'Passione, Genio e Silenzio',
                    paragraph: paragraphs[Math.floor(i / 3) % paragraphs.length],
                    years: i % 4 === 0 ? {
                        from: 1812 + Math.round(Math.random() * 50),
                    } : {
                        from: 1812 + Math.round(Math.random() * 50),
                        to: 1812 + Math.round(Math.random() * 50),
                    },
                    background: backgrounds[i % backgrounds.length],
                    colors: angular.copy(SceneOptions.colors),
                    camera: {
                        cameraHeight: -10,
                        targetHeight: 30,
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
                if (i > 0 && i % 3 === 0) {
                    item.colors.background = 0x111111;
                }
                return item;
            });
            return items;
        }

        function setBackground(index) {
            if (!options.useBackground) {
                var step = stepper.getStepAtIndex(index);
                var color = new THREE.Color(step.colors.background).getHexString();
                $('.tunnel-gradient').css('background-color', '#' + color);
                // console.log('StepperService.setBackground', index, color, step.contrast);
            }
        }

        function getContrast(value) {
            var color = new THREE.Color(value);
            var r = parseInt(color.r * 255);
            var g = parseInt(color.g * 255);
            var b = parseInt(color.b * 255);
            var pow = r * 0.299 + g * 0.587 + b * 0.114;
            var contrast = (pow > 125) ? 'light-bg' : 'dark-bg';
            // console.log('StepperService.getContrast', color.getHexString(), pow, contrast);
            return contrast;
        }

        this.init = init;
        this.values = values;
        this.duration = duration;
        this.steps = steps;
        this.navStep = navStep;
        this.getCurrentStep = getCurrentStep;
        this.getStepAtIndex = getStepAtIndex;
        this.current = current;
        this.previous = previous;
        this.next = next;

    }]);

}());