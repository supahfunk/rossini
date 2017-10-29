/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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

        $scope.openDetail = function() {
            $.get(stepper.step.url, function(data) {
                $timeout(function() {
                    detail.active = true;
                    detail.html = data;
                });
            });
            return false;
        };

        $scope.detail = detail;

        console.log('RootCtrl', SceneOptions);

    }]);

}());