/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('scrollbar', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes, model) {
                var native = element[0];
                var options = {
                    speed: 1,
                    damping: 0.1,
                    overscrollDamping: 1.0,
                    thumbMinSize: 20,
                    continuousScrolling: true,
                    alwaysShowTracks: false
                };

                function Init() {
                    var scrollbar = Scrollbar.init(native, options);
                    // console.log(scrollbar);
                    scope.$watch(scrollbar.contentEl.offsetHeight, function(height) {
                        scrollbar.update();
                    });
                }

                setTimeout(Init, 100);
            }
        };
    }]);

}());