/* global angular */

(function() {
    "use strict";

    var app = angular.module('app', ['ngRoute', 'ngSanitize', 'jsonFormatter']);

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

    app.config(['$locationProvider', function($locationProvider) {

        // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('');

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

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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

    app.service('AnalyserService', ['$rootScope', '$q', '$http', 'SceneOptions', 'StepperService', function($rootScope, $q, $http, SceneOptions, StepperService) {

        var service = this;
        var options = SceneOptions;
        var stepper = StepperService;

        var analyser, audio, audioUrl;

        var aContext = (window.AudioContext || window.webkitAudioContext);
        var analyserContext = new aContext();
        analyser = analyserContext.createAnalyser();

        audio = new Audio();
        audio.addEventListener('canplay', attachAnalyser);

        var source = null;

        function attachAnalyser() {
            if (!source) {
                var bufferLength;
                source = analyserContext.createMediaElementSource(audio);
                source.connect(analyser);
                source.connect(analyserContext.destination);
                analyser.fftSize = options.bands * 2;
                bufferLength = analyser.frequencyBinCount;
                service.data = new Uint8Array(bufferLength);
                console.log('AnalyserService.attachAnalyser');
            }
            return service.data;
        }

        function setAudioUrl($audioUrl) {
            if (audioUrl !== $audioUrl) {
                audioUrl = $audioUrl;
                audio.src = $audioUrl;
                audio.volume = options.audioVolume;
                console.log('AnalyserService.setAudioUrl', $audioUrl);
                audio.play();
            }
        }

        function play() {
            if (audio) {
                audio.play();
            }
        }

        function pause() {
            if (audio) {
                audio.pause();
            }
        }

        function toggle() {
            if (audio) {
                service.active = !service.active;
                if (service.active) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        }

        function setStep() {
            var step = stepper.getCurrentStep();
            setAudioUrl(step.audio.url);
        }

        function update() {
            if (service.data) {
                analyser.getByteFrequencyData(service.data);
            }
        }

        $rootScope.$on('onStepChanged', function($scope) {
            setStep();
        });

        $rootScope.$on('onOptionsChanged', function($scope) {
            if (audio) {
                audio.volume = options.audioVolume;
            }
        });

        this.active = true;
        this.audio = audio;
        this.data = null;
        this.update = update;
        this.play = play;
        this.pause = pause;
        this.toggle = toggle;

    }]);

    app.directive('scene', ['SceneOptions', 'StepperService', 'AnalyserService', function(SceneOptions, StepperService, AnalyserService) {
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

                options.noiseMap = getPerlinNoise(options.points, options.lines);

                var stats, scene, camera, shadow, back, light, renderer, width, height, w2, h2;
                var controls = null;

                scope.$on('onStepChanged', function($scope, step) {
                    console.log('onStepChanged', step.current);
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
                    console.log('objects', objects);
                });

                scope.$on('onOptionsChanged', function($scope) {
                    // renderer.setClearColor(stepper.values.background, 1);
                    if (objects.ribbon) {
                        objects.ribbon.updateMaterial();
                    }
                    angular.forEach(objects.circles, function(circle) {
                        if (circle) {
                            circle.updateMaterial();
                        }
                    });
                });

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
                    var near = 0.001;
                    var far = 20000;

                    scene = new THREE.Scene();
                    // scene.fog = new THREE.Fog(0x000000, 300, 1000);

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
                    // renderer.setClearColor(stepper.values.background, 1);
                    renderer.setSize(width, height);
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
                    var material = getMaterial();

                    var prev = new THREE.Vector3();
                    var points = new Array(options.ribbon.points).fill(null).map(function() {
                        var p = new THREE.Vector3().copy(prev);
                        prev.x += getRandomRange(500, 1000, true);
                        prev.y += getRandomRange(5, 20, true);
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
                    // line.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal

                    var object = new THREE.Mesh(line.geometry, material);
                    add();

                    function add() {
                        console.log('objects.ribbon.add');
                        scene.add(object);
                    }

                    function remove() {
                        console.log('objects.ribbon.remove');
                        scene.remove(object);
                    }

                    camera.target = camera.target || new THREE.Vector3(0, 0, 0);

                    function updateRibbon() {
                        var c = (1 / stepper.steps.length) * 0.1;
                        var cpow = stepper.values.pow;
                        var tpow = (cpow + c).mod(1);
                        var step = stepper.getCurrentStep();
                        var position = cameraSpline.getPointAt(cpow);
                        position.y += stepper.values.cameraHeight;
                        var target = cameraSpline.getPointAt(tpow);
                        target.y += stepper.values.targetHeight;
                        // var tangent = cameraSpline.getTangent(tpow).normalize().multiplyScalar(100);
                        // target.add(tangent);
                        camera.position.copy(position);
                        camera.target.copy(target);
                        camera.lookAt(camera.target);
                    }

                    function getMaterial() {
                        var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
                        return new MeshLineMaterial({
                            color: stepper.values.lines,
                            lineWidth: 5,
                            depthTest: true,
                            /*
                            opacity: 1,
                            resolution: resolution,
                            sizeAttenuation: 1,
                            near: 1,
                            far: 1000,
                            blending: THREE.AdditiveBlending,
                            transparent: false,
                            side: THREE.DoubleSide,
                            */
                        });
                    }

                    function updateRibbonMaterial() {
                        // !!! non va bene
                        objects.ribbon.material = getMaterial();
                        objects.ribbon.object.material = objects.ribbon.material;
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
                        updateMaterial: updateRibbonMaterial,
                    };
                }

                function getObjectCircles(index) {
                    var geometry, object, circles = [];

                    // materials
                    var material1 = new THREE.LineBasicMaterial({
                        color: stepper.values.lines,
                    });

                    var material2 = new THREE.LineBasicMaterial({
                        color: stepper.values.overLines,
                    });

                    var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

                    object = new THREE.Object3D();

                    var points1 = [],
                        points2 = [],
                        meshLines1 = [],
                        meshLines2 = [],
                        meshLineGeometries1 = [],
                        meshLineGeometries2 = [],
                        useMeshLines = false;

                    var pn = options.points,
                        ln = options.lines;

                    var dummy = new THREE.Object3D();
                    object.add(dummy);

                    // circle
                    var step = stepper.steps[index];
                    var texture = new THREE.TextureLoader().load(step.circle.texture);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        map: texture,
                        transparent: true,
                    });
                    geometry = new THREE.PlaneGeometry(options.radius * 2 - 20, options.radius * 2 - 20, 8, 8);
                    var plane = new THREE.Mesh(geometry, material);
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
                        duration: 0.350,
                        enabled: false,
                        adding: false,
                        removing: false,
                    };

                    var to = null;

                    function add() {
                        console.log('objects.circles.add');
                        scene.add(object);
                        state.adding = Date.now();
                        state.removing = false;
                        state.enabled = true;
                        if (state.tween) {
                            state.tween.kill();
                        }
                        state.tween = TweenLite.to(state, state.duration, {
                            pow: 1,
                            delay: 0,
                            ease: Power2.easeInOut,
                            onComplete: function() {
                                state.adding = false;
                            },
                        });
                    }

                    function remove() {
                        console.log('objects.circles.remove');
                        state.adding = false;
                        state.removing = Date.now();
                        if (state.tween) {
                            state.tween.kill();
                        }
                        state.tween = TweenLite.to(state, state.duration, {
                            pow: 0,
                            delay: 0,
                            ease: Power2.easeInOut,
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
                        var line = null;
                        line = new THREE.LineLoop(geometry, material1);
                        points1.push(points);
                        // var spline = new THREE.CatmullRomCurve3(points);
                        // circle.spline = spline;
                        group1.add(line);
                        return line;
                    }

                    function getLine2(v, i) {
                        var geometry = new THREE.Geometry();
                        var points = addPoints(geometry, i, 2);
                        var line = null;
                        line = new THREE.LineLoop(geometry, material2);
                        points2.push(points);
                        // var spline = new THREE.CatmullRomCurve3(points);
                        // circle.spline = spline;
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
                            var radius = options.radius;
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
                        return points;
                    }

                    function updateLine(geometry, vertices, l, g) {
                        var audioStrength = options.audioStrength,
                            noiseStrength = options.noiseStrength,
                            circularStrength = options.circularStrength,
                            data = analyser.data;

                        angular.forEach(vertices, function(v, i) {
                            var aia = i % options.bands;
                            var aib = (pn - 1 - i) % options.bands;
                            var audioPow = data ? ((data[aia] + data[aib]) / 2) / options.bands : 0;
                            // var audioPow = data[aia] / options.bands;

                            var nd = g === 1 ? 0 : 64;
                            var nia = l * pn + ((i + nd + iterator) % pn);
                            var nib = l * pn + (((pn - 1 - i - nd) + iterator) % pn);
                            var noisePow = (options.noiseMap[nia] + options.noiseMap[nib]) / 2 / 64;

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
                            v.z = 0; // -l;
                            // console.log(v.sincos.radius);
                        });

                        /*
                        var f = 0;
                        var l = pn - 1;
                        var first = new THREE.Vector3().copy(vertices[f]);
                        var last = new THREE.Vector3().copy(vertices[l]);
                        vertices[f].add(new THREE.Vector3().subVectors(first, last).multiplyScalar(0.5));
                        vertices[l].add(new THREE.Vector3().subVectors(first, last).multiplyScalar(-0.5));
                        */

                        geometry.verticesNeedUpdate = true;

                        /*
                                    lines.forEach( function( l, i ) {
                        if( params.animateWidth ) l.material.uniforms.lineWidth.value = params.lineWidth * ( 1 + .5 * Math.sin( 5 * t + i ) );
                        if( params.autoRotate ) l.rotation.y += .125 * delta;
                      l.material.uniforms.visibility.value= params.animateVisibility ? (time/3000) % 1.0 : 1.0;
                                */
                        /*
                        if (iterator === 60 && g === 2 && l === 0) {
                            console.log('vertices', geometry.vertices.map(function(v) { return v.x + ',' + v.y; }));
                        }
                        */
                    }

                    function updateCircle() {
                        angular.forEach(lines1, function(line, l) {
                            updateLine(line.geometry, points1[l], l, 1);
                        });

                        angular.forEach(lines2, function(line, l) {
                            updateLine(line.geometry, points2[l], l, 2);
                        });

                        group1.rotation.z += 0.001;
                        group2.rotation.z -= 0.001;

                        var step = stepper.getStepAtIndex(index);
                        dummy.position.copy(step.circle.position);

                        var position = objects.ribbon.cameraSpline.getPointAt((index + 0.1) / stepper.steps.length);
                        // var tangent = objects.ribbon.cameraSpline.getTangent(index + 0.1 / stepper.steps.length).normalize().multiplyScalar(300);
                        // position.add(tangent);

                        position.y += stepper.values.targetHeight;
                        object.position.copy(position);

                        /*
                        object.position.x += (position.x + Math.random() * 20 - object.position.x) / 20;
                        object.position.y += (position.y + Math.random() * 20 - object.position.y) / 20;
                        object.position.z += (position.z + Math.random() * 20 - object.position.z) / 20;
                        */

                        object.scale.x = object.scale.y = object.scale.z = 0.001 + 0.1 * state.pow;
                        object.lookAt(camera.position);

                        updateCircleMaterial();

                        // iterator++;
                    }

                    function updateCircleMaterial() {
                        material1.color = stepper.values.lines;
                        material2.color = stepper.values.overLines;
                    }

                    return {
                        add: add,
                        remove: remove,
                        object: object,
                        state: state,
                        update: updateCircle,
                        updateMaterial: updateCircleMaterial,
                    };
                }

                function render() {
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

                // var mouse = { x: 0, y: 0 };
                // var mousePos = { x: 0, y: 0 };

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
                    window.addEventListener('resize', onWindowResize, false);
                    /*
                    function handleMouseMove(event) {
                        mouse = { x: event.clientX, y: event.clientY };
                    }

                    function handleMouseDown(event) {
                        //
                    }

                    function handleMouseUp(event) {
                        //
                    }

                    function handleTouchStart(event) {
                        if (event.touches.length > 1) {
                            event.preventDefault();
                            mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
                        }
                    }

                    function handleTouchEnd(event) {
                        mousePos = { x: windowHalfX, y: windowHalfY };
                    }

                    function handleTouchMove(event) {
                        if (event.touches.length == 1) {
                            event.preventDefault();
                            mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
                        }
                    }
                    */
                    /*
                    document.addEventListener('mousemove', handleMouseMove, false);
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

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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

    app.directive('slickTunnel', [function() {
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
                        draggable: false,
                        asNavFor: '.tunnel-bg',
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
                    });
                }

                scope.$watchCollection(attributes.slickTunnel, function(items) {
                    if (items && items.length) {
                        onSlick();
                    }
                });

                var tunnelAnimating = false;

                function onInit() {
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

                function onBeforeChange(event, slick, currentSlide, nextSlide) {
                    tunnelAnimating = true;
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, { delay: 0, y: 100, x: 50, ease: Power3.easeInOut, className: '-=viewed' }, 0.009);
                    $('.slick-active .cta').removeClass('active');
                    /*
                    var $next = $(slick.$slides.get(nextSlide)).find('.tunnel-slick__item');
                    var from = $next.attr('data-from');
                    var to = $next.attr('data-to');
                    changeYear(from, to);
                    var bg = $next.attr('data-bg');
                    $('body').removeClass('light-bg dark-bg');
                    $('body').addClass(bg + '-bg');
                    switchScene(nextSlide);
                    */
                    scope.$root.$broadcast('onSlickBeforeChange', { current: nextSlide, previouse: currentSlide });
                }

                function onAfterChange() {
                    tunnelAnimating = false;
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
                    scope.$root.$broadcast('onAfterChange');
                }

                function onWheel(e) {
                    if (tunnelAnimating) {
                        return;
                    }
                    if (element.hasClass('slick-initialized')) {
                        if (e.deltaX > 0 || e.deltaY < 0) {
                            element.slick('slickNext');
                        } else if (e.deltaX < 0 || e.deltaY > 0) {
                            element.slick('slickPrev');
                        }
                    }
                    e.preventDefault();
                }

                scope.$on('onGoStep', function($scope, index) {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('slickGoTo', index);
                    }
                });

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

                scope.$on('$destroy', function() {
                    removeListeners();
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

                    console.log('onChangeYears', scope.from, scope.to);

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

    app.constant('SceneOptions', {
        colors: {
            background: 0xeae8e8,
            lines: 0xb4bfdd,
            overLines: 0x3353a4,
        },
        camera: {
            cameraHeight: 0,
            targetHeight: 5,
        },
        circle: {
            position: new THREE.Vector3(),
        },
        ribbon: {
            steps: 12,
            points: 24, // 12
            vertices: 2400, // 1200
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

    app.controller('RootCtrl', ['$scope', 'SceneOptions', 'StepperService', 'AnalyserService', 'DatGui', '$timeout', function($scope, SceneOptions, StepperService, AnalyserService, DatGui, $timeout) {

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
            $scope.audio = AnalyserService;
            var gui = new DatGui();
        });

        var detail = {};

        $scope.openDetail = function () {

            $.get(stepper.step.url, function (data) {
                $timeout(function () {
                        detail.active = true;
                        detail.html = data;                
                    });
            });

            return false;
        };

        $scope.detail = detail;

    }]);

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
                    url: 'view.html',
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
                    audio: {
                        url: audios[i % audios.length],
                        title: audioTitles[i % audioTitles.length],
                        orchestra: 'Academy of St Martin in the Fields Orchestra',
                    },
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
                console.log('onStepChanged', index, step);
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
                    console.log(scrollbar);
                    scope.$watch(scrollbar.contentEl.offsetHeight, function(height) {
                        scrollbar.update();
                    });
                }

                setTimeout(Init, 100);
            }
        };
    }]);

}());