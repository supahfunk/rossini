/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('RootCtrl', ['$scope', 'SceneOptions', 'StepperService', 'AnalyserService', 'DatGui', function($scope, SceneOptions, StepperService, AnalyserService, DatGui) {

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

    }]);

}());