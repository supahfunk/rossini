/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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
                // var mousePos = { x: 0, y: 0 };
                var parallax = { x: 0, y: 0, i: 0 };

                function updateParallax() {
                    parallax.x = (mouse.x * 20) + Math.cos(parallax.i / 100) * 10;
                    parallax.y = (mouse.y * 20) + Math.sin(parallax.i / 100) * 10;
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
                    var near = 0.001;
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

                        object.material.uniforms.visibility.value = Math.min(1.0, stepper.values.pow + s);
                        // object.material.uniforms.lineWidth.value = 5;

                        var target = cameraSpline.getPointAt(tpow);
                        target.y += stepper.values.targetHeight;
                        // var tangent = cameraSpline.getTangent(tpow).normalize().multiplyScalar(100);
                        // target.add(tangent);
                        camera.position.copy(position);
                        camera.target.copy(target);
                        camera.position.x += (position.x + parallax.x - camera.position.x) / 12;
                        camera.position.y += (position.y + parallax.y - camera.position.y) / 12;
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

                        dummy.rotation.x += ((parallax.y * 0.00625) - dummy.rotation.x) / 12;
                        dummy.rotation.y += ((parallax.x * 0.01250) - dummy.rotation.y) / 12;

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