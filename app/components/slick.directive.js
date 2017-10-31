/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('slickTunnel', ['$timeout', 'StepperService', 'SceneOptions', function($timeout, StepperService, SceneOptions) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                var options = SceneOptions;
                var stepper = StepperService;

                function unSlick() {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('unslick');
                    }
                }

                function onSlick() {
                    unSlick();
                    element.slick({
                        arrows: false,
                        dots: false,
                        fade: true,
                        speed: 1100,
                        infinite: false,
                        draggable: false,
                        asNavFor: options.useBackground ? '.tunnel-bg' : null,
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
                        initialSlide: stepper.current,
                    });
                }

                function showLetters() {
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, {
                        delay: 0.2,
                        y: 0,
                        x: 0,
                        ease: Power3.easeInOut,
                        className: '+=viewed',
                        onComplete: function() {
                            $('.slick-active .cta').addClass('active');
                        }
                    }, 0.009);
                }

                function hideLetters() {
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, {
                        delay: 0,
                        y: 100,
                        x: 50,
                        ease: Power3.easeInOut,
                        className: '-=viewed'
                    }, 0.009);
                    $('.slick-active .cta').removeClass('active');
                }

                function onInit() {
                    // console.log('onInit');
                    $timeout(function() {
                        showLetters();
                    }, 1000);
                    scope.$root.$broadcast('onSlickInit');
                }

                function onBeforeChange(event, slick, currentSlide, nextSlide) {
                    stepper.slicking = true;
                    hideLetters();
                    // console.log('onBeforeChange');               
                    scope.$root.$broadcast('onSlickBeforeChange', { current: nextSlide, previouse: currentSlide });
                }

                function onAfterChange(event, slick, currentSlide) {
                    stepper.slicking = false;
                    showLetters();
                    console.log('onAfterChange');
                    scope.$root.$broadcast('onSlickAfterChange', { current: currentSlide });
                }

                function onWheel(e) {
                    if (stepper.slicking) {
                        return;
                    }
                    if (element.hasClass('slick-initialized')) {
                        if (e.deltaX > 0 || e.deltaY < 0) {
                            element.slick('slickNext');
                        } else if (e.deltaX < 0 || e.deltaY > 0) {
                            element.slick('slickPrev');
                        }
                    }
                    e.preventDefault();
                }

                function addListeners() {
                    element
                        .on('init', onInit)
                        .on('beforeChange', onBeforeChange)
                        .on('afterChange', onAfterChange)
                        .on('mousewheel', onWheel);
                }

                function removeListeners() {
                    element
                        .off('init', onInit)
                        .off('beforeChange', onBeforeChange)
                        .off('afterChange', onAfterChange)
                        .off('mousewheel', onWheel);
                }

                addListeners();

                scope.$watchCollection(attributes.slickTunnel, function(items) {
                    if (items && items.length) {
                        onSlick();
                    }
                });

                scope.$on('onGoStep', function($scope, index) {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('slickGoTo', index);
                    }
                });

                scope.$on('$destroy', function() {
                    removeListeners();
                    unSlick();
                });
            }
        };
    }]);

    app.directive('slickBackgrounds', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                function unSlick() {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('unslick');
                    }
                }

                function onSlick() {
                    unSlick();
                    element.slick({
                        arrows: false,
                        dots: false,
                        fade: true,
                        speed: 1100,
                        infinite: false,
                        lazyLoad: 'ondemand',
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
                    });
                }

                scope.$watchCollection(attributes.slickBackgrounds, function(items) {
                    if (items && items.length) {
                        setTimeout(onSlick, 1)
                    }
                });

                scope.$on('$destroy', function() {
                    unSlick();
                });
            }
        };
    }]);

}());