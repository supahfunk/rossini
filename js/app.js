/* global angular */

(function() {
    "use strict";

    var app = angular.module('app', ['ngRoute', 'jsonFormatter']);

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

    app.controller('RootCtrl', ['$scope', function($scope) {

        var OBJECTS = {};

        Number.prototype.mod = function(n) {
            return ((this % n) + n) % n;
        };

        var options = {
            cameraHeight: 33,
            targetHeight: 51,
            camera: {
                position: new THREE.Vector3(),
                target: new THREE.Vector3(),
            },
            circle: {
                position: new THREE.Vector3(),
            },
            audioUrl: "audio/rossini-192.mp3",
            audioVolume: 1.0,
            colors: {
                background: 0x111111, // 0xffffff,
                lines: 0x999999, // 0x888888,
                notes: 0x444444, // 0xaaaaaa,
            },
            bands: 128,
            points: 128,
            lines: 32,
            radius: 200,
            audioStrength: 100,
            noiseStrength: 25,
            circularStrength: 0.90,
            randomize: function() {
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
            }
        };

        options.noiseMap = getPerlinNoise(options.points, options.lines);

        function getStepper() {
            var stepper = {
                pow: 0,
                duration: 2.000, // sec
            };

            var steps = new Array(24).fill().map(function(v, i) {
                return {
                    camera: {
                        position: new THREE.Vector3(),
                        target: new THREE.Vector3(),
                    },
                    circle: {
                        position: new THREE.Vector3(60, 60, 0),
                        texture: 'img/rossini-01.png',
                    }
                };
            });

            var current = 0;

            function tweenTo(pow, callback) {
                if (stepper.tween) {
                    stepper.tween.kill();
                    stepper.tween = null;
                }
                stepper.tween = TweenLite.to(stepper, stepper.duration, {
                    pow: pow,
                    delay: 0,
                    ease: Power2.easeInOut,
                    onComplete: function() {
                        if (callback) {
                            callback();
                        }
                    },
                });
            }

            function setStep(index) {
                var previous = stepper.current || 0;
                stepper.current = index;
                var step = steps[index];
                options.camera.position.copy(step.camera.position);
                options.camera.target.copy(step.camera.target);
                options.circle.position.copy(step.circle.position);

                var circle = OBJECTS.circles[index] || getObjectCircles(index);
                circle.add();
                OBJECTS.circles[index] = circle;
                tweenTo(index / steps.length, function() {
                    stepper.tween = null;
                });
                setTimeout(function() {
                    if (previous !== stepper.current) {
                        var circle = OBJECTS.circles[previous];
                        if (circle) {
                            circle.remove();
                        }
                    }
                }, stepper.duration * 1000);
            }

            function next() {
                current++;
                current = Math.min(steps.length - 1, current);
                // current = current % steps.length;
                setStep(current);
            }

            function previous() {
                current--;
                current = Math.max(0, current);
                // current = current % steps.length;
                setStep(current);
            }

            function getCurrentStep() {
                return steps[current];
            }

            return angular.extend(stepper, {
                steps: steps,
                current: current,
                next: next,
                previous: previous,
                getCurrentStep: getCurrentStep,
            });
        }

        var stepper = getStepper();
        $scope.stepper = stepper;

        var analyser, analyserData, audio;
        var stats, gui, scene, camera, fov, ratio, near, far, shadow, back, light, renderer, container, width, height, w2, h2, mouse = { x: 0, y: 0 };
        var controls = null;


        function onChange(params) {
            // renderer.setClearColor(options.colors.background, 1);
            if (audio) {
                audio.volume = options.audioVolume;
            }
            var backgroundColor = new THREE.Color(options.colors.background).getHexString();
            console.log('backgroundColor', backgroundColor);
            document.body.style.backgroundColor = '#' + backgroundColor;
            if (OBJECTS.ribbon) {
                OBJECTS.ribbon.updateMaterial();
            }
            angular.forEach(OBJECTS.circles, function(circle) {
                if (circle) {
                    circle.updateMaterial();
                }
            });
        }

        function onChangePositions(params) {
            var step = stepper.getCurrentStep();
            step.camera.position.copy(options.camera.position);
            step.camera.target.copy(options.camera.target);
            step.circle.position.copy(options.circle.position);
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

        function createScene() {
            width = window.innerWidth;
            height = window.innerHeight;
            ratio = width / height;
            w2 = width / 2;
            h2 = height / 2;
            fov = 60;
            near = 0.001;
            far = 20000;

            scene = new THREE.Scene();
            // scene.fog = new THREE.Fog(0x000000, 300, 1000);

            camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
            camera.position.z = 100;
            camera.position.y = -500;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                logarithmicDepthBuffer: true
            });
            renderer.setClearColor(0x000000, 0); // the default
            // renderer.setClearColor(options.colors.background, 1);
            renderer.setSize(width, height);
            renderer.shadowMap.enabled = true;
            container = document.getElementById('scene');
            container.appendChild(renderer.domElement);

            stats = new Stats();
            container.appendChild(stats.dom);

            addListeners();
            // controls = new THREE.OrbitControls(camera, renderer.domElement);
        }

        function getRandomRange(min, max, allowNegatives) {
            var n = -1 + Math.random() * 2;
            var a = Math.abs(n);
            var s = allowNegatives ? Math.floor(n / a) : 1;
            return s * (min + (max - min) * a);
        }

        function getObjectRibbon() {
            var material = getMaterial();

            var prev = new THREE.Vector3();
            var points = new Array(12).fill(null).map(function() {
                var p = new THREE.Vector3().copy(prev);
                prev.x += getRandomRange(500, 1000, true);
                prev.y += getRandomRange(50, 100, true);
                prev.z += getRandomRange(1000, 2000, false);
                return p;
            });

            var spline = new THREE.CatmullRomCurve3(points);
            spline.type = 'catmullrom';
            // spline.closed = true;

            /*
            var cameraHeight = options.cameraHeight;
            var cameraSpline = new THREE.CatmullRomCurve3(spline.points.map(function(p) {
                return new THREE.Vector3(p.x, p.y + cameraHeight, p.z);
            }));
            cameraSpline.type = 'catmullrom';
            // cameraSpline.closed = true;

            var targetHeight = options.targetHeight;
            var targetSpline = new THREE.CatmullRomCurve3(spline.points.map(function(p) {
                return new THREE.Vector3(p.x, p.y + targetHeight, p.z);
            }));
            targetSpline.type = 'catmullrom';
            // targetSpline.closed = true;
            */

            var geometry = new THREE.Geometry();
            geometry.vertices = spline.getPoints(1200);

            var line = new MeshLine();
            line.setGeometry(geometry);
            // line.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
            // line.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
            // line.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal

            var object = new THREE.Mesh(line.geometry, material);
            // var object = new THREE.Object3D();
            // object.add(mesh);
            scene.add(object);

            function add() {
                console.log('OBJECTS.ribbon.add');
                scene.add(object);
            }

            function remove() {
                console.log('OBJECTS.ribbon.remove');
                scene.remove(object);
            }

            camera.target = camera.target || new THREE.Vector3(0, 0, 0);

            function update() {
                var c = (1 / stepper.steps.length) / 10;
                var cpow = stepper.pow;
                var tpow = (cpow + c).mod(1);

                var position = spline.getPointAt(cpow);
                position.y += options.cameraHeight;

                var target = spline.getPointAt(tpow);
                target.y += options.targetHeight;

                var step = stepper.getCurrentStep();
                position.add(step.camera.position);
                target.add(step.camera.target);

                camera.position.copy(position);
                camera.target.copy(target);
                camera.lookAt(camera.target);
            }

            function getMaterial() {
                var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
                return new MeshLineMaterial({
                    color: new THREE.Color(options.colors.lines),
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

            function updateMaterial() {
                // !!! non va bene
                OBJECTS.ribbon.material = getMaterial();
                OBJECTS.ribbon.object.material = OBJECTS.ribbon.material;
            }

            return {
                object: object,
                spline: spline,
                geometry: geometry,
                material: material,
                add: add,
                remove: remove,
                update: update,
                updateMaterial: updateMaterial,
            };
        }

        function getObjectCircles(index) {
            var geometry, object, circles = [];

            // materials
            var material1 = new THREE.LineBasicMaterial({
                color: options.colors.lines,
            });

            var material2 = new THREE.LineBasicMaterial({
                color: 0xffffff,
            });

            var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

            var meshLineMaterial1 = new MeshLineMaterial({
                color: new THREE.Color(options.colors.lines),
                lineWidth: 1,
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

            var meshLineMaterial2 = new MeshLineMaterial({
                color: new THREE.Color(0xffffff),
                lineWidth: 1,
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

            object = new THREE.Object3D();

            // sphere
            var step = stepper.steps[index];
            var texture = new THREE.TextureLoader().load(step.circle.texture);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            var material = new THREE.MeshBasicMaterial({
                color: options.colors.lines,
                map: texture,
                transparent: true
            });

            /*
            geometry = new THREE.IcosahedronGeometry(options.radius - 5, 3); // radius, detail
            var sphere = new THREE.Mesh(geometry, material);
            sphere.scale.z = 0.001;
            object.add(sphere);
            */

            geometry = new THREE.PlaneGeometry(options.radius * 2 - 20, options.radius * 2 - 20, 8, 8);
            var plane = new THREE.Mesh(geometry, material);
            object.add(plane);
            // sphere

            var points1 = [],
                points2 = [],
                meshLines1 = [],
                meshLines2 = [],
                meshLineGeometries1 = [],
                meshLineGeometries2 = [],
                useMeshLines = false;

            var pn = options.points,
                ln = options.lines;

            var group1 = new THREE.Object3D();
            object.add(group1);

            var group2 = new THREE.Object3D();
            object.add(group2);

            var lines1 = new Array(ln).fill(null).map(getLine1);
            var lines2 = new Array(ln).fill(null).map(getLine2);

            // console.log('lines2', lines2[lines2.length - 1].geometry.vertices[0]);

            var state = {
                pow: 0,
                duration: 0.350,
                enabled: false,
                adding: false,
                removing: false,
            };

            var to = null;

            function add() {
                console.log('OBJECTS.circles.add');
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
                console.log('OBJECTS.circles.remove');
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
                if (useMeshLines) {
                    var meshLine = new MeshLine();
                    meshLine.setGeometry(geometry);
                    meshLineGeometries1.push(geometry);
                    meshLines1.push(meshLine);
                    // meshLine.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
                    // meshLine.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
                    // meshLine.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal
                    line = new THREE.Mesh(meshLine.geometry, meshLineMaterial1);
                } else {
                    line = new THREE.LineLoop(geometry, material1);
                }
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
                if (useMeshLines) {
                    var meshLine = new MeshLine();
                    meshLine.setGeometry(geometry);
                    meshLineGeometries2.push(geometry);
                    meshLines2.push(meshLine);
                    // meshLine.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
                    // meshLine.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
                    // meshLine.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal                    
                    line = new THREE.Mesh(meshLine.geometry, meshLineMaterial2);
                } else {
                    line = new THREE.LineLoop(geometry, material2);
                }
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
                    data = analyserData;

                angular.forEach(vertices, function(v, i) {
                    var aia = i % options.bands;
                    var aib = (pn - 1 - i) % options.bands;
                    var audioPow = ((data[aia] + data[aib]) / 2) / options.bands;
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

            function update() {
                angular.forEach(lines1, function(line, l) {
                    updateLine(line.geometry, points1[l], l, 1);
                    if (useMeshLines) {
                        meshLines1[l].setGeometry(meshLineGeometries1[l]);
                    }
                });

                angular.forEach(lines2, function(line, l) {
                    updateLine(line.geometry, points2[l], l, 2);
                    if (useMeshLines) {
                        meshLines2[l].setGeometry(meshLineGeometries2[l]);
                    }
                });

                group1.rotation.z += 0.001;
                group2.rotation.z -= 0.001;

                var step = stepper.getCurrentStep();
                var position = OBJECTS.ribbon.spline.getPointAt((index + 0.5) / stepper.steps.length);
                // position.y += options.cameraHeight;

                position.add(step.circle.position);

                object.position.copy(position);
                /*
                object.position.x += (position.x + Math.random() * 20 - object.position.x) / 20;
                object.position.y += (position.y + Math.random() * 20 - object.position.y) / 20;
                object.position.z += (position.z + Math.random() * 20 - object.position.z) / 20;
                */

                object.scale.x = object.scale.y = object.scale.z = 0.001 + 0.3 * state.pow;
                object.lookAt(camera.position);

                // iterator++;
            }

            function updateMaterial() {
                material.color.setHex(options.colors.lines);
                material1.color.setHex(options.colors.lines);
            }

            console.log(object);

            return {
                add: add,
                remove: remove,
                object: object,
                state: state,
                update: update,
                updateMaterial: updateMaterial,
            };
        }
        /*
                function getObjectCirclesBak(index) {
                    var geometry, material, object, circles = [];

                    object = new THREE.Object3D();

                    geometry = new THREE.IcosahedronGeometry(90, 3); // radius, detail
                    material = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                    });
                    var sphere = new THREE.Mesh(geometry, material);
                    object.add(sphere);

                    material = new THREE.LineBasicMaterial({
                        color: options.colors.lines
                    });

                    var pn = options.points;

                    while (circles.length < pn) {
                        geometry = new THREE.Geometry();
                        var circle = new THREE.LineLoop(geometry, material);
                        circle.points = new Array(pn).fill(null);
                        // var spline = new THREE.CatmullRomCurve3(points);
                        // circle.spline = spline;
                        circles.push(circle);
                        object.add(circle);
                    }
                    var points = new Array(pn * pn).fill(null).map(function(n, i) {
                        var r = Math.floor(i / pn);
                        var c = i - r * pn;
                        var angle = 2 * Math.PI / pn;
                        var rad = angle * r + angle * c * 0.1;
                        var point = new THREE.Vector3();
                        point.r = {
                            x: Math.cos(rad),
                            y: Math.sin(rad),
                            z: 96 + (c * c * c * 0.0001),
                        };
                        circles[c].points[r] = point;
                        circles[c].geometry.vertices.push(point);
                        return point;
                    });

                    var state = {
                        pow: 0,
                        duration: 0.350,
                        enabled: false,
                        adding: false,
                        removing: false,
                    };

                    var to = null;

                    function add() {
                        console.log('OBJECTS.circles.add');
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
                        console.log('OBJECTS.circles.remove');
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

                    var d = 0;

                    function update() {
                        var audioStrength = options.audioStrength,
                            noiseStrength = options.noiseStrength,
                            circularStrength = options.circularStrength;
                        angular.forEach(points, function(v, i) {
                            var r = Math.floor(i / pn);
                            var c = i - r * pn;
                            var b = Math.abs(c - pn / 2) * 2;
                            var dr = 1 - (Math.abs(r - pn / 2) / (pn / 2));
                            var dc = 1 - (Math.abs(c - pn / 2) / (pn / 2));
                            var drc = (dr + dc) / 2;
                            var ai = r % options.bands;
                            var pow = (analyserData[ai] + analyserData[pn - 1 - ai]) / 2;
                            var scale = pow / options.bands;
                            var na = c * pn + ((r + d) % pn);
                            var noise = options.noiseMap[na];
                            var cpow = 1 - ((pn - c) / pn * circularStrength);
                            var level = v.r.z + (noise / 64 * noiseStrength) * cpow + (audioStrength * 2 * scale * scale) * cpow;
                            var radius = v.radius || level;
                            radius += (level - radius) / 2;
                            v.x = v.r.x * radius;
                            v.y = v.r.y * radius;
                            v.z = 0; // -c;
                            v.radius = radius;
                        });
                        angular.forEach(circles, function(circle, l) {
                            // var points = circle.points;
                            // var spline = circle.spline;
                            // spline.getPoints(pn * 2);
                            // circle.geometry.vertices = points;
                            // geometry.computeLineDistances();
                            // geometry.lineDistancesNeedUpdate = true;
                            circle.geometry.verticesNeedUpdate = true;
                        });
                        object.scale.x = object.scale.y = object.scale.z = 0.001 + 0.3 * state.pow;
                        object.lookAt(camera.position);
                        // d++;
                    }

                    var position = OBJECTS.ribbon.cameraSpline.getPointAt((index + 0.5) / stepper.steps.length);

                    object.position.copy(position);

                    return {
                        add: add,
                        remove: remove,
                        update: update,
                        object: object,
                        material: material,
                        state: state,
                    };
                }
        */
        function createObjects() {
            // OBJECTS.tube = getObjectTube();
            OBJECTS.ribbon = getObjectRibbon();
            OBJECTS.circles = new Array(stepper.steps).fill(null);
        }

        function createAnalyser() {
            var source, ctx, actx = (window.AudioContext || window.webkitAudioContext);
            source = null;
            ctx = new actx();
            analyser = ctx.createAnalyser();
            audio = new Audio();
            audio.src = options.audioUrl;
            audio.controls = true;
            audio.addEventListener('canplay', function() {
                var bufferLength;
                console.log('audio canplay');
                source = ctx.createMediaElementSource(audio);
                source.connect(analyser);
                source.connect(ctx.destination);
                analyser.fftSize = options.bands * 2;
                bufferLength = analyser.frequencyBinCount;
                console.log('bufferLength', bufferLength);
                analyserData = new Uint8Array(bufferLength);
                return analyserData;
            });
            audio.volume = options.audioVolume;
            return audio.play();
        }

        function updateAnalyser() {
            if (analyserData) {
                analyser.getByteFrequencyData(analyserData);
                angular.forEach(OBJECTS.circles, function(circle) {
                    if (circle && circle.state.enabled) {
                        circle.update();
                    }
                });
            }
        }

        function loop() {
            stats.begin();
            render();
            stats.end();
            requestAnimationFrame(loop);
        }

        function render() {
            if (controls) {
                controls.update();
            }
            if (OBJECTS.tube) {
                OBJECTS.tube.update();
            }
            if (OBJECTS.ribbon) {
                OBJECTS.ribbon.update();
            }
            updateAnalyser();
            renderer.render(scene, camera);
        }

        createScene();
        // createLights();
        createObjects();
        createAnalyser();
        addGui();
        onChange();
        loop();

        function addGui() {
            gui = new dat.GUI();
            gui.closed = true;
            gui.add(options, 'cameraHeight', 20.0, 100.0).onChange(onChange);
            gui.add(options, 'targetHeight', 20.0, 100.0).onChange(onChange);
            /*
            var cameraPosition = gui.addFolder('CameraPosition');
            cameraPosition.add(options.camera.position, 'x', -300, 300).onChange(onChangePositions);
            cameraPosition.add(options.camera.position, 'y', -300, 300).onChange(onChangePositions);
            cameraPosition.add(options.camera.position, 'z', -300, 300).onChange(onChangePositions);
            var cameraTarget = gui.addFolder('cameraTarget');
            cameraTarget.add(options.camera.target, 'x', -300, 300).onChange(onChangePositions);
            cameraTarget.add(options.camera.target, 'y', -300, 300).onChange(onChangePositions);
            cameraTarget.add(options.camera.target, 'z', -300, 300).onChange(onChangePositions);
            */
            var circlePosition = gui.addFolder('circlePosition');
            circlePosition.add(options.circle.position, 'x', -300, 300).onChange(onChangePositions);
            circlePosition.add(options.circle.position, 'y', -300, 300).onChange(onChangePositions);
            circlePosition.add(options.circle.position, 'z', -300, 300).onChange(onChangePositions);
            gui.addColor(options.colors, 'background').onChange(onChange);
            gui.addColor(options.colors, 'lines').onChange(onChange);
            gui.add(options, 'audioVolume', 0.01, 1.0).onChange(onChange);
            gui.add(options, 'audioStrength', 10, 100).onChange(onChange);
            gui.add(options, 'noiseStrength', 10, 100).onChange(onChange);
            gui.add(options, 'circularStrength', 0.01, 0.90).onChange(onChange);
            gui.add(options, 'randomize');
            return gui;
        }

        function addListeners() {
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
            document.addEventListener('mousemove', handleMouseMove, false);
            document.addEventListener('mousedown', handleMouseDown, false);
            document.addEventListener('mouseup', handleMouseUp, false);
            document.addEventListener('touchstart', handleTouchStart, false);
            document.addEventListener('touchend', handleTouchEnd, false);
            document.addEventListener('touchmove', handleTouchMove, false);
            */
        }

        function getSprite() {
            var canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            var ctx = canvas.getContext('2d');
            var gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width / 2
            );
            /*
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.2, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.22, 'rgba(0,0,0,.2)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            */
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return canvas;
        }

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

        function getObjectTube() {
            var options = {
                path: spline,
                tubularSegments: 500,
                radius: 1,
                radiusSegments: 2,
                closed: true,
            }
            var spline = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-400, -400, 0),
                new THREE.Vector3(400, -400, 0),
                new THREE.Vector3(1400, -400, 0),
                new THREE.Vector3(400, 400, 0),
                new THREE.Vector3(-400, 400, 0)
            ]);
            spline.type = 'catmullrom';
            spline.closed = true;

            var object = new THREE.Object3D();
            scene.add(object);

            var material = new THREE.MeshLambertMaterial({
                color: 0xffffff
            });
            var geometry = new THREE.TubeBufferGeometry(spline, options.tubularSegments, options.radius, options.radiusSegments, options.closed);
            var group = new THREE.Mesh(geometry, material);
            object.add(group);

            // if (group !== undefined) {
            //     object.remove(group);
            //     group.children[0].geometry.dispose();
            //     group.children[1].geometry.dispose();
            // }            

            /*
            var geometry = new THREE.Geometry();
            geometry.vertices = spline.getPoints(500);
            var line = new MeshLine();
            line.setGeometry(geometry);
            // line.setGeometry( geometry, function( p ) { return 2; } ); // makes width 2 * lineWidth
            // line.setGeometry( geometry, function( p ) { return 1 - p; } ); // makes width taper
            // line.setGeometry( geometry, function( p ) { return 2 + Math.sin( 50 * p ); } ); // makes width sinusoidal
            var material = new MeshLineMaterial({
                color: new THREE.Color(0xffffff),
                lineWidth: 4,
            });
            var mesh = new THREE.Mesh(line.geometry, material);
            object.add(mesh);
            */

            function add() {
                console.log('OBJECTS.tube.add');
                scene.add(object);
            }

            function remove() {
                console.log('OBJECTS.tube.remove');
                scene.remove(object);
            }

            var d = 0; // iterator
            var a = new THREE.Vector3(); // normal
            var b = new THREE.Vector3(); // binormal

            function update() {
                var duration = 20 * 1000;
                var scale = 1;
                var offset = 15;
                var lookAhead = true;
                var msec = Date.now();
                var pow = (msec % duration) / duration;
                var dir = spline.getTangentAt(pow);
                var tangents = geometry.tangents;
                var binormals = geometry.binormals;
                var x = pow * tangents.length;
                var c = Math.floor(x);
                var n = (c + 1) % tangents.length;
                b.subVectors(binormals[n], binormals[c]);
                b.multiplyScalar(x - c).add(binormals[c]);
                a.copy(b).cross(dir);
                var p = spline.getPointAt(pow);
                p.multiplyScalar(scale);
                p.add(a.clone().multiplyScalar(offset));
                camera.position.copy(p);
                var lookAt;
                if (lookAhead) {
                    // using arclength for stablization in look ahead
                    lookAt = spline.getPointAt((pow + 30 / spline.getLength()) % 1).multiplyScalar(scale);
                } else {
                    // camera orientation 2 - up orientation via normal
                    lookAt = new THREE.Vector3().copy(p).add(dir);
                }
                camera.matrix.lookAt(camera.position, lookAt, a);
                camera.rotation.setFromRotationMatrix(camera.matrix, camera.rotation.order);
                d++;
            }

            return {
                object: object,
                spline: spline,
                geometry: geometry,
                add: add,
                remove: remove,
                update: update,
            };
        }

    }]);

}());