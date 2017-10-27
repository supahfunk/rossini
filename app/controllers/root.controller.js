/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

<<<<<<< HEAD
    app.controller('RootCtrl', ['$scope', 'SceneOptions', 'StepperService', 'AnalyserService', 'DatGui', function($scope, SceneOptions, StepperService, AnalyserService, DatGui) {
=======
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
>>>>>>> c80f63423fcf9794e39932cdc0b9d9b9baf054ab

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

<<<<<<< HEAD
        console.log('RootCtrl', SceneOptions);
=======
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
>>>>>>> c80f63423fcf9794e39932cdc0b9d9b9baf054ab

    }]);

}());