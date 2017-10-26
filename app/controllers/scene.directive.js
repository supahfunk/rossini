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

        function init() {
            var source, ctx, actx = (window.AudioContext || window.webkitAudioContext);
            source = null;
            ctx = new actx();
            analyser = ctx.createAnalyser();
            audio = new Audio();
            // audio.controls = true;
            audio.addEventListener('canplay', function() {
                var bufferLength;
                console.log('audio canplay');
                source = ctx.createMediaElementSource(audio);
                source.connect(analyser);
                source.connect(ctx.destination);
                analyser.fftSize = options.bands * 2;
                bufferLength = analyser.frequencyBinCount;
                service.data = new Uint8Array(bufferLength);
                // console.log('bufferLength', bufferLength);
                return service.data;
            });
            setStep();
        }

        function setAudioUrl($audioUrl) {
            if (audioUrl !== $audioUrl) {
                audioUrl = $audioUrl;
                audio.src = $audioUrl;
                audio.volume = options.audioVolume;
                audio.play();
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

        this.audio = audio;
        this.data = null;
        this.init = init;
        this.update = update;

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
                analyser.init();

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