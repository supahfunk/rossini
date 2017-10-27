/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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

    app.directive('slickTunnel', [function() {
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
                        draggable: false,
                        asNavFor: '.tunnel-bg',
                        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
                    });
                }

                scope.$watchCollection(attributes.slickTunnel, function(items) {
                    if (items && items.length) {
                        onSlick();
                    }
                });

                var tunnelAnimating = false;

                function onInit() {
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

                function onBeforeChange(event, slick, currentSlide, nextSlide) {
                    tunnelAnimating = true;
                    var letters = $('.slick-active .splitted-letter');
                    TweenMax.staggerTo(letters, 1, { delay: 0, y: 100, x: 50, ease: Power3.easeInOut, className: '-=viewed' }, 0.009);
                    $('.slick-active .cta').removeClass('active');
                    /*
                    var $next = $(slick.$slides.get(nextSlide)).find('.tunnel-slick__item');
                    var from = $next.attr('data-from');
                    var to = $next.attr('data-to');
                    changeYear(from, to);
                    var bg = $next.attr('data-bg');
                    $('body').removeClass('light-bg dark-bg');
                    $('body').addClass(bg + '-bg');
                    switchScene(nextSlide);
                    */
                    scope.$root.$broadcast('onSlickBeforeChange', { current: nextSlide, previouse: currentSlide });
                }

                function onAfterChange() {
                    tunnelAnimating = false;
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
                    scope.$root.$broadcast('onAfterChange');
                }

                function onWheel(e) {
                    if (tunnelAnimating) {
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

                scope.$on('onGoStep', function($scope, index) {
                    if (element.hasClass('slick-initialized')) {
                        element.slick('slickGoTo', index);
                    }
                });

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

                scope.$on('$destroy', function() {
                    removeListeners();
                    unSlick();
                });
            }
        };
    }]);

}());