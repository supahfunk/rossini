/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('RootCtrl', ['$scope', '$route', '$location', '$http', '$timeout', '$ngSilentLocation', 'StepperService', function($scope, $route, $location, $http, $timeout, $ngSilentLocation, StepperService) {

        $http.get('json/menu-rossini.js').then(function(response) {
            addMenu(response.data);

        }, function(error) {
            console.log('RootCtrl.error', error);

        });

        function addMenu(menu) {

            function parse(items, parent) {
                if (items) {
                    angular.forEach(items, function(item) {
                        item.parent = parent;
                        if (item.years) {
                            item.years.key = String(item.years.to ? item.years.from + '-' + item.years.to : item.years.from); // da riattivare !!!
                            item.url = '/years/' + item.years.key;
                            // item.detailUrl = item.url + '/detail';
                        }
                        parse(item.items, item);
                    });
                }
            }
            parse(menu);

            $scope.menu = menu;

            $timeout(function() {
                nav();
            }, 100);
        }

        function updateStepper(item) {
            var stepper = StepperService;
            var steps = stepper.steps;
            var index = -1;
            angular.forEach(steps, function(step, i) {
                if (step.url === item.url) {
                    index = i;
                }
            });
            if (index !== -1) {
                stepper.navStep(index);
                $ngSilentLocation.silent(item.url);
            }
        }

        function navTo(item, lvl) {
            itemToggle(item);
            $scope.submenu = null;
            if (item.url) {
                if (item.url.indexOf('/years') !== -1 && $route.current.$$route.originalPath.indexOf('/years') !== -1) {
                    updateStepper(item);
                    closeNav();

                } else {
                    // $location.path(item.url);
                }
                console.log('RootCtrl.navTo', item.url);
            } else if (lvl === 2 && item.items) {
                $scope.submenu = item;
            }
        }

        function isNavActive(item) {
            return false;
        }

        function itemOpen(item) {
            item.active = true;
            item.closed = item.closing = false;
            item.opening = true;
            $timeout(function() {
                item.opening = false;
                item.opened = true;
            });
        }

        function itemClose(item) {
            item.active = false;
            item.opened = item.opening = false;
            item.closing = true;
            $timeout(function() {
                item.closing = false;
                item.closed = true;
            });
        }

        function itemToggle(item) {
            item.active = !item.active;
            if (item.active) {
                if (item.parent) {
                    item.parent.items.filter(function(o) {
                        if (o !== item) {
                            itemClose(o);
                        }
                    });
                }
                itemOpen(item);
            } else {
                itemClose(item);
            }
        }

        $scope.navTo = navTo;
        $scope.isNavActive = isNavActive;

    }]);

}());