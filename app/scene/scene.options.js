/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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
        ribbon: {
            steps: 12,
            points: 24,
            vertices: 2400,
        },
        circle: {
            position: new THREE.Vector3(),
            radius: 200,
            lines: 24,
            points: 128,
        },
        audio: {
            volume: 0.9,
            bands: 128,
        },
        audioStrength: 100,
        noiseStrength: 25,
        circularStrength: 0.90,
    });

}());