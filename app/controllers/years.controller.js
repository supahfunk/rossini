/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('YearsCtrl', ['$scope', '$route', '$routeParams', '$ngSilentLocation', 'SceneOptions', 'StepperService', 'AudioService', 'DatGui', '$timeout', function($scope, $route, $routeParams, $ngSilentLocation, SceneOptions, StepperService, AudioService, DatGui, $timeout) {

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
            $scope.audio = AudioService;
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