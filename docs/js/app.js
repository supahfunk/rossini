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

        var scene, camera, controls, fov, ratio, near, far, shadow, back, light, renderer, container, particles, lines, width, height, w2, h2, mouse = { x: 0, y: 0 };

        function createLights() {
            light = new THREE.HemisphereLight(0xffffff, 0xffffff, .5)
            shadow = new THREE.DirectionalLight(0xffffff, .8);
            shadow.position.set(200, 200, 200);
            shadow.castShadow = true;
            // shadow.shadowDarkness = .2;
            back = new THREE.DirectionalLight(0xffffff, .4);
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
            // scene.fog = new THREE.Fog(0x363d3d, -1, 3000 );
            camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
            camera.position.z = 100;
            camera.position.y = -300;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setSize(width, height);
            renderer.shadowMap.enabled = true;
            container = document.getElementById('scene');
            container.appendChild(renderer.domElement);

            var stats = new Stats();
            container.appendChild(stats.dom);

            addListeners();
            controls = new THREE.OrbitControls(camera, renderer.domElement);
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
            document.addEventListener('mousemove', handleMouseMove, false);
            document.addEventListener('mousedown', handleMouseDown, false);
            document.addEventListener('mouseup', handleMouseUp, false);
            document.addEventListener('touchstart', handleTouchStart, false);
            document.addEventListener('touchend', handleTouchEnd, false);
            document.addEventListener('touchmove', handleTouchMove, false);
        }

        function loop() {
            particles.rotation.z -= 0.0025;
            render();
            requestAnimationFrame(loop);
        }

        function render() {
            if (controls) {
                controls.update();
            }
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

        function createObjects() {
            var texture, geometry, material;
            // PARTICLES
            texture = new THREE.CanvasTexture(sprite());
            geometry = new THREE.Geometry();
            material = new THREE.PointsMaterial({
                size: 12,
                map: texture,
                vertexColors: THREE.VertexColors,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true
            });
            particles = new THREE.Points(geometry, material);
            scene.add(particles);
            // LINES
            geometry = new THREE.Geometry();
            material = new THREE.LineDashedMaterial({
                color: 0x000000,
                dashSize: 1,
                gapSize: 0.5,
            });
            lines = new THREE.Line(geometry, material);
            scene.add(lines);
        }

        createScene();
        createObjects();
        // createLights();
        loop();

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

        function lcg(value, modulus, multiplier, increment) {
            modulus = modulus || Math.pow(2, 31);
            multiplier = multiplier || 1103515245;
            increment = increment || 12345;
            return (value * multiplier + increment) % modulus;
        }

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

        function addSplines(points) {
            var subdivisions = 6;
            var recursion = 1;
            var spline = new THREE.CatmullRomCurve3(points);
            var geometry = new THREE.Geometry();
            /*
            var i = 0,
                t = points.length * subdivisions;
            while (i < t) {
                var index = i / (points.length * subdivisions);
                var p = spline.getPoint(index);
                geometry.vertices[i] = new THREE.Vector3(p.x, p.y, p.z);
                i++;
            }
            */
            geometry.vertices = spline.getPoints(500);
            // geometry.computeLineDistances();
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;
            lines.geometry = geometry;
        }

        function onChange(params) {
            // alert('onChange', params);
            /*
            var dx = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dy = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dz = 40 - 40 * params.dispersion * (1 - params.bulge);
            */
            var geometry = new THREE.Geometry();
            // geometry.vertices.splice(0, geometry.vertices.length);
            var points = new Array(250).fill(null).map(function() {
                return {
                    x: -500 + Math.random() * 1000,
                    y: -500 + Math.random() * 1000,
                    z: -500 + Math.random() * 1000,
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
                geometry.colors.push(new THREE.Color(0, 0, 0));
                i++;
            }
            geometry.mergeVertices();
            geometry.verticesNeedUpdate = true;
            particles.geometry = geometry;
            addSplines(points);
        }

        function __onChange(params) {
            // alert('onChange', data);
            var dx = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dy = 10 - 10 * params.dispersion * (1 - params.bulge);
            var dz = 40 - 40 * params.dispersion * (1 - params.bulge);
            // var geometry = particles.geometry;
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
            particles.geometry = geometry;
        }

        var gui = function datgui() {
            var gui = new dat.GUI();
            gui.closed = true;
            /*
            gui.add(params, 'arms', 1, 10).onChange(function(newValue) {
                onChange(params);
            });
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
            return gui;
        }();

        onChange(params);

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

    }]);

}());