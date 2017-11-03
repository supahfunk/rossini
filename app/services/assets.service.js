/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('AssetService', ['$q', function($q) {

        var service = this;
        var images = {};

        function preload(items, onprogress) {
            var deferred = $q.defer();
            var paths = {};
            var progress = {
                loaded: 0,
                total: 0,
            };

            function _onprogress(progress) {
                paths[progress.path] = progress;
                var p = 0;
                angular.forEach(paths, function(item) {
                    progress.loaded += item.loaded;
                    progress.total += item.total;
                });
                progress.progress = progress.loaded / progress.total;
                onprogress(progress);
            }
            $q.all(
                items.map(function(path) {
                    return load(path, _onprogress);
                })
            ).then(function() {
                progress.loaded = progress.total;
                progress.progress = 1;
                onprogress(progress);
                deferred.resolve();
            }, function(error) {
                console.log('AssetService.preload.error', error);
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function load(path, onprogress) {
            var deferred = $q.defer();
            var progress = {
                path: path,
                loaded: 0,
                total: 1,
            };
            var xhr = new XMLHttpRequest();
            xhr.responseType = "arraybuffer";
            xhr.open("GET", path, true);
            xhr.onload = function() {
                var blob = new Blob([xhr.response]);
                var image = new Image();
                image.src = window.URL.createObjectURL(blob);
                images[path] = image;
                deferred.resolve(image);
            };
            xhr.onerror = function(error) {
                console.log('AssetService.xhr.onerror', error);
                deferred.reject(error);
            };
            if (onprogress) {
                xhr.onprogress = function(e) {
                    progress.loaded = e.loaded;
                    progress.total = e.total;
                    progress.progress = e.loaded / e.total;
                    onprogress(progress);
                };
                /*
                xhr.onloadstart = function(e) {
                    progress.loaded = 0;
                    progress.total = 1;
                    progress.progress = 0;
                    onprogress(progress);
                };
                xhr.onloadend = function(e) {
                    progress.loaded = progress.total;
                    progress.progress = 1;
                    onprogress(progress);
                };
                */
            }
            xhr.send();
            return deferred.promise;
        }

        this.load = load;
        this.preload = preload;
        this.images = images;

    }]);

}());