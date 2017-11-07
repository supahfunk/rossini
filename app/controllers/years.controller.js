/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('YearsCtrl', ['$scope', '$timeout', '$route', '$routeParams', '$ngSilentLocation', '$q', 'State', 'SceneOptions', 'StepperService', 'AudioService', 'AssetService', 'DatGui', function($scope, $timeout, $route, $routeParams, $ngSilentLocation, $q, State, SceneOptions, StepperService, AudioService, AssetService, DatGui) {

        var state = new State();

        var scene = {
            objects: {},
            options: SceneOptions,
            stepper: StepperService,
            assets: AssetService,
        };

        var objects = scene.objects;
        var options = scene.options;
        var stepper = scene.stepper;
        var assets = scene.assets;

        state.busy();
        stepper.init($routeParams.yearsKey).then(function() {
            $scope.stepper = stepper;
            $scope.scene = scene;
            $scope.audio = AudioService;
            if (options.preload) {
                doPreload();
            } else {
                onReady();
            }
        });

        function doPreload() {
            function onprogress(item) {
                $timeout(function() {
                    $scope.progress = item;
                    // console.log('onprogress', item);
                });
            }
            $q.all([
                getAudioPromise(onprogress),
                getAssetPromise(onprogress),

            ]).then(function() {
                onReady();

            }, function(error) {
                console.log('YearsCtrl.error', error);
                state.error(error);

            });
        }

        function getAudioPromise(onprogress) {
            var paths = [];
            stepper.steps.filter(function(item) {
                if (item.audio && paths.indexOf(item.audio.url) == -1) {
                    paths.push(item.audio.url);
                }
            });
            // console.log('YearsCtrl.getAudioPromise', paths);
            return AudioService.preload(paths, onprogress);
        }

        function getAssetPromise(onprogress) {
            var paths = [];
            stepper.steps.filter(function(item) {
                if (item.circle && item.circle.texture && paths.indexOf(item.circle.texture) == -1) {
                    paths.push(item.circle.texture);
                }
            });
            // console.log('YearsCtrl.getAssetPromise', paths);
            return AssetService.preload(paths, onprogress);
        }

        function onReady() {
            $timeout(function() {
                stepper.navStep(stepper.current);
                if ($route.current.$$route.originalPath.indexOf('/detail') !== -1) {
                    $timeout(function() {
                        openDetail();
                    });
                }
            }, 1000);
            // preloadAudio();
            var gui = new DatGui();
            state.ready();
        }

        function openDetail() {
            $ngSilentLocation.silent(stepper.step.detailUrl);
            stepper.detail.active = true;
            stepper.detail.operas = [{
                "url": "audio/01-la-cambiale-di-matrimonio-sinfonia-128.mp3",
                "title": "La cambiale di matrimonio",
                "orchestra": "Orchestra Haydn di Bolzano e Trento"
            }, {
                "url": "audio/01-la-pietra-del-paragone-128.mp3",
                "title": "La pietra del paragone",
                "orchestra": "Orchestra Haydn di Bolzano e Trento"
            }, {
                "title": "Otello"
            }, {
                "title": "Mosè in Egitto"
            }, {
                "title": "Ivanhoé"
            }];
            return false;
        }

        function closeDetail() {
            $ngSilentLocation.silent(stepper.step.url);
            stepper.detail.active = false;
            return false;
        }

        $scope.state = state;
        $scope.options = options;
        $scope.openDetail = openDetail;
        $scope.closeDetail = closeDetail;

        $scope.$on('onStepChanged', function() {
            $ngSilentLocation.silent(stepper.step.url);
        });

        // console.log('YearsCtrl', $route, $routeParams);

    }]);

}());