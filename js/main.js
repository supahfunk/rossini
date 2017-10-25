/*--------------------------------------------------
R O S S I N I
website by Websolute
--------------------------------------------------*/


/*--------------------------------------------------
Nav
--------------------------------------------------*/
function nav() {
    $('.nav-toggle').on('click', function () {
        $('body').toggleClass('open-nav');
    });
}


/*--------------------------------------------------
Sound Toggle
--------------------------------------------------*/
function soundToggle() {
    $('.sound-toggle').on('click', function () {
        $(this).toggleClass('active');
    });
}


/*--------------------------------------------------
Split Text
--------------------------------------------------*/
function splitText(el) {
    $(el).each(function () {
        var $t = $(this),
            nodes = $t[0].childNodes;

        nodes = Array.prototype.slice.call(nodes, 0);

        $t.html('').addClass('active');

        var rows = [[]];
        nodes.filter(function (node) {
            return node.nodeType === 3 || node.nodeType === 1;
        }).map(function (node) {
            if (node.nodeType === 3) {
                node = { text: $.trim(node.textContent), element: 'span' };
            } else {
                if (node.nodeName.toLowerCase() === 'br') {
                    rows.push([]);
                    return;
                }
                node = { text: $.trim(node.innerHTML), element: node.nodeName };
            }
            if (node.text != '') {
                rows[rows.length - 1].push(node);
            }
        });

        for (r = 0; r < rows.length; r++) {
            /* Riga */
            // console.log('riga ' + r, rows[r]);
            var row = rows[r];
            $('<div class="splitted-row"></div>').appendTo($t);

            /* Elemento */
            for (e = 0; e < row.length; e++) {
                var el = row[e];
                var type = el.element.toLowerCase();
                var text = el.text;

                // console.log('\telemento ' + e, type, text);

                /* Parola */
                var words = text.split(' ');
                for (w = 0; w < words.length; w++) {
                    // console.log('\t\tword ' + w, words[w]);
                    $('<' + type + ' class="splitted-word"></' + type + '>').appendTo($('.splitted-row:last'), $t);

                    /* Lettera */
                    var word = words[w];
                    var letters = word.split('');
                    for (l = 0; l < letters.length; l++) {
                        // console.log('\t\t\tlettera' + l, letters[l]);
                        var letter = letters[l];
                        $('<span class="splitted-letter" data-content="' + letter + '">' + letter + '</span>').appendTo($('.splitted-word:last'), $t);
                    }

                    $('<span class="splitted-space">&nbsp;</span>').appendTo($('.splitted-word:last'), $t);
                }

            }
        }
    });

}


/*--------------------------------------------------
Switch Scene
--------------------------------------------------*/
function switchScene(scene) {
    console.log(scene);
}




/*--------------------------------------------------
ChangeYear
--------------------------------------------------*/
function changeYear(from, to) {
    $year = $('.tunnel-year');
    $from = $('.tunnel-year__from');
    $to = $('.tunnel-year__to');
    time = 2000;

    
    $({ starter: parseInt($from.text()) }).animate({ starter: parseInt(from) }, {
        duration: time,
        easing: Power3.easeInOut,
        step: function () {
            $from.text(Math.round(this.starter));
        },
        complete: function () {
            $from.text(Math.round(this.starter));
        }
    })

    if (to === 'false') {
        $year.addClass('one-year');
        $({ starter: parseInt($to.text()) }).animate({ starter: parseInt(from) }, {
            duration: time,
            easing: Power3.easeInOut,
            step: function () {
                $to.text(Math.round(this.starter));
            },
            complete: function () {
                $to.text(Math.round(this.starter));
            }
        })
    } else {
        $year.removeClass('one-year');
        
        $({ starter: parseInt($to.text()) }).animate({ starter: parseInt(to) }, {
            duration: time,
            easing: Power3.easeInOut,
            step: function () {
                $to.text(Math.round(this.starter));
            },
            complete: function () {
                $to.text(Math.round(this.starter));
            }
        })
    }
}


/*--------------------------------------------------
Tunnel
--------------------------------------------------*/
var tunnelAnimating = false;
function tunnel() {
    splitText('.tunnel-slick__header .h1');

    $('.tunnel-slick').on('mousewheel', function (e, delta) {
        if (tunnelAnimating) {
            return;
        }
        if (e.deltaX > 0 || e.deltaY < 0) {
            $(this).slick('slickNext');
            $('#tunnel-next').click();
        } else if (e.deltaX < 0 || e.deltaY > 0) {
            $(this).slick('slickPrev');
            $('#tunnel-prev').click();
        };
        e.preventDefault();
    }).on('init', function () {

        var letters = $('.slick-active .splitted-letter');

        TweenMax.staggerTo(letters, 1, {
            delay: 0.2, y: 0, x: 0, ease: Power3.easeInOut, className: '+=viewed', onComplete: function () {
                $('.slick-active .cta').addClass('active');
            }
        }, 0.009);

    }).on('beforeChange', function (event, slick, currentSlide, nextSlide) {

        tunnelAnimating = true;

        var letters = $('.slick-active .splitted-letter');
        TweenMax.staggerTo(letters, 1, { delay: 0, y: 100, x: 50, ease: Power3.easeInOut, className: '-=viewed' }, 0.009);
        $('.slick-active .cta').removeClass('active');


        var $next = $(slick.$slides.get(nextSlide)).find('.tunnel-slick__item');

        var from = $next.attr('data-from');
        var to = $next.attr('data-to');

        changeYear(from, to);
        switchScene(nextSlide);

    }).on('afterChange', function () {

        tunnelAnimating = false;

        var letters = $('.slick-active .splitted-letter');
        TweenMax.staggerTo(letters, 1, {
            delay: 0.2, y: 0, x: 0, ease: Power3.easeInOut, className: '+=viewed', onComplete: function () {
                $('.slick-active .cta').addClass('active');
            }
        }, 0.009);

    }).slick({
        arrows: false,
        dots: false,
        fade: true,
        speed: 1100,
        infinite: false,
        draggable: false,
        asNavFor: '.tunnel-bg',
        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
    });


    /* Background */
    $('.tunnel-bg').slick({
        arrows: false,
        dots: false,
        fade: true,
        speed: 1100,
        infinite: false,
        lazyLoad: 'ondemand',
        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
    });
}



/*--------------------------------------------------
Mouse Move
--------------------------------------------------*/
function mouseMove() {
    var lFollowX = 5,
        lFollowY = 10,
        x = 0,
        y = 0,
        friction = 1 / 12;

    $(window).on('mousemove', function (e) {
        var lMouseX = Math.max(-400, Math.min(400, $(window).width() / 2 - e.clientX));
        var lMouseY = Math.max(-400, Math.min(400, $(window).height() / 2 - e.clientY));
        lFollowX = (2 * lMouseX) / 100; // 100 : 2 = lMouxeX : lFollow
        lFollowY = (2 * lMouseY) / 100;
    });

    function animate() {
        x += (lFollowX - x) * friction;
        y += (lFollowY - y) * friction;

        $('.tunnel-bg .slick-active img').css({
            '-webit-transform': 'translate(' + x/5 + 'px, ' + y/5 + 'px)',
            '-moz-transform': 'translate(' + x/5 + 'px, ' + y/5 + 'px)',
            'transform': 'translate(' + x/5 + 'px, ' + y/5 + 'px)'
        });

        $('.tunnel-slick .slick-active .tunnel-slick__item').css({
            '-webit-transform': 'translate(' + -x + 'px, ' + -y * 3 + 'px)',
            '-moz-transform': 'translate(' + -x + 'px, ' + -y * 3 + 'px)',
            'transform': 'translate(' + -x + 'px, ' + -y * 3 + 'px)'
        });

        window.requestAnimationFrame(animate);
    }
    animate();
}




/*--------------------------------------------------
Doc Ready
--------------------------------------------------*/
$(function () {
    nav();
    soundToggle();
    tunnel();
    mouseMove();
});



/*--------------------------------------------------
Win Load
--------------------------------------------------*/
$(window).on('load', function () {
});
