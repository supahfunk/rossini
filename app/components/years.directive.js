/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('yearsFrom', [function() {
        return {
            restrict: 'A',
            scope: {
                from: '=yearsFrom',
                to: '=yearsTo',
            },
            link: function(scope, element, attributes) {

                function onChangeYears() {
                    // console.log('onChangeYears', scope.from, scope.to);

                    var yearFrom = element.find('.tunnel-year__from'),
                        yearTo = element.find('.tunnel-year__to'),
                        time = 2,
                        easing = Power3.easeOut,
                        years = {
                            from: yearFrom.html(),
                            to: yearTo.html()
                        };

                    if (scope.to) {
                        element.removeClass('one-year');
                        TweenLite.to(years, time, { to: scope.to, roundProps: 'year', onUpdate: updateYear, ease: easing });
                    } else {
                        element.addClass('one-year');
                        TweenLite.to(years, time, { to: scope.from, roundProps: 'year', onUpdate: updateYear, ease: easing });
                    }

                    TweenLite.to(years, time, { from: scope.from, roundProps: 'year', onUpdate: updateYear, ease: easing });

                    function updateYear() {
                        yearFrom.html(parseInt(years.from));
                        yearTo.html(parseInt(years.to));
                    }
                }

                scope.$watch('from', function(newValue, oldValue) {
                    if (newValue) {
                        onChangeYears();
                    }
                });

            }
        };
    }]);

}());