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
                    contrast: contrasts[i % contrasts.length],
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
                if (item.contrast === 'dark-bg') {
                    item.colors.background = 0x111111;
                }
                return item;
            });
            return items;
        }

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
                    // var items = response.data;
                    var items = getItems();
                    angular.forEach(items, function(item, i) {
                        item.years.key = String(i + 1); // String(item.years.to ? item.years.from + '-' + item.years.to : item.years.from); // da riattivare !!!
                        item.url = '/years/' + item.years.key;
                        item.detailUrl = item.url + '/detail';
                        // console.log('stepper.init', item.years.key, yearsKey);
                        if (item.years.key === yearsKey) {
                            index = i;
                        }
                        item.titleTrusted = $sce.trustAsHtml(item.title);
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
            tweens.push(TweenLite.to(stepper.values.background, duration, {
                r: background.r,
                g: background.g,
                b: background.b,
                delay: 0,
                ease: Power2.easeInOut,
                /*
                onUpdate: function() {
                    if (!options.useBackground) {
                        var color = stepper.values.background.getHexString();
                        document.body.style.backgroundColor = '#' + color;
                    }
                }
                */
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
            if (!options.useBackground) {
                var color = stepper.values.background.getHexString();
                $('.tunnel-gradient').css('background-color', '#' + color);
            }
        });

        $rootScope.$on('onSlickBeforeChange', function($scope, slick) {
            navStep(slick.current);
        });

        function setStep(index) {
            console.log('setStep');
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
                if (!options.useBackground) {
                    var color = new THREE.Color(options.colors.background).getHexString();
                    $('.tunnel-gradient').css('background-color', '#' + color);
                }
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
            console.log('cambio pagina');
            setStep(index);
            $rootScope.$broadcast('onGoStep', index);

            $timeout(function() {
                var $active = $('.tunnel-nav__step.active'),
                    position = $active.position().top,
                    width = $active.width() + 16;

                $('.tunnel-nav__follower').css({ width: width + 'px', '-webkit-transform': 'translateY(' + position + 'px)', '-moz-transform': 'translateY(' + position + 'px)', '-ms-transform': 'translateY(' + position + 'px)', 'transform': 'translateY(' + position + 'px)' });
            });
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