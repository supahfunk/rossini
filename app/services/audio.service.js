/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.factory('AudioSound', ['$q', 'SceneOptions', function($q, SceneOptions) {

        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        var ctx = new AudioContext();
        var buffers = {};

        function AudioSound($options) {
            var options = {
                volume: 0.85,
                loop: false,
            };
            if ($options) {
                angular.extend(options, $options);
            }
            var sound = this;
            sound.options = options;
            sound.offset = options.offset || 0;
            this.addAnalyserNode();
            this.addGainNode();
        }

        AudioSound.prototype = {
            nodes: {},
            addGainNode: function() {
                var sound = this;
                var node = ctx.createGain ? ctx.createGain() : ctx.createGainNode();
                node.gain.value = sound.options.volume;
                // node.connect(ctx.destination);
                sound.nodes.gain = node;
            },
            addAnalyserNode: function() {
                var sound = this;
                if (sound.options.analyser) {
                    var node = ctx.createAnalyser();
                    node.fftSize = SceneOptions.audio.bands * 2;
                    sound.data = new Uint8Array(node.frequencyBinCount);
                    sound.nodes.analyser = node;
                }
            },
            connectNodes: function() {
                var sound = this;
                var source = sound.source;
                for (var p in sound.nodes) {
                    var node = sound.nodes[p];
                    source.connect(node);
                    if (p === 'gain') {
                        node.connect(ctx.destination);
                    }
                }
                console.log('connectNodes', sound.nodes);
            },
            disconnect: function() {
                var sound = this;
                var source = sound.source;
                if (source) {
                    for (var p in sound.nodes) {
                        var node = sound.nodes[p];
                        if (p === 'gain') {
                            node.disconnect(ctx.destination);
                        }
                        source.disconnect(sound.nodes[p]);
                        console.log('AudioSound.disconnect', p);
                    }
                    // source.diconnect();
                    sound.source = null;
                }
            },
            updateBuffer: function() {
                var deferred = $q.defer();
                var sound = this;
                var source = sound.source;
                sound.getBuffer().then(function(buffer) {
                    if (source) {
                        source.buffer = buffer;
                    } else {
                        source = ctx.createBufferSource();
                        source.buffer = buffer;
                        sound.source = source;
                        sound.connectNodes();
                    }
                    deferred.resolve(source);
                }, function(error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            },
            getBuffer: function() {
                console.log('AudioSound.getBuffer');
                var deferred = $q.defer();
                var path = this.path;
                var buffer = buffers[path];
                if (buffer) {
                    deferred.resolve(buffer);
                } else {
                    AudioSound.load(this).then(function(buffer) {
                        deferred.resolve(buffer);
                    }, function(error) {
                        deferred.reject(error);
                    });
                }
                return deferred.promise;
            },
            getSource: function() {
                var deferred = $q.defer();
                var sound = this;
                var source = sound.source;
                console.log('AudioSound.getSource', source);
                if (source) {
                    deferred.resolve(source);
                } else {
                    sound.getBuffer().then(function(buffer) {
                        var source = ctx.createBufferSource();
                        source.buffer = buffer;
                        sound.source = source;
                        sound.connectNodes();
                        deferred.resolve(source);
                    }, function(error) {
                        deferred.reject(error);
                    });
                }
                return deferred.promise;
            },
            play: function() {
                var sound = this;
                if (!sound.playing) {
                    var options = sound.options;
                    sound.getSource().then(function(source) {
                        sound.startTime = ctx.currentTime;
                        source.loop = options.loop;
                        if (typeof source.start === 'function') {
                            source.start(0, sound.offset); // when, offset, duration
                        } else {
                            source.noteOn(0, sound.offset); // when, offset, duration
                        }
                        sound.playing = true;
                    });
                }
                // ctx.resume(); ???
                console.log('AudioSound.play');
            },
            stop: function() {
                var sound = this;
                if (sound.playing) {
                    var source = sound.source;
                    if (source) {
                        sound.offset += sound.startTime ? (ctx.currentTime - sound.startTime) : 0;
                        console.log(sound.offset);
                        if (typeof source.stop === 'function') {
                            source.stop(0); // when
                        } else {
                            source.noteOff(0); // when
                        }
                        sound.disconnect();
                        sound.playing = false;
                        console.log('AudioSound.stop');
                        // ctx.suspend(); ???
                    }
                }
            },
            update: function() {
                var sound = this;
                if (sound.nodes.analyser) {
                    sound.nodes.analyser.getByteFrequencyData(sound.data);
                }
            },
            setPath: function(path) {
                var sound = this;
                if (path && sound.path !== path) {
                    sound.stop();
                    sound.path = path;
                    sound.offset = sound.options.offset || 0;
                    console.log('AudioSound.setPath', path);
                }
            },
            setVolume: function(volume) {
                var sound = this;
                if (volume !== sound.options.volume) {
                    sound.options.volume = volume;
                    sound.nodes.gain.gain.value = volume;
                }
            }
        };

        function load(sound) {
            var deferred = $q.defer();
            var xhr = new XMLHttpRequest();
            xhr.responseType = "arraybuffer";
            xhr.open("GET", sound.path, true);
            xhr.onload = function() {
                ctx.decodeAudioData(xhr.response, function(buffer) {
                    if (!buffer) {
                        console.log('AudioSound.load.decodeAudioData.error', sound.path);
                        deferred.reject('AudioSound.load.decodeAudioData.error');
                        return;
                    }
                    // console.log('AudioSound.decodeAudioData', sound.path);
                    buffers[sound.path] = buffer;
                    deferred.resolve(buffer);
                });
            };
            xhr.onerror = function(error) {
                console.log('AudioManager.xhr.onerror', error);
                deferred.reject(error);
            };
            xhr.send();
            return deferred.promise;
        }

        AudioSound.load = load;

        return AudioSound;
    }]);

    app.service('AudioService', ['$rootScope', '$timeout', '$q', '$http', 'AudioSound', 'SceneOptions', 'StepperService', function($rootScope, $timeout, $q, $http, AudioSound, SceneOptions, StepperService) {

        var service = this;
        var options = SceneOptions;
        var stepper = StepperService;
        var sound = new AudioSound({
            analyser: true,
        });

        function getData() {
            return sound.data;
        }

        function setStep() {
            var step = stepper.getCurrentStep();
            setPath(step.audio ? step.audio.url : null);
        }

        function setPath(path) {
            sound.setPath(path);
            play();
        }

        function setVolume(volume) {
            sound.setVolume(volume);
        }

        function update() {
            if (service.active && sound.playing) {
                sound.setVolume(options.audio.volume);
                sound.update();
            }
        }

        function play() {
            if (service.active && sound.path && !sound.playing) {
                sound.play();
            }
        }

        function pause() {
            if (sound.playing) {
                sound.stop();
            }
        }

        function toggle() {
            service.active = !service.active;
            if (service.active) {
                play();
            } else {
                pause();
            }
        }

        function isActive() {
            return service.active && sound.playing;
        }

        function isPlaying() {
            return sound.playing;
        }

        $rootScope.$on('onStepChanged', function($scope) {
            setStep();
        });

        $rootScope.$on('onOptionsChanged', function($scope) {
            sound.setVolume(options.audio.volume);
        });

        this.active = true;
        this.getData = getData;
        this.setVolume = setVolume;
        this.update = update;
        this.play = play;
        this.pause = pause;
        this.toggle = toggle;
        this.isPlaying = isPlaying;
        this.isActive = isActive;

    }]);
}());