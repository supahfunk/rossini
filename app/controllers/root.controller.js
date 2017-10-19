/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('RootCtrl', ['$scope', function($scope) {

        var options = {
            audioUrl: "audio/rossini-192.mp3",
            colors: {
                background: 0x111111, // 0xffffff,
                lines: 0x999999, // 0x888888,
                notes: 0x444444, // 0xaaaaaa,
            },
            bands: 256,
            rows: 256,
            space: 10,
            strength: 60,
            noiseStrength: 25,
        };

        options.points = new Array(options.bands * 2).fill(null).map(function() {
            var r = 1000,
                d = r * 2;
            return new THREE.Vector3(-r + Math.random() * d, -r + Math.random() * d, -r + Math.random() * d);
        });
        options.noiseMap = getPerlinNoise(options.rows, options.rows);

        var analyser, analyserData, audio;

        var objects = {};

        var stats, gui, scene, camera, controls, fov, ratio, near, far, shadow, back, light, renderer, container, width, height, w2, h2, mouse = { x: 0, y: 0 };

        // objects
        var ground, notes, lines;

        function onChange(params) {
            renderer.setClearColor(options.colors.background, 1);
            if (objects.ground) {
                objects.ground.material.color.setHex(options.colors.lines);
            }
            if (objects.groundLines) {
                objects.groundLines.material.color.setHex(options.colors.lines);
            }
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
            near = 1;
            far = 20000;
            scene = new THREE.Scene();
            // scene.fog = new THREE.Fog(0xeeeeee, 256, 500);
            camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
            camera.position.z = 100;
            camera.position.y = -500;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setSize(width, height);
            renderer.setClearColor(options.colors.background, 1);
            renderer.shadowMap.enabled = true;
            container = document.getElementById('scene');
            container.appendChild(renderer.domElement);

            stats = new Stats();
            container.appendChild(stats.dom);

            addListeners();
            controls = new THREE.OrbitControls(camera, renderer.domElement);
        }

        function getGround() {
            var object, geometry, material;
            material = new THREE.PointsMaterial({
                color: options.colors.lines,
                size: 1,
                sizeAttenuation: false,
                // vertexColors: THREE.VertexColors,
            });
            geometry = new THREE.Geometry();
            object = new THREE.Points(geometry, material);
            scene.add(object);
            var rows = options.rows,
                space = options.space;
            var points = new Array(rows * rows).fill(null).map(function(n, i) {
                var r = Math.floor(i / rows);
                var c = i - r * rows;
                var dr = 1 - (Math.abs(r - rows / 2) / (rows / 2));
                var dc = 1 - (Math.abs(c - rows / 2) / (rows / 2));
                var drc = (dr + dc) / 2;
                var idrc = 1 - drc;
                return {
                    x: -(space * rows / 2) + space * c,
                    y: -(space * rows / 2) + space * r,
                    z: 0,
                };
            });
            var i = 0,
                t = points.length;
            while (i < t) {
                var point = points[i];
                var vertex = new THREE.Vector3();
                vertex.x = point.x;
                vertex.y = point.y;
                vertex.z = point.z;
                geometry.vertices.push(vertex);
                // geometry.colors.push(new THREE.Color(0xffcc00));
                i++;
            }
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;
            object.geometry = geometry;

            function add() {
                scene.add(object);
            }

            function remove() {
                scene.remove(object);
            }

            var d = 0;

            function update() {
                var rows = options.rows,
                    strength = options.strength,
                    noiseStrength = options.noiseStrength;
                angular.forEach(geometry.vertices, function(v, i) {
                    var r = Math.floor(i / rows);
                    var c = i - r * rows;
                    var b = Math.abs(c - rows / 2) * 2;
                    var dr = 1 - (Math.abs(r - rows / 2) / (rows / 2));
                    var dc = 1 - (Math.abs(c - rows / 2) / (rows / 2));
                    var drc = (dr + dc) / 2;
                    var index = b % options.bands;
                    var pow = analyserData[index];
                    var scale = (pow / options.bands) * dr * 2;
                    // v.x = options.points[i].x + 10 * scale;
                    // v.y = options.points[i].y + 10 * scale;
                    var ni = r * rows + ((c + d) % rows);
                    var vz = (options.noiseMap[ni] / 64 * noiseStrength) * drc + (strength * scale);
                    v.z += (vz - v.z) / (3 + 3 * (1 - drc));
                });
                d++;
                geometry.verticesNeedUpdate = true;
            }
            return {
                add: add,
                remove: remove,
                update: update,
                object: object,
            };
        }

        function getGroundLines() {
            var object, material, lines = [];
            material = new THREE.LineBasicMaterial({
                color: options.colors.lines
            });
            object = new THREE.Object3D();
            scene.add(object);
            var rows = options.rows,
                space = options.space;
            while (lines.length < options.rows) {
                var geometry = new THREE.Geometry();
                var line = new THREE.Line(geometry, material);
                line.points = new Array(rows).fill(null);
                // var spline = new THREE.CatmullRomCurve3(points);
                // line.spline = spline;
                lines.push(line);
                object.add(line);
            }
            var points = new Array(rows * rows).fill(null).map(function(n, i) {
                var r = Math.floor(i / rows);
                var c = i - r * rows;
                var dr = 1 - (Math.abs(r - rows / 2) / (rows / 2));
                var dc = 1 - (Math.abs(c - rows / 2) / (rows / 2));
                var drc = (dr + dc) / 2;
                var idrc = 1 - drc;
                var point = new THREE.Vector3(-(space * rows / 2) + space * c, -(space * rows / 2) + space * r,
                    0
                );
                lines[c].points[r] = point;
                lines[c].geometry.vertices.push(point);
                return point;
            });

            function add() {
                scene.add(object);
            }

            function remove() {
                scene.remove(object);
            }

            var d = 0;

            function update() {
                var rows = options.rows,
                    strength = options.strength,
                    noiseStrength = options.noiseStrength;
                angular.forEach(points, function(v, i) {
                    var r = Math.floor(i / rows);
                    var c = i - r * rows;
                    var b = Math.abs(c - rows / 2) * 2;
                    var dr = 1 - (Math.abs(r - rows / 2) / (rows / 2));
                    var dc = 1 - (Math.abs(c - rows / 2) / (rows / 2));
                    var drc = (dr + dc) / 2;
                    var index = b % options.bands;
                    var pow = analyserData[index];
                    var scale = (pow / options.bands) * dr * 2;
                    var ni = r * rows + ((c + d) % rows);
                    var vz = (options.noiseMap[ni] / 64 * noiseStrength) * drc + (strength * scale);
                    v.z += (vz - v.z) / (3 + 3 * (1 - drc));
                });
                angular.forEach(lines, function(line, l) {
                    // var points = line.points;
                    // var spline = line.spline;
                    // spline.getPoints(rows * 2);
                    // line.geometry.vertices = points;
                    // geometry.computeLineDistances();
                    // geometry.lineDistancesNeedUpdate = true;
                    line.geometry.verticesNeedUpdate = true;
                });
                d++;
            }
            return {
                add: add,
                remove: remove,
                update: update,
                object: object,
                material: material,
            };
        }

        function getNotes() {
            var object, geometry, material;
            geometry = new THREE.Geometry();
            /*
            texture = new THREE.CanvasTexture(sprite());
            material = new THREE.PointsMaterial({
                size: 12,
                map: texture,
                vertexColors: THREE.VertexColors,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true
            });
            */
            material = new THREE.PointsMaterial({
                color: options.colors.notes,
                size: 2,
                sizeAttenuation: false,
            });
            object = new THREE.Points(geometry, material);

            var points = options.points;
            var i = 0,
                t = points.length;
            while (i < t) {
                var p = points[i];
                geometry.vertices.push(new THREE.Vector3(p.x, p.y, p.z));
                // geometry.colors.push(new THREE.Color(0, 0, 0));
                i++;
            }
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;

            add();

            function add() {
                scene.add(object);
            }

            function remove() {
                scene.remove(object);
            }

            function update() {
                angular.forEach(geometry.vertices, function(v, i) {
                    var index = i % options.bands;
                    var pow = analyserData[index];
                    var scale = (pow / options.bands) * 2;
                    var p = options.points[i];
                    var vx = p.x * (1 + scale);
                    var vy = p.y * (1 + scale);
                    var vz = p.z * (1 + scale);
                    v.x += (vx - v.x) / 3;
                    v.y += (vy - v.y) / 3;
                    v.z += (vz - v.z) / 3;
                });
                geometry.verticesNeedUpdate = true;
            }
            return {
                add: add,
                remove: remove,
                update: update,
                object: object,
            };

        }

        function getLines() {
            var object, geometry, material;

            geometry = new THREE.Geometry();
            /*
            material = new THREE.LineDashedMaterial({
                color: options.colors.lines,
                dashSize: 1,
                gapSize: 0.5,
            });
            */
            material = new THREE.LineBasicMaterial({
                color: options.colors.lines
            });
            object = new THREE.Line(geometry, material);
            scene.add(object);

            function add() {
                scene.add(object);
            }

            function remove() {
                scene.remove(object);
            }

            function update() {

            }
            return {
                add: add,
                remove: remove,
                update: update,
                object: object,
            };

        }

        function createObjects() {
            objects.groundLines = getGroundLines();
            // objects.ground = getGround();
            // objects.notes = getNotes();
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
            return audio.play();
        }

        function updateAnalyser() {
            // notes.rotation.z -= 0.0025;
            // lines.rotation.z -= 0.0025;            
            if (analyserData) {
                analyser.getByteFrequencyData(analyserData);
                objects.groundLines.update();
                // objects.ground.update();
                // objects.notes.update();
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
            updateAnalyser();
            renderer.render(scene, camera);
        }

        function sprite() {
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

        function bufferGeometry() {
            var geometry = new THREE.BufferGeometry();
            // create a simple square shape. We duplicate the top left and bottom right
            // vertices because each vertex needs to appear once per triangle.
            var vertices = new Float32Array([-1.0, -1.0, 1.0,
                1.0, -1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0
            ]);
            // itemSize = 3 because there are 3 values (components) per vertex
            geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        }


        createScene();
        createObjects();
        // addNotes();
        createAnalyser();
        // createLights();
        // addGui();        
        loop();

        function addNotes() {
            // alert('onChange', params);
            /*
            var dx = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dy = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dz = 40 - 40 * params.dispersion * (1 - params.bulge);
            */
            var geometry = new THREE.Geometry();
            // geometry.vertices.splice(0, geometry.vertices.length);
            var points = options.points;
            var i = 0,
                t = points.length;
            while (i < t) {
                var p = points[i];
                geometry.vertices.push(new THREE.Vector3(p.x, p.y, p.z));
                // geometry.colors.push(new THREE.Color(0, 0, 0));
                i++;
            }
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;
            notes.geometry = geometry;
            addSplines(points);
        }

        function addSplines(points) {
            points = points.map(function(point) {
                return new THREE.Vector3(point.x, point.y, point.z);
            });
            var spline = new THREE.CatmullRomCurve3(points);
            var geometry = new THREE.Geometry();
            geometry.vertices = spline.getPoints(5000);
            // geometry.mergeVertices();
            // geometry.verticesNeedUpdate = true;
            // geometry.computeLineDistances();
            // geometry.lineDistancesNeedUpdate = true;
            lines.geometry = geometry;
        }

        var params = function GalaxyParameters() {
            function GalaxyParameters() {
                this.arms = 2,
                    this.stops = 5000,
                    this.revolutions = 1.7,
                    this.radius = 400,
                    this.sparse = 0.4,
                    this.dispersion = 0.6, // more 0 - less 1
                    this.bulge = 0.6,
                    this.displayOutline = false,
                    this.randomize = function() {
                        // console.log('gui', gui);
                        for (var i = 0; i < gui.__controllers.length; i++) {
                            var c = gui.__controllers[i];
                            if (c.__min) {
                                var value = c.__min + (c.__max - c.__min) * Math.random();
                                // console.log(value, c);
                                this[c.property] = value;
                                c.updateDisplay();
                            }
                        }
                        onChange(this);
                    },
                    this.armTheta = function() {
                        return Math.PI * 2 / this.arms;
                    };
                this.modulus = function() {
                    return Math.pow(2, 31);
                };
            }
            return new GalaxyParameters();
        }();

        function lcg(value, modulus, multiplier, increment) {
            modulus = modulus || Math.pow(2, 31);
            multiplier = multiplier || 1103515245;
            increment = increment || 12345;
            return (value * multiplier + increment) % modulus;
        }

        function __onChange(params) {
            // alert('onChange', data);
            var dx = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dy = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dz = 40 - 40 * params.dispersion * (1 - params.bulge);
            // var geometry = notes.geometry;
            var geometry = new THREE.Geometry();
            // geometry.vertices.splice(0, geometry.vertices.length);
            var points = spiral(params).toArray();
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                var distance = Math.pow(Math.pow(point.x, 2) + Math.pow(point.y, 2), 0.5);
                var pow = Math.max(0, ((params.radius * .8) - distance) / (params.radius * .8));
                pow = (1 - Math.cos(pow * Math.PI)) * params.bulge;
                // console.log(distance);
                var vertex = new THREE.Vector3();
                vertex.x = point.x;
                vertex.y = point.y;
                vertex.z = (-dz + (dz * 2) * Math.random()) * pow; // (Math.random() * 180 - 90) * (pow * pow * pow);
                geometry.vertices.push(vertex);
                geometry.colors.push(new THREE.Color(pow, pow, 1));
                var t = Math.round(pow * 5),
                    n = 0;
                while (n < t) {
                    vertex = new THREE.Vector3();
                    vertex.x = point.x - dx + Math.random() * (dx * 2);
                    vertex.y = point.y - dy + Math.random() * (dy * 2);
                    vertex.z = (-dz + (dz * 2) * Math.random()) * pow;
                    geometry.vertices.push(vertex);
                    geometry.colors.push(new THREE.Color(pow, pow, pow));
                    n++;
                }
            }
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;
            notes.geometry = geometry;
        }

        function addGui() {
            gui = new dat.GUI();
            gui.closed = true;
            gui.addColor(options.colors, 'background').onChange(onChange);
            gui.addColor(options.colors, 'lines').onChange(onChange);
            /*
            gui.add(params, 'stops', 1000, 10000).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'revolutions', 1.1, 3.1).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'radius', 300, 1000).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'sparse', 0.1, 1).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'dispersion', 0.01, 1).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'bulge', 0.01, 1).onChange(function(newValue) {
                onChange(params);
            });
            gui.add(params, 'randomize');
            */
            onChange(params);
            return gui;
        }
        addGui();

        function spiral(params) {
            return {
                toArray: function(now) {
                    now = now || 0;
                    var time = now / -60000,
                        modulus = params.modulus(),
                        theta = params.armTheta();
                    var points = [];
                    var value = 0;
                    for (var arm = 0; arm < params.arms; arm++) {
                        for (var stop = 0; stop < params.stops; stop++) {
                            value = lcg(value, modulus);
                            var pow = (stop / params.stops),
                                c = 1 - pow + 1 - params.dispersion,
                                r = value / modulus,
                                cr = (r - 0.5) * 2,
                                angle = (pow * Math.PI * 2 * params.revolutions) + (theta * arm),
                                radians = time + angle + (Math.PI * c * cr * params.sparse),
                                distance = Math.sqrt(pow) * params.radius,
                                x = Math.cos(radians) * distance,
                                y = Math.sin(radians) * distance,
                                z = 0,
                                size = (r - 0.5) * 2 + Math.pow(1.125, (1 - pow) * 8),
                                alpha = (Math.sin((r + time + pow) * Math.PI * 2) + 1) * 0.5;
                            points.push({
                                x: x,
                                y: y,
                                z: z,
                                size: size,
                                alpha: alpha,
                            });
                        }
                    }
                    return points;
                },
            };
        }

        /*

        var downloadFile = (function() {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function(data, fileName, json) {
                data = json ? JSON.stringify(data) : data;
                var blob = new Blob([data], { type: "octet/stream" }),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());

        function string2ArrayBuffer(string, callback) {
            var blob = new Blob([string])
            var fr = new FileReader();
            fr.onload = function(e) {
                callback(e.target.result);
            }
            fr.readAsArrayBuffer(blob);
        }

        function PCDExporter(vertices) {
            var data = '# .PCD v.7 - Point Cloud Data file format' + '\r\n';
            data += 'VERSION .7' + '\r\n';
            data += 'FIELDS x y z rgb' + '\r\n';
            data += 'SIZE 4 4 4 4' + '\r\n';
            data += 'TYPE F F F F' + '\r\n';
            data += 'COUNT 1 1 1 1' + '\r\n';
            data += 'WIDTH ' + vertices.length + '\r\n';
            data += 'HEIGHT 1' + '\r\n';
            data += 'VIEWPOINT 0 0 0 1 0 0 0' + '\r\n';
            data += 'POINTS ' + vertices.length + '\r\n';
            data += 'DATA ascii' + '\r\n';
            for (var i = 0; i < vertices.length; i++) {
                var v = vertices[i];
                var x = v.x.toFixed(5);
                var y = v.y.toFixed(5);
                var z = v.z.toFixed(5);
                data += x + ' ' + y + ' ' + z + ' 4.2108e+06';
                if (i < vertices.length - 1) {
                    data += '\r\n';
                }
            }
            return data;
        }
        // https://cdn.rawgit.com/mikolalysenko/write-ply/master/write-ply.js
        function PLYExporter(vertices) {
            var model = {
                vertex: {
                    x: [],
                    y: [],
                    z: []
                },
                face: {
                    vertex_index: []
                }
            };
            for (var i = 0; i < vertices.length; i++) {
                var v = vertices[i];
                model.vertex.x.push(v.x);
                model.vertex.y.push(v.y);
                model.vertex.z.push(v.z);
            }
            var data = writePLY(model);
            return data;
        }
        */

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
            document.addEventListener('mousemove', handleMouseMove, false);
            document.addEventListener('mousedown', handleMouseDown, false);
            document.addEventListener('mouseup', handleMouseUp, false);
            document.addEventListener('touchstart', handleTouchStart, false);
            document.addEventListener('touchend', handleTouchEnd, false);
            document.addEventListener('touchmove', handleTouchMove, false);
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
                return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
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
    }]);

    var GPoint = function() {
        var unit = {
            x: 0.09,
            y: 0.09,
            z: 0.3
        };

        function GPoint(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
        GPoint.prototype = {
            randomize: function() {
                this.x = Math.random() * 1000;
                this.y = Math.random() * 1000;
                this.z = Math.random() * 1000;
                return this;
            },
            toGrid: function() {
                this.x = (Math.round(this.x / unit.x) * unit.x);
                this.y = (Math.round(this.y / unit.y) * unit.y);
                this.z = (Math.round(this.z / unit.z) * unit.z);
                return this;
            },
            toFixed: function() {
                this.x = +(this.x.toFixed(2));
                this.y = +(this.y.toFixed(2));
                this.z = +(this.z.toFixed(2));
                return this;
            },
        };
        GPoint.grid = function(points) {
            for (var i = 0; i < points.length; i++) {
                points[i].toGrid().toFixed();
            }
            GPoint.sort(points);
        };
        GPoint.sort = function(points) {
            points.sort(function(a, b) {
                if (a.z === b.z) {
                    if (a.x === b.x) {
                        if (a.y === b.y) {
                            return 0;
                        } else {
                            return a.y > b.y ? 1 : -1;
                        }
                    } else {
                        return a.x > b.x ? 1 : -1;
                    }
                } else {
                    return a.z > b.z ? 1 : -1;
                }
            });
        };
        return GPoint;
    }();

}());