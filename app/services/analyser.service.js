/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('AnalyserService', ['$rootScope', '$q', '$http', 'SceneOptions', 'StepperService', function($rootScope, $q, $http, SceneOptions, StepperService) {

        var service = this;
        var options = SceneOptions;
        var stepper = StepperService;

        var analyser, audio, audioUrl;

        var aContext = (window.AudioContext || window.webkitAudioContext);
        var analyserContext = new aContext();
        analyser = analyserContext.createAnalyser();

        audio = new Audio();
        audio.addEventListener('canplay', attachAnalyser);

        var source = null;

        function attachAnalyser() {
            if (!source) {
                var bufferLength;
                source = analyserContext.createMediaElementSource(audio);
                source.connect(analyser);
                source.connect(analyserContext.destination);
                analyser.fftSize = options.audio.bands * 2;
                bufferLength = analyser.frequencyBinCount;
                service.data = new Uint8Array(bufferLength);
                // console.log('AnalyserService.attachAnalyser');
            }
            return service.data;
        }

        function setAudioUrl($audioUrl) {
            if (audioUrl !== $audioUrl) {
                audioUrl = $audioUrl;
                audio.src = $audioUrl;
                audio.volume = options.audio.volume;
                // console.log('AnalyserService.setAudioUrl', $audioUrl);
                // audio.play(); // !!! RIATTIVARE
            }
        }

        function play() {
            if (audio) {
                audio.play();
            }
        }

        function pause() {
            if (audio) {
                audio.pause();
            }
        }

        function toggle() {
            if (audio) {
                service.active = !service.active;
                if (service.active) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        }

        function setStep() {
            var step = stepper.getCurrentStep();
            setAudioUrl(step.audio.url);
        }

        function update() {
            if (service.data) {
                analyser.getByteFrequencyData(service.data);
            }
        }

        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        service.unlocked = false;

        function unlock(e) {
            var deferred = $q.defer();
            if (!isIOS || service.unlocked) {
                deferred.resolve();
            } else {
                doUnlock(e);
                // by checking the play state after some time, we know if we're really unlocked
                $timeout(function() {
                    if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                        service.unlocked = true;
                        deferred.resolve();
                    }
                });
            }
            console.log('AudioAnalyser.unlock');
            return deferred.promise;
        }

        function doUnlock(e) {
            // create empty buffer
            var buffer = myContext.createBuffer(1, 1, 22050);
            var source = myContext.createBufferSource();
            source.buffer = buffer;

            // connect to output (your speakers)
            source.connect(myContext.destination);

            // play the file
            source.noteOn(0);
            console.log('AudioAnalyser.doUnlock');
        }

        window.addEventListener('touchstart', unlock, false);

        $rootScope.$on('onStepChanged', function($scope) {
            setStep();
        });

        $rootScope.$on('onOptionsChanged', function($scope) {
            if (audio) {
                audio.volume = options.audio.volume;
            }
        });

        this.active = true;
        this.data = null;
        this.audio = audio;
        this.update = update;
        this.play = play;
        this.pause = pause;
        this.toggle = toggle;
        this.unlock = unlock;

    }]);

}());