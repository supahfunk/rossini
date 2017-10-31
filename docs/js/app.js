/* global angular */

(function() {
    "use strict";

    var app = angular.module('app', ['ngSilent', 'ngRoute', 'ngSanitize', 'jsonFormatter']);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$httpProvider', function($httpProvider) {
        // $httpProvider.defaults.withCredentials = true;
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {

        // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('');

        $routeProvider.when('/years/', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        }).when('/years/:yearsKey', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        }).when('/years/:yearsKey/detail', {
            templateUrl: function() {
                return 'partials/years.html';
            },
            controller: 'YearsCtrl',
            controllerAs: 'yearsCtrl',

        });

        $routeProvider.otherwise('/years');

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.run(['$rootScope', function($rootScope) {

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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
                // console.log(gui);
                function randomize(controllers) {
                    for (var i = 0; i < controllers.length; i++) {
                        var c = controllers[i];
                        if (c.__min) {
                            var value = c.__min + (c.__max - c.__min) * Math.random();
                            // options[c.property] = value;
                            c.setValue(value);
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
                }
                randomize(gui.__controllers);
                angular.forEach(gui.__folders, function(folder) {
                    randomize(folder.__controllers);
                });
                // console.log(options.circle.position);
                // console.log(stepper.step.circle.position);
            };

            options.saveJson = function() {
                var json = stepper.steps.map(function(item) {
                    item = angular.copy(item);
                    var colors = {
                        background: '#' + new THREE.Color(item.colors.background).getHexString(),
                        lines: '#' + new THREE.Color(item.colors.lines).getHexString(),
                        overLines: '#' + new THREE.Color(item.colors.overLines).getHexString(),
                    }
                    item.colors = colors;
                    return item;
                });
                console.log('saveJson', json);
                downloadFile(json, 'rossini.js', true, true);
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
            gui.add(options.camera, 'cameraHeight', -10.0, 30.0).listen().onChange(onOptionsChanged);
            gui.add(options.camera, 'targetHeight', -10.0, 30.0).listen().onChange(onOptionsChanged);
            var circlePosition = gui.addFolder('circlePosition');
            circlePosition.add(options.circle.position, 'x', -300, 300).listen().onChange(onOptionsChanged);
            circlePosition.add(options.circle.position, 'y', -300, 300).listen().onChange(onOptionsChanged);
            circlePosition.add(options.circle.position, 'z', -300, 300).listen().onChange(onOptionsChanged);
            var colors = gui.addFolder('colors');
            colors.addColor(options.colors, 'background').listen().onChange(onOptionsChanged);
            colors.addColor(options.colors, 'lines').listen().onChange(onOptionsChanged);
            colors.addColor(options.colors, 'overLines').listen().onChange(onOptionsChanged);
            gui.add(options.audio, 'volume', 0.01, 1.0).onChange(onOptionsChanged);
            gui.add(options, 'audioStrength', 10, 100).onChange(onOptionsChanged);
            gui.add(options, 'noiseStrength', 10, 100).onChange(onOptionsChanged);
            gui.add(options, 'circularStrength', 0.01, 0.90).onChange(onOptionsChanged);
            gui.add(options, 'randomize');
            gui.add(options, 'saveJson');

            angular.element(window).on('keydown', onKeyDown);

            function onKeyDown(e) {
                var key = e.key.toLowerCase();
                if (key === 'a' && e.ctrlKey) {
                    $(document).find('body').toggleClass('gui-active');
                }
            }

            return gui;
        }

        return DatGui;

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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

                function Init() {
                    var scrollbar = Scrollbar.init(native, options);
                    // console.log(scrollbar);
                    scope.$watch(scrollbar.contentEl.offsetHeight, function(height) {
                        scrollbar.update();
                    });
                }

                setTimeout(Init, 100);
            }
        };
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('slickTunnel', ['$timeout', 'StepperService', 'SceneOptions', function($timeout, StepperService, SceneOptions) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                var options = SceneOptions;
                var stepper = StepperService;

                function unSlick() {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('unslick');
                    }
                }

                function onSlick() {
                    unSlick();
                    element.slick({
                        arrows: false,
                        dots: false,
                        fade: true,
                        speed: 1100,
                        infinite: false,
                        draggable: false,
                        asNavFor: options.useBackground ? '.tunnel-bg' : null,
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
                        initialSlide: stepper.current,
                    });
                }

                function showLetters() {
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, {
                        delay: 0.2,
                        y: 0,
                        x: 0,
                        ease: Power3.easeInOut,
                        className: '+=viewed',
                        onComplete: function() {
                            $('.slick-active .cta').addClass('active');
                        }
                    }, 0.009);
                }

                function hideLetters() {
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, {
                        delay: 0,
                        y: 100,
                        x: 50,
                        ease: Power3.easeInOut,
                        className: '-=viewed'
                    }, 0.009);
                    $('.slick-active .cta').removeClass('active');
                }

                function onInit() {
                    // console.log('onInit');
                    setTimeout(function() {
                        showLetters();
                    }, 500);
                    scope.$root.$broadcast('onSlickInit');
                }

                function onBeforeChange(event, slick, currentSlide, nextSlide) {
                    stepper.slicking = true;
                    hideLetters();
                    // console.log('onBeforeChange');               
                    scope.$root.$broadcast('onSlickBeforeChange', { current: nextSlide, previous: currentSlide });
                }

                function onAfterChange(event, slick, currentSlide) {
                    stepper.slicking = false;
                    showLetters();
                    // console.log('onAfterChange');
                    scope.$root.$broadcast('onSlickAfterChange', { current: currentSlide });
                }

                function onWheel(e) {
                    if (stepper.slicking) {
                        return;
                    }
                    if (element.hasClass('slick-initialized')) {
                        if (e.deltaX > 0 || e.deltaY < 0) {
                            element.slick('slickNext');
                        } else if (e.deltaX < 0 || e.deltaY > 0) {
                            if (stepper.current == 1) {
                                return;
                            }
                            element.slick('slickPrev');
                        }
                    }
                    e.preventDefault();
                }

                function addListeners() {
                    element
                        .on('init', onInit)
                        .on('beforeChange', onBeforeChange)
                        .on('afterChange', onAfterChange)
                        .on('mousewheel', onWheel);
                }

                function removeListeners() {
                    element
                        .off('init', onInit)
                        .off('beforeChange', onBeforeChange)
                        .off('afterChange', onAfterChange)
                        .off('mousewheel', onWheel);
                }

                addListeners();

                scope.$watchCollection(attributes.slickTunnel, function(items) {
                    if (items && items.length) {
                        onSlick();
                    }
                });

                scope.$on('onGoStep', function($scope, index) {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('slickGoTo', index);
                    }
                });

                scope.$on('$destroy', function() {
                    removeListeners();
                    unSlick();
                });
            }
        };
    }]);

    app.directive('slickBackgrounds', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                function unSlick() {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('unslick');
                    }
                }

                function onSlick() {
                    unSlick();
                    element.slick({
                        arrows: false,
                        dots: false,
                        fade: true,
                        speed: 1100,
                        infinite: false,
                        lazyLoad: 'ondemand',
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
                    });
                }

                scope.$watchCollection(attributes.slickBackgrounds, function(items) {
                    if (items && items.length) {
                        setTimeout(onSlick, 1)
                    }
                });

                scope.$on('$destroy', function() {
                    unSlick();
                });
            }
        };
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('splitText', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                function splitText() {

                    var nodes = element[0].childNodes;
                    nodes = Array.prototype.slice.call(nodes, 0);

                    element.html('').addClass('active');

                    var rows = [
                        []
                    ];

                    nodes.filter(function(node) {
                        return node.nodeType === 3 || node.nodeType === 1;
                    }).map(function(node) {
                        if (node.nodeType === 3) {
                            node = { text: $.trim(node.textContent), element: 'span' };
                        } else {
                            if (node.nodeName.toLowerCase() === 'br') {
                                rows.push([]);
                                return;
                            }
                            node = { text: $.trim(node.innerHTML), element: node.nodeName };
                        }
                        if (node.text !== '') {
                            rows[rows.length - 1].push(node);
                        }
                    });

                    for (var r = 0; r < rows.length; r++) {
                        /* Riga */
                        // console.log('riga ' + r, rows[r]);
                        var row = rows[r];
                        $('<div class="splitted-row"></div>').appendTo(element);

                        /* Elemento */
                        for (var e = 0; e < row.length; e++) {
                            var el = row[e];
                            var type = el.element.toLowerCase();
                            var text = el.text;
                            // console.log('\telemento ' + e, type, text);

                            /* Parola */
                            var words = text.split(' ');
                            for (var w = 0; w < words.length; w++) {
                                // console.log('\t\tword ' + w, words[w]);
                                $('<' + type + ' class="splitted-word"></' + type + '>').appendTo($('.splitted-row:last'), element);

                                /* Lettera */
                                var word = words[w];
                                var letters = word.split('');
                                for (var l = 0; l < letters.length; l++) {
                                    // console.log('\t\t\tlettera' + l, letters[l]);
                                    var letter = letters[l];
                                    $('<span class="splitted-letter" data-content="' + letter + '">' + letter + '</span>').appendTo($('.splitted-word:last'), element);
                                }
                                $('<span class="splitted-space">&nbsp;</span>').appendTo($('.splitted-word:last'), element);
                            }
                        }
                    }
                }

                setTimeout(function() {
                    splitText();
                }, 1);

            }
        };
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('yearsFrom', [function() {
        return {
            restrict: 'A',
            scope: {
                from: '=yearsFrom',
                to: '=yearsTo',
            },
            link: function(scope, element, attributes) {

                function onChangeYears() {
                    // console.log('onChangeYears', scope.from, scope.to);

                    var yearFrom = element.find('.tunnel-year__from'),
                        yearTo = element.find('.tunnel-year__to'),
                        time = 2,
                        easing = Power3.easeOut,
                        years = {
                            from: yearFrom.html(),
                            to: yearTo.html()
                        };

                    if (scope.to) {
                        element.removeClass('one-year');
                        TweenLite.to(years, time, { to: scope.to, roundProps: 'year', onUpdate: updateYear, ease: easing });
                    } else {
                        element.addClass('one-year');
                        TweenLite.to(years, time, { to: scope.from, roundProps: 'year', onUpdate: updateYear, ease: easing });
                    }

                    TweenLite.to(years, time, { from: scope.from, roundProps: 'year', onUpdate: updateYear, ease: easing });

                    function updateYear() {
                        yearFrom.html(parseInt(years.from));
                        yearTo.html(parseInt(years.to));
                    }
                }

                scope.$watch('from', function(newValue, oldValue) {
                    if (newValue) {
                        onChangeYears();
                    }
                });

            }
        };
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('YearsCtrl', ['$scope', '$route', '$routeParams', '$ngSilentLocation', 'SceneOptions', 'StepperService', 'AnalyserService', 'DatGui', '$timeout', function($scope, $route, $routeParams, $ngSilentLocation, SceneOptions, StepperService, AnalyserService, DatGui, $timeout) {

        var scene = {
            objects: {},
            options: SceneOptions,
            stepper: StepperService,
        };

        var objects = scene.objects;
        var options = scene.options;
        var stepper = scene.stepper;

        stepper.init($routeParams.yearsKey).then(function() {
            $scope.scene = scene;
            $scope.stepper = stepper;
            $scope.audio = AnalyserService;
            if ($route.current.$$route.originalPath.indexOf('/detail') !== -1) {
                $timeout(function() {
                    openDetail();
                });
            }
            var gui = new DatGui();
        });

        var detail = {};

        function openDetail() {
            $ngSilentLocation.silent(stepper.step.detailUrl);
            detail.active = true;
            return false;
        }

        function closeDetail() {
            $ngSilentLocation.silent(stepper.step.url);
            detail.active = false;
            return false;
        }

        $scope.detail = detail;
        $scope.openDetail = openDetail;
        $scope.closeDetail = closeDetail;

        $scope.$on('onStepChanged', function() {
            $ngSilentLocation.silent(stepper.step.url);
        });

        // console.log('YearsCtrl', $route, $routeParams);

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('AnalyserService', ['$rootScope', '$timeout', '$q', '$http', 'SceneOptions', 'StepperService', function($rootScope, $timeout, $q, $http, SceneOptions, StepperService) {

        var service = this;
        var options = SceneOptions;
        var stepper = StepperService;

        var analyser, audio, audioUrl;

        var audioContext = (window.AudioContext || window.webkitAudioContext);

        audio = new Audio();
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        var source = null;

        function onCanPlay() {
            // console.log('AnalyserService.onCanPlay');
            if (!source) {
                var bufferLength;
                var ctx = new audioContext();
                if (ctx) {
                    analyser = ctx.createAnalyser();
                    source = ctx.createMediaElementSource(audio);
                    source.smoothingTimeConstant = 0.85;
                    source.connect(analyser);
                    source.connect(ctx.destination);
                    analyser.fftSize = options.audio.bands * 2;
                    bufferLength = analyser.frequencyBinCount;
                    service.data = new Uint8Array(bufferLength);
                }
            }
            // return service.data;
        }

        function onPlay() {
            $timeout(function() {
                service.playing = true;
                // console.log('AnalyserService.onPlay', service);
            });
        }

        function onPause() {
            $timeout(function() {
                service.playing = false;
                // console.log('AnalyserService.onPause', service);
            });
        }

        function onEnded() {
            $timeout(function() {
                service.playing = false;
                // console.log('AnalyserService.onEnded', service);
            });
        }

        function setAudioUrl($audioUrl) {
            if (audioUrl !== $audioUrl) {
                audioUrl = $audioUrl;
                if (audioUrl) {
                    audio.src = $audioUrl;
                    audio.volume = options.audio.volume;
                    // console.log('AnalyserService.setAudioUrl', $audioUrl);
                    play();
                }
            }
        }

        function play() {
            if (service.active && audioUrl && !isPlaying()) {
                audio.play();
            }
        }

        function pause() {
            if (audioUrl && isPlaying()) {
                audio.pause();
            }
        }

        function isActive() {
            // console.log('isActive', service.active, isPlaying());
            return service.active && isPlaying();
        }

        function isPlaying() {
            return !audio.paused && !audio.ended; //  && audio.currentTime > 0;
        }

        function toggle() {
            service.active = !service.active;
            if (service.active) {
                play();
            } else {
                pause();
            }
        }

        function setStep() {
            var step = stepper.getCurrentStep();
            setAudioUrl(step.audio ? step.audio.url : null);
        }

        function update() {
            if (service.data) {
                analyser.getByteFrequencyData(service.data);
            }
        }

        service.unlocked = false;

        function unlock() {
            var deferred = $q.defer();
            if (!options.device.ios || service.unlocked) {
                deferred.resolve();
            } else {
                var o = doUnlock();
                // by checking the play state after some time, we know if we're really unlocked
                $timeout(function() {
                    if (o && (o.playbackState === o.PLAYING_STATE || o.playbackState === o.FINISHED_STATE)) {
                        service.unlocked = true;
                        deferred.resolve();
                    }
                });
            }
            console.log('AudioAnalyser.unlock');
            return deferred.promise;
        }

        function doUnlock() {
            // create empty buffer
            var o = null;
            var ctx = new audioContext();
            if (ctx) {
                o = ctx.createBufferSource();
                var buffer = ctx.createBuffer(1, 1, 22050);
                o.buffer = buffer;
                // connect to output (your speakers)
                o.connect(ctx.destination);
                // play the file
                if (o.noteOn) {
                    o.noteOn(0);
                }
                console.log('AudioAnalyser.doUnlock');
            }
            return o;
        }

        window.addEventListener('touchstart', unlock, false);

        $rootScope.$on('onStepChanged', function($scope) {
            setStep();
        });

        $rootScope.$on('onOptionsChanged', function($scope) {
            audio.volume = options.audio.volume;
        });

        this.active = true;
        this.data = null;
        this.audio = audio;
        this.update = update;
        this.play = play;
        this.pause = pause;
        this.toggle = toggle;
        this.unlock = unlock;
        this.isPlaying = isPlaying;
        this.isActive = isActive;

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('MotionService', ['$rootScope', function($rootScope) {

        var service = this;

        service.x = 0;
        service.y = 0;
        service.z = 0;

        service.update = update;

        function set(x, y, z) {
            service.x = x;
            service.y = y;
            service.z = z;
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
                var x = (e.alpha) / 90;
                var y = (e.beta - 90) / 90;
                var z = (e.gamma) / 90;
                // console.log('onDeviceOrientation', x, y, z);
                set(x, y, z);
            }
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

        // world (compass), game (non compass)

        if (window.DeviceOrientationEvent) {
            var orientation = FULLTILT.getDeviceOrientation({ 'type': 'game' }).then(function(controller) {
                service.device = controller;
            }).catch(function(error) {
                console.log('MotionService.getDeviceOrientation', error);
            });
            // window.addEventListener("deviceorientation", onDeviceOrientation, true);
        } else if (window.DeviceMotionEvent) {
            var motion = FULLTILT.getDeviceMotion({ 'type': 'game' }).then(function(controller) {
                service.device = controller;
            }).catch(function(error) {
                console.log('MotionService.getDeviceOrientation', error);
            });
            // window.addEventListener('devicemotion', onDeviceMotion, true);
        }

    }]);

}());
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
                var $active = $('.tunnel-nav__step.active'),
                    position = $active.position().top,
                    width = $active.width() + 16;
                $('.tunnel-nav__follower').css({ width: width + 'px', '-webkit-transform': 'translateY(' + position + 'px)', '-moz-transform': 'translateY(' + position + 'px)', '-ms-transform': 'translateY(' + position + 'px)', 'transform': 'translateY(' + position + 'px)' });
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
            var contrast = (pow > 186) ? 'light-bg' : 'dark-bg';
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
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('scene', ['SceneOptions', 'StepperService', 'AnalyserService', 'MotionService', function(SceneOptions, StepperService, AnalyserService, MotionService) {
        return {
            restrict: 'A',
            scope: {
                data: '=scene',
            },
            link: function(scope, element, attributes) {
                var data = scope.data;
                if (!data) {
                    return;
                }

                var objects = data.objects;
                var options = SceneOptions;
                var stepper = StepperService;
                var analyser = AnalyserService;

                var stats, scene, camera, shadow, back, light, renderer, width, height, w2, h2;
                var controls = null;

                scope.$on('onStepChanged', function($scope, step) {
                    // console.log('onStepChanged', step.current);
                    var circle = null;
                    var current = step.current,
                        previous = step.previous;
                    if (current > 0) {
                        circle = objects.circles[current] || getObjectCircles(current);
                        circle.add();
                    }
                    objects.circles[current] = circle;
                    setTimeout(function() {
                        if (stepper.current !== previous && previous > 0) {
                            var circle = objects.circles[previous];
                            if (circle) {
                                circle.remove();
                            }
                        }
                    }, stepper.duration * 1000);
                    // console.log('objects', objects);                    
                });

                scope.$on('onOptionsChanged', function($scope) {
                    // optionsChanged
                });

                var mouse = { x: 0, y: 0 };
                // var mouseDown = { x: 0, y: 0 };
                var parallax = { x: 0, y: 0, i: 0 };
                var motion = MotionService;
                var translate = { x: 0, y: 0 };
                var friction = 1 / 12;

                function updateParallax() {

                    if (options.device.mobile) {
                        motion.update();
                        parallax.x = (motion.x * 20);
                        parallax.y = (motion.y * 20);
                    } else {
                        parallax.x = (mouse.x * 20);
                        parallax.y = (mouse.y * 20);
                    }

                    var x = parallax.x / 4;
                    var y = parallax.y / 4;

                    translate.x += (x - translate.x) * friction;
                    translate.y += (y - translate.y) * friction;

                    if ($('.detail-active').length == 0) {
                        var translateYear = 'translate(' + (translate.x * -4) + 'px, ' + (translate.y * -2) + 'px)';
                        $('.tunnel-year').css({
                            '-webit-transform': translateYear,
                            '-moz-transform': translateYear,
                            'transform': translateYear
                        });
                    }

                    var translateSlick = 'translate(' + translate.x + 'px, ' + translate.y + 'px)';
                    $('.tunnel-slick .slick-active .tunnel-slick__item').css({
                        '-webit-transform': translateSlick,
                        '-moz-transform': translateSlick,
                        'transform': translateSlick
                    });

                    parallax.x += Math.cos(parallax.i / 100) * 10;
                    parallax.y += Math.sin(parallax.i / 100) * 10;

                    parallax.i++;
                }

                createScene();
                // createLights();
                createObjects();
                addListeners();
                loop();

                function createScene() {
                    width = window.innerWidth;
                    height = window.innerHeight;
                    w2 = width / 2;
                    h2 = height / 2;

                    var ratio = width / height;
                    var fov = 30;
                    var near = 1;
                    var far = 20000;

                    scene = new THREE.Scene();
                    // scene.fog = new THREE.Fog(0x000000, 250, 800);

                    camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
                    /*
                    camera.position.z = 100;
                    camera.position.y = -500;
                    camera.lookAt(new THREE.Vector3(0, 0, 0));
                    */

                    renderer = new THREE.WebGLRenderer({
                        alpha: true,
                        antialias: true,
                        logarithmicDepthBuffer: true
                    });

                    renderer.setClearColor(0x000000, 0); // the default
                    renderer.setSize(width, height);
                    renderer.sortObjects = false; // avoid flickering effect
                    // renderer.shadowMap.enabled = true;

                    stats = new Stats();
                    element[0].appendChild(renderer.domElement);
                    element[0].appendChild(stats.dom);
                }

                function createLights() {
                    light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
                    shadow = new THREE.DirectionalLight(0xffffff, 0.8);
                    shadow.position.set(200, 200, 200);
                    shadow.castShadow = true;
                    // shadow.shadowDarkness = .2;
                    back = new THREE.DirectionalLight(0xffffff, 0.4);
                    back.position.set(-100, 200, 50);
                    // back.shadowDarkness = .2;
                    back.castShadow = true;
                    scene.add(light);
                    scene.add(shadow);
                    scene.add(back);
                }

                function createObjects() {
                    objects.ribbon = getObjectRibbon();
                    objects.circles = new Array(stepper.steps).fill(null);
                }

                function getObjectRibbon() {

                    var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

                    var material = new MeshLineMaterial({
                        color: stepper.values.lines,
                        lineWidth: 5,
                        opacity: 0.8,
                        transparent: true,
                        depthTest: false,
                        sizeAttenuation: true,
                        resolution: resolution,
                        near: camera.near,
                        far: camera.far,
                        // blending: THREE.AdditiveBlending,
                        // side: THREE.DoubleSide,
                    });

                    var prev = new THREE.Vector3();
                    var points = new Array(options.ribbon.points).fill(null).map(function() {
                        var p = new THREE.Vector3().copy(prev);
                        prev.x += getRandomRange(500, 1000, true);
                        prev.y += getRandomRange(10, 40, true);
                        prev.z += getRandomRange(1000, 2000, false);
                        return p;
                    });

                    var spline = new THREE.CatmullRomCurve3(points);
                    spline.type = 'catmullrom';
                    spline.closed = false;

                    var cameraSpline = new THREE.CatmullRomCurve3(spline.points.map(function(p) {
                        return new THREE.Vector3(p.x, p.y + 20, p.z);
                    }));
                    cameraSpline.type = 'catmullrom';
                    cameraSpline.closed = false;

                    var geometry = new THREE.Geometry();
                    geometry.vertices = spline.getPoints(options.ribbon.vertices);

                    var line = new MeshLine();
                    line.setGeometry(geometry);
                    // line.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
                    // line.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
                    // line.setGeometry(geometry, function(p) { return 2 + Math.sin(50 * p); }); // makes width sinusoidal

                    var object = new THREE.Mesh(line.geometry, material);
                    add();

                    function add() {
                        // console.log('objects.ribbon.add');
                        scene.add(object);
                    }

                    function remove() {
                        // console.log('objects.ribbon.remove');
                        scene.remove(object);
                    }

                    camera.target = camera.target || new THREE.Vector3(0, 0, 0);

                    function updateRibbon() {
                        var s = (1 / stepper.steps.length);
                        var c = s * 0.1;
                        var cpow = stepper.values.pow;
                        var tpow = (cpow + c).mod(1);
                        var step = stepper.getCurrentStep();
                        var position = cameraSpline.getPointAt(cpow);
                        position.y += stepper.values.cameraHeight;

                        // object.material.uniforms.visibility.value = Math.min(1.0, stepper.values.pow + s); // riattivare?
                        // object.material.uniforms.lineWidth.value = 5;

                        var target = cameraSpline.getPointAt(tpow);
                        target.y += stepper.values.targetHeight;
                        // var tangent = cameraSpline.getTangent(tpow).normalize().multiplyScalar(100);
                        // target.add(tangent);
                        camera.position.copy(position);
                        camera.target.copy(target);
                        camera.position.x += (position.x + parallax.x - camera.position.x) * friction;
                        camera.position.y += (position.y + parallax.y - camera.position.y) * friction;
                        camera.lookAt(camera.target);
                    }

                    return {
                        object: object,
                        spline: spline,
                        cameraSpline: cameraSpline,
                        geometry: geometry,
                        material: material,
                        add: add,
                        remove: remove,
                        update: updateRibbon,
                    };
                }

                function getObjectCircles(index) {

                    var noiseMap1 = getPerlinNoise(options.circle.points, options.circle.lines);
                    var noiseMap2 = getPerlinNoise(options.circle.points, options.circle.lines);

                    var geometry, object, circles = [];

                    var ln = options.circle.lines,
                        pn = options.circle.points;

                    var step = stepper.getStepAtIndex(index);

                    var texture = new THREE.TextureLoader().load(step.circle.texture);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);

                    var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

                    var material = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        map: texture,
                        transparent: true,
                    });

                    var material1 = new THREE.LineBasicMaterial({
                        color: stepper.values.lines,
                        transparent: true,
                    });

                    var material2 = new THREE.LineBasicMaterial({
                        color: stepper.values.overLines,
                        transparent: true,
                    });

                    var materialLine1 = new MeshLineMaterial({
                        color: stepper.values.lines,
                        lineWidth: 1.0,
                        depthTest: false,
                        opacity: 1,
                        transparent: true,
                        resolution: resolution,
                        near: camera.near,
                        far: camera.far,
                    });

                    var materialLine2 = new MeshLineMaterial({
                        color: stepper.values.overLines,
                        lineWidth: 1.0,
                        depthTest: false,
                        opacity: 1,
                        transparent: true,
                        resolution: resolution,
                        near: camera.near,
                        far: camera.far,
                    });

                    object = new THREE.Object3D();

                    var points1 = [],
                        points2 = [],
                        meshLines1 = [],
                        meshLines2 = [],
                        meshLineGeometries1 = [],
                        meshLineGeometries2 = [],
                        useMeshLines = false;

                    var dummy = new THREE.Object3D();
                    object.add(dummy);

                    // circle
                    geometry = new THREE.PlaneGeometry(options.circle.radius * 2 - 20, options.circle.radius * 2 - 20, 8, 8);
                    var plane = new THREE.Mesh(geometry, material);
                    plane.position.z = -30;
                    dummy.add(plane);
                    // circle

                    var group1 = new THREE.Object3D();
                    dummy.add(group1);

                    var group2 = new THREE.Object3D();
                    dummy.add(group2);

                    var lines1 = new Array(ln).fill(null).map(getLine1);
                    var lines2 = new Array(ln).fill(null).map(getLine2);

                    var state = {
                        pow: 0,
                        enabled: false,
                        adding: false,
                        removing: false,
                    };

                    var to = null;

                    function add() {
                        // console.log('objects.circles.add');
                        scene.add(object);
                        state.adding = Date.now();
                        state.removing = false;
                        state.enabled = true;
                        if (state.tween) {
                            state.tween.kill();
                        }
                        state.tween = TweenLite.to(state, 2.000, {
                            pow: 1,
                            delay: 0,
                            ease: Elastic.easeOut.config(1, 0.3),
                            onComplete: function() {
                                state.adding = false;
                            },
                        });
                    }

                    function remove() {
                        // console.log('objects.circles.remove');
                        state.adding = false;
                        state.removing = Date.now();
                        if (state.tween) {
                            state.tween.kill();
                        }
                        state.tween = TweenLite.to(state, 0.350, {
                            pow: 0,
                            delay: 0,
                            ease: Power2.easeOut,
                            onComplete: function() {
                                state.removing = false;
                                state.enabled = false;
                                scene.remove(object);
                            },
                        });
                    }

                    var iterator = 0;

                    function getLine1(v, i) {
                        var geometry = new THREE.Geometry();
                        var points = addPoints(geometry, i, 1);
                        points1.push(points);
                        var line = null;
                        if (useMeshLines) {
                            var meshLine = new MeshLine();
                            meshLine.setGeometry(geometry);
                            meshLineGeometries1.push(geometry);
                            meshLines1.push(meshLine);
                            // meshLine.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
                            // meshLine.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
                            // meshLine.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal
                            line = new THREE.Mesh(meshLine.geometry, materialLine1);
                        } else {
                            line = new THREE.LineLoop(geometry, material1.clone());
                            // var spline = new THREE.CatmullRomCurve3(points);
                            // circle.spline = spline;
                        }
                        group1.add(line);
                        return line;
                    }

                    function getLine2(v, i) {
                        var geometry = new THREE.Geometry();
                        var points = addPoints(geometry, i, 2);
                        points2.push(points);
                        var line = null;
                        if (useMeshLines) {
                            var meshLine = new MeshLine();
                            meshLine.setGeometry(geometry);
                            meshLineGeometries2.push(geometry);
                            meshLines2.push(meshLine);
                            // meshLine.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
                            // meshLine.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
                            // meshLine.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal
                            line = new THREE.Mesh(meshLine.geometry, materialLine2);
                        } else {
                            line = new THREE.LineLoop(geometry, material2.clone());
                            // var spline = new THREE.CatmullRomCurve3(points);
                            // circle.spline = spline;
                        }
                        group2.add(line);
                        return line;
                    }

                    function addPoints(geometry, l, g) {
                        var points = new Array(pn).fill(null).map(function(v, i) {
                            var ratio = i / pn;
                            var degrees = 360 * ratio; // point degrees;
                            degrees += 60 * index; // circle offset;
                            degrees += 30 * g; // group offset;
                            degrees += (360 / pn * 0.1) * l; // line offset;
                            var radians = degrees * Math.PI / 180;
                            var radius = options.circle.radius;
                            var increment = 0;
                            if (g === 1) {
                                increment += (l * l * l * 0.005);
                            } else {
                                increment += (l * l * l * 0.005);
                            }
                            v = new THREE.Vector3();
                            v.sincos = {
                                base: radius,
                                increment: increment,
                                radius: radius,
                                x: Math.cos(radians),
                                y: Math.sin(radians),
                            };
                            geometry.vertices.push(v);
                            return v;
                        });
                        geometry.vertices.push(points[0]);
                        return points;
                    }

                    function updateLine(geometry, vertices, l, g) {
                        var audioStrength = options.audioStrength,
                            noiseStrength = options.noiseStrength,
                            circularStrength = options.circularStrength,
                            noiseMap = g === 1 ? noiseMap1 : noiseMap2,
                            data = analyser.data;

                        angular.forEach(vertices, function(v, i) {
                            var bands = options.audio.bands;
                            var aia = i % bands;
                            var aib = (pn - 1 - i) % bands;
                            var audioPow = data ? ((data[aia] + data[aib]) / 2) / bands : 0;
                            // var audioPow = data[aia] / bands;

                            var ni = 0; // iterator;

                            var nd = g === 1 ? 0 : 64;
                            var nia = l * pn + ((i + nd + ni) % pn);
                            var nib = l * pn + (((pn - 1 - i - nd) + ni) % pn);
                            var noisePow = (noiseMap[nia] + noiseMap[nib]) / 2 / 64;

                            var linePow = 1 - ((ln - l) / ln * circularStrength);

                            var radius = v.sincos.base +
                                (v.sincos.increment * noisePow) +
                                (v.sincos.increment * audioPow) +
                                (noiseStrength * noisePow) * linePow +
                                (audioStrength * audioPow) * linePow +
                                // (audioStrength * (3 - g) * audioPow * (l * 0.1)) * linePow +
                                0;

                            v.sincos.radius = radius;
                            // v.sincos.radius += (radius - v.sincos.radius) / 2;

                            v.x = v.sincos.x * v.sincos.radius;
                            v.y = v.sincos.y * v.sincos.radius;
                            v.z = 10 * g + l * 0.01; // -l;
                            // console.log(v.sincos.radius);
                        });

                        geometry.verticesNeedUpdate = true;

                        /*
                        var f = 0;
                        var l = pn - 1;
                        var first = new THREE.Vector3().copy(vertices[f]);
                        var last = new THREE.Vector3().copy(vertices[l]);
                        vertices[f].add(new THREE.Vector3().subVectors(first, last).multiplyScalar(0.5));
                        vertices[l].add(new THREE.Vector3().subVectors(first, last).multiplyScalar(-0.5));
                        
                        lines.forEach( function( l, i ) {
                        if( params.animateWidth ) l.material.uniforms.lineWidth.value = params.lineWidth * ( 1 + .5 * Math.sin( 5 * t + i ) );
                        if( params.autoRotate ) l.rotation.y += .125 * delta;
                        l.material.uniforms.visibility.value= params.animateVisibility ? (time/3000) % 1.0 : 1.0;
                        
                        if (iterator === 60 && g === 2 && l === 0) {
                            // console.log('vertices', geometry.vertices.map(function(v) { return v.x + ',' + v.y; }));
                        }
                        */
                    }

                    var dummyMobilePosition = new THREE.Vector3(0, 100, 0);

                    function updateCircle() {

                        material.opacity = state.pow;
                        // material1.opacity = state.pow;
                        // material2.opacity = state.pow;
                        // material1.color = stepper.values.lines;
                        // material2.color = stepper.values.overLines;

                        // console.log(stepper.values.overLines);

                        // if (useMeshLines) {
                        //    materialLine1.uniforms.lineWidth.value = state.pow;
                        //    materialLine2.uniforms.lineWidth.value = state.pow;
                        // }

                        angular.forEach(lines1, function(line, l) {
                            updateLine(line.geometry, points1[l], l, 1);
                            line.material.opacity = (0.0 + (1.0 * l / ln)) * state.pow;
                            line.material.color = stepper.values.lines;
                            // line.geometry.colorsNeedUpdate = true;
                            if (useMeshLines) {
                                meshLines1[l].setGeometry(meshLineGeometries1[l]);
                            }
                        });

                        angular.forEach(lines2, function(line, l) {
                            updateLine(line.geometry, points2[l], l, 2);
                            line.material.opacity = (0.0 + (1.0 * l / ln)) * state.pow;
                            line.material.color = stepper.values.overLines;
                            // line.geometry.colorsNeedUpdate = true;
                            if (useMeshLines) {
                                meshLines2[l].setGeometry(meshLineGeometries2[l]);
                            }
                        });

                        group1.rotation.z += 0.001;
                        group2.rotation.z -= 0.001;

                        if (width > 1023) {
                            dummy.position.copy(step.circle.position);
                        } else {
                            dummy.position.copy(dummyMobilePosition);
                        }

                        dummy.rotation.x += ((parallax.y * 0.00625) - dummy.rotation.x) * friction;
                        dummy.rotation.y += ((parallax.x * 0.01250) - dummy.rotation.y) * friction;

                        var position = objects.ribbon.cameraSpline.getPointAt((index + 0.1) / stepper.steps.length);
                        // var tangent = objects.ribbon.cameraSpline.getTangent(index + 0.1 / stepper.steps.length).normalize().multiplyScalar(300);
                        // position.add(tangent);

                        position.y += stepper.values.targetHeight;
                        object.position.copy(position);

                        // object.position.x += (position.x + Math.random() * 20 - object.position.x) / 40;
                        // object.position.y += (position.y + Math.random() * 20 - object.position.y) / 40;
                        // object.position.z += (position.z + Math.random() * 20 - object.position.z) / 40;

                        object.scale.x = object.scale.y = object.scale.z = 0.001 + 0.14 * state.pow;
                        object.lookAt(camera.position);

                        // iterator++;
                    }

                    return {
                        add: add,
                        remove: remove,
                        object: object,
                        state: state,
                        update: updateCircle,
                    };
                }

                function render() {
                    updateParallax();
                    analyser.update();
                    if (controls) {
                        controls.update();
                    }
                    if (objects.ribbon) {
                        objects.ribbon.update();
                    }
                    angular.forEach(objects.circles, function(circle) {
                        if (circle && circle.state.enabled) {
                            circle.update();
                        }
                    });
                    renderer.render(scene, camera);
                }

                function loop() {
                    stats.begin();
                    render();
                    stats.end();
                    requestAnimationFrame(loop);
                }

                function addListeners() {

                    function onWindowResize() {
                        width = window.innerWidth;
                        height = window.innerHeight;
                        w2 = width / 2;
                        h2 = height / 2;
                        renderer.setSize(width, height);
                        camera.aspect = width / height;
                        camera.updateProjectionMatrix();
                    }

                    function handleMouseMove(event) {
                        var halfW = window.innerWidth / 2;
                        var halfH = window.innerHeight / 2;
                        mouse.x = (event.clientX - halfW) / halfW;
                        mouse.y = (event.clientY - halfH) / halfH;
                    }

                    window.addEventListener('resize', onWindowResize, false);
                    document.addEventListener('mousemove', handleMouseMove, false);

                    /*
                    

                    function handleMouseDown(event) {
                        //
                    }

                    function handleMouseUp(event) {
                        //
                    }

                    function handleTouchStart(event) {
                        if (event.touches.length > 1) {
                            event.preventDefault();
                            mouseDown = { x: event.touches[0].pageX, y: event.touches[0].pageY };
                        }
                    }

                    function handleTouchEnd(event) {
                        mouseDown = { x: windowHalfX, y: windowHalfY };
                    }

                    function handleTouchMove(event) {
                        if (event.touches.length == 1) {
                            event.preventDefault();
                            mouseDown = { x: event.touches[0].pageX, y: event.touches[0].pageY };
                        }
                    }
                    */
                    /*
                    document.addEventListener('mousedown', handleMouseDown, false);
                    document.addEventListener('mouseup', handleMouseUp, false);
                    document.addEventListener('touchstart', handleTouchStart, false);
                    document.addEventListener('touchend', handleTouchEnd, false);
                    document.addEventListener('touchmove', handleTouchMove, false);
                    */
                }

            }
        };
    }]);

    Number.prototype.mod = function(n) {
        return ((this % n) + n) % n;
    };

    function getPerlinNoise(width, height) {
        var size = width * height,
            data = new Uint8Array(size),
            perlin = new ImprovedNoise(),
            quality = 1,
            z = Math.random() * 100;
        for (var j = 0; j < 4; j++) {
            for (var i = 0; i < size; i++) {
                var x = i % width,
                    y = ~~(i / width);
                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
            }
            quality *= 5;
        }
        return data;
    }

    function ImprovedNoise() {
        var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,
            23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
            174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
            133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
            89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5,
            202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
            248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
            178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
            14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
            93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ];
        for (var i = 0; i < 256; i++) {
            p[256 + i] = p[i];
        }

        function fade(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }

        function lerp(t, a, b) {
            return a + t * (b - a);
        }

        function grad(hash, x, y, z) {
            var h = hash & 15;
            var u = h < 8 ? x : y,
                v = h < 4 ? y : h == 12 || h == 14 ? x : z;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        }

        return {
            noise: function(x, y, z) {
                var floorX = Math.floor(x),
                    floorY = Math.floor(y),
                    floorZ = Math.floor(z);
                var X = floorX & 255,
                    Y = floorY & 255,
                    Z = floorZ & 255;
                x -= floorX;
                y -= floorY;
                z -= floorZ;
                var xMinus1 = x - 1,
                    yMinus1 = y - 1,
                    zMinus1 = z - 1;
                var u = fade(x),
                    v = fade(y),
                    w = fade(z);
                var A = p[X] + Y,
                    AA = p[A] + Z,
                    AB = p[A + 1] + Z,
                    B = p[X + 1] + Y,
                    BA = p[B] + Z,
                    BB = p[B + 1] + Z;
                return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
                            grad(p[BA], xMinus1, y, z)),
                        lerp(u, grad(p[AB], x, yMinus1, z),
                            grad(p[BB], xMinus1, yMinus1, z))),
                    lerp(v, lerp(u, grad(p[AA + 1], x, y, zMinus1),
                            grad(p[BA + 1], xMinus1, y, z - 1)),
                        lerp(u, grad(p[AB + 1], x, yMinus1, zMinus1),
                            grad(p[BB + 1], xMinus1, yMinus1, zMinus1))));

            }
        };
    }

    function getRandomRange(min, max, allowNegatives) {
        var n = -1 + Math.random() * 2;
        var a = Math.abs(n);
        var s = allowNegatives ? Math.floor(n / a) : 1;
        return s * (min + (max - min) * a);
    }

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    function mobilecheck() {
        var check = false;
        (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    }

    // For those wishing to include tablets in this test (though arguably, you shouldn't), you can use the following function:
    function mobileAndTabletcheck() {
        var check = false;
        (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    }

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var isMobile = mobilecheck();
    var isMobileAndTabled = mobileAndTabletcheck();

    app.constant('SceneOptions', {
        colors: {
            background: 0xeae8e8,
            lines: 0xb4bfdd,
            overLines: 0x3353a4,
        },
        camera: {
            cameraHeight: -10,
            targetHeight: 30,
        },
        ribbon: {
            steps: 12,
            points: 24,
            vertices: isMobileAndTabled ? 1200 : 2400,
        },
        circle: {
            position: new THREE.Vector3(),
            radius: 200,
            lines: 24,
            points: isMobileAndTabled ? 64 : 128,
        },
        audio: {
            volume: 0.9,
            bands: isMobileAndTabled ? 64 : 128,
        },
        audioStrength: 100,
        noiseStrength: 25,
        circularStrength: 0.90,
        useBackground: false,
        device: {
            mobile: isMobileAndTabled,
            ios: isIOS,
        }
    });

}());