/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('AnalyserService', ['$rootScope', '$timeout', '$q', '$http', 'SceneOptions', 'StepperService', function($rootScope, $timeout, $q, $http, SceneOptions, StepperService) {

        var service = this;
        var options = SceneOptions;
        var stepper = StepperService;

        var analyser, audio, audioUrl;

        var audioContext = (window.AudioContext || window.webkitAudioContext);
        var analyserContext = new audioContext();
        analyser = analyserContext.createAnalyser();

        audio = new Audio();
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        var source = null;

        function onCanPlay() {
            // console.log('AnalyserService.onCanPlay');
            if (!source) {
                var bufferLength;
                source = analyserContext.createMediaElementSource(audio);
                source.smoothingTimeConstant = 0.85;
                source.connect(analyser);
                source.connect(analyserContext.destination);
                analyser.fftSize = options.audio.bands * 2;
                bufferLength = analyser.frequencyBinCount;
                service.data = new Uint8Array(bufferLength);
            }
            // return service.data;
        }

        function onPlay() {
            $timeout(function() {
                service.playing = true;
                // console.log('AnalyserService.onPlay', service);
            });
        }

        function onPause() {
            $timeout(function() {
                service.playing = false;
                // console.log('AnalyserService.onPause', service);
            });
        }

        function onEnded() {
            $timeout(function() {
                service.playing = false;
                // console.log('AnalyserService.onEnded', service);
            });
        }

        function setAudioUrl($audioUrl) {
            if (audioUrl !== $audioUrl) {
                audioUrl = $audioUrl;
                if (audioUrl) {
                    audio.src = $audioUrl;
                    audio.volume = options.audio.volume;
                    // console.log('AnalyserService.setAudioUrl', $audioUrl);
                    play();
                }
            }
        }

        function play() {
            if (service.active && audioUrl && !isPlaying()) {
                audio.play();
            }
        }

        function pause() {
            if (audioUrl && isPlaying()) {
                audio.pause();
            }
        }

        function isActive() {
            // console.log('isActive', service.active, isPlaying());
            return service.active && isPlaying();
        }

        function isPlaying() {
            return !audio.paused && !audio.ended; //  && audio.currentTime > 0;
        }

        function toggle() {
            service.active = !service.active;
            if (service.active) {
                play();
            } else {
                pause();
            }
        }

        function setStep() {
            var step = stepper.getCurrentStep();
            setAudioUrl(step.audio ? step.audio.url : null);
        }

        function update() {
            if (service.data) {
                analyser.getByteFrequencyData(service.data);
            }
        }

        service.unlocked = false;

        function unlock() {
            var deferred = $q.defer();
            if (!options.device.ios || service.unlocked) {
                deferred.resolve();
            } else {
                source = doUnlock();
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

        function doUnlock() {
            // create empty buffer
            var ctx = new audioContext();
            var source = ctx.createBufferSource();
            var buffer = ctx.createBuffer(1, 1, 22050);
            source.buffer = buffer;

            // connect to output (your speakers)
            source.connect(ctx.destination);

            // play the file
            if (source.noteOn) {
                source.noteOn(0);
            }

            console.log('AudioAnalyser.doUnlock');
            return source;
        }

        window.addEventListener('touchstart', unlock, false);

        $rootScope.$on('onStepChanged', function($scope) {
            setStep();
        });

        $rootScope.$on('onOptionsChanged', function($scope) {
            audio.volume = options.audio.volume;
        });

        this.active = true;
        this.data = null;
        this.audio = audio;
        this.update = update;
        this.play = play;
        this.pause = pause;
        this.toggle = toggle;
        this.unlock = unlock;
        this.isPlaying = isPlaying;
        this.isActive = isActive;

    }]);

}());