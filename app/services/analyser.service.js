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
                var ctx = new audioContext();
                if (ctx) {
                    analyser = ctx.createAnalyser();
                    source = ctx.createMediaElementSource(audio);
                    source.smoothingTimeConstant = 0.85;
                    source.connect(analyser);
                    source.connect(ctx.destination);
                    analyser.fftSize = options.audio.bands * 2;
                    bufferLength = analyser.frequencyBinCount;
                    service.data = new Uint8Array(bufferLength);
                }
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
                var o = doUnlock();
                // by checking the play state after some time, we know if we're really unlocked
                $timeout(function() {
                    if (o && (o.playbackState === o.PLAYING_STATE || o.playbackState === o.FINISHED_STATE)) {
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
            var o = null;
            var ctx = new audioContext();
            if (ctx) {
                o = ctx.createBufferSource();
                var buffer = ctx.createBuffer(1, 1, 22050);
                o.buffer = buffer;
                // connect to output (your speakers)
                o.connect(ctx.destination);
                // play the file
                if (o.noteOn) {
                    o.noteOn(0);
                }
                console.log('AudioAnalyser.doUnlock');
            }
            return o;
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

    var AudioManager = function() {
        function AudioManager(ctx) {
            var manager = this;
            manager.ctx = ctx;
            manager.buffers = {};
            manager.sounds = {};
        }

        AudioManager.prototype = {
            add: function(sound) {
                var path = sound.path;
                var manager = this;
                var xhr = new XMLHttpRequest();
                xhr.responseType = "arraybuffer";
                xhr.open("GET", path, true);
                xhr.onload = function() {
                    // Asynchronously decode the audio file data in xhr.response
                    manager.ctx.decodeAudioData(xhr.response, function(buffer) {
                        if (!buffer) {
                            console.log('AudioManager.decodeAudioData.error', path);
                            return;
                        }
                        console.log('AudioManager.decodeAudioData', path);
                        manager.buffers[path] = buffer;
                        if (sound.shouldPlay) {
                            sound.play();
                        }
                    });
                };
                xhr.onerror = function(error) {
                    console.log('AudioManager.xhr.onerror', error);
                };
                xhr.send();
            },
            stop: function(sound) {
                var path = sound.path;
                var manager = this;
                if (manager.sounds.hasOwnProperty(path)) {
                    for (var p in manager.sounds[path]) {
                        if (manager.sounds[path].hasOwnProperty(p)) {
                            manager.sounds[path][p].noteOff(0);
                        }
                    }
                }
            }
        };

        var _instance;

        function getInstance() {
            if (_instance) {
                return _instance;
            } else {
                var _ctx = getAudioContext();
                if (_ctx) {
                    _instance = new AudioManager(_ctx);
                }
            }
            return _instance;
        }

        var _ctx;

        function getAudioContext() {
            if (_ctx) {
                return _ctx;
            } else {
                try {
                    var _AudioContext = window.AudioContext || window.webkitAudioContext;
                    _ctx = new _AudioContext();
                } catch (e) {
                    console.log("No Web Audio API support");
                    _ctx = null;
                }
            }
            return _ctx;
        }

        AudioManager.getInstance = getInstance;
        AudioManager.getAudioContext = getAudioContext;

        return AudioManager;
    }();

    var AudioSound = function() {

        function AudioSound(path, options) {
            var defaultOptions = {
                volume: 85,
                loop: false,
            };
            if (options) {
                angular.extend(defaultOptions, options);
            }
            var manager = AudioManager.getInstance();
            var sound = this;
            sound.path = path;
            sound.options = defaultOptions;
            sound.manager = manager;
            sound.setVolume(defaultOptions.volume);
            manager.add(sound);
        }

        AudioSound.translateVolume = function(volume, inverse) {
            return inverse ? volume * 100 : volume / 100;
        };

        AudioSound.prototype = {
            play: function() {
                var sound = this;
                var path = sound.path;
                var manager = sound.manager;
                var buffer = manager.buffers[path];
                // Only play if it's loaded yet
                if (typeof buffer !== "undefined") {
                    var source = sound.getSource(buffer);
                    source.loop = sound.options.loop;
                    if (source.start) {
                        source.start(0); // (0, 2, 1);
                    } else {
                        source.noteOn(0); // (0, 2, 1);
                    }
                    // source.noteOn(0);
                    if (!manager.sounds.hasOwnProperty(path)) {
                        manager.sounds[path] = [];
                    }
                    manager.sounds[path].push(source);
                    sound.shouldPlay = false;
                } else {
                    sound.shouldPlay = true;
                }
                console.log('AudioSound.play', path);
            },
            stop: function() {
                var sound = this;
                sound.manager.stop(sound);
            },
            getVolume: function() {
                return AudioSound.translateVolume(this.volume, true);
            },
            // Expect to receive in range 0-100
            setVolume: function(volume) {
                this.volume = AudioSound.translateVolume(volume);
            },
            getSource: function(buffer) {
                var sound = this;
                var ctx = sound.manager.ctx;
                var source = ctx.createBufferSource();
                var gainNode = ctx.createGain ? ctx.createGain() : ctx.createGainNode();
                gainNode.gain.value = sound.volume;
                source.buffer = buffer;
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
                return source;
            }
        };

        return AudioSound;
    }();

    // USAGE
    /*
    var background = new AudioSound('audio/07-rossini-192-short.mp3', {
        loop: true,
    });
    background.play();
    setTimeout(function() {
        background.stop();
    }, 2 * 60 * 1000);
    */

    /*
    var blastSound, smashSound, backgroundMusic;
    blastSound = new AudioSound("blast.mp3");
    smashSound = new AudioSound("smash.mp3");
    backgroundMusic = new AudioSound("smooth-jazz.mp3", {loop: true});
    backgroundMusic.play();
    blastSound.play();
    smashSound.play();
    //Play background music for 30 seconds
    setTimeout(function(){
        backgroundMusic.stop();
    }, 30 * 1000);
    */

}());