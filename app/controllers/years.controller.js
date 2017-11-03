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
            $scope.stepper = stepper;
            $scope.scene = scene;
            $scope.audio = AudioService;
            if ($route.current.$$route.originalPath.indexOf('/detail') !== -1) {
                $timeout(function() {
                    openDetail();
                });
            }
            $timeout(function() {
                stepper.navStep(stepper.current);
            }, 1000);
            // preloadAudio();
            var gui = new DatGui();
            state.ready();
        }

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

        $scope.state = state;
        $scope.options = options;
        $scope.detail = detail;
        $scope.openDetail = openDetail;
        $scope.closeDetail = closeDetail;

        $scope.$on('onStepChanged', function() {
            $ngSilentLocation.silent(stepper.step.url);
        });

        // console.log('YearsCtrl', $route, $routeParams);

    }]);

}());