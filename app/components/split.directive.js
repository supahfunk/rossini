/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('splitText', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                function splitText() {

                    var nodes = element[0].childNodes;
                    nodes = Array.prototype.slice.call(nodes, 0);

                    element.html('').addClass('active');

                    var rows = [
                        []
                    ];

                    nodes.filter(function(node) {
                        return node.nodeType === 3 || node.nodeType === 1;
                    }).map(function(node) {
                        if (node.nodeType === 3) {
                            node = { text: $.trim(node.textContent), element: 'span' };
                        } else {
                            if (node.nodeName.toLowerCase() === 'br') {
                                rows.push([]);
                                return;
                            }
                            node = { text: $.trim(node.innerHTML), element: node.nodeName };
                        }
                        if (node.text !== '') {
                            rows[rows.length - 1].push(node);
                        }
                    });

                    for (var r = 0; r < rows.length; r++) {
                        /* Riga */
                        // console.log('riga ' + r, rows[r]);
                        var row = rows[r];
                        $('<div class="splitted-row"></div>').appendTo(element);

                        /* Elemento */
                        for (var e = 0; e < row.length; e++) {
                            var el = row[e];
                            var type = el.element.toLowerCase();
                            var text = el.text;
                            // console.log('\telemento ' + e, type, text);

                            /* Parola */
                            var words = text.split(' ');
                            for (var w = 0; w < words.length; w++) {
                                // console.log('\t\tword ' + w, words[w]);
                                $('<' + type + ' class="splitted-word"></' + type + '>').appendTo($('.splitted-row:last'), element);

                                /* Lettera */
                                var word = words[w];
                                var letters = word.split('');
                                for (var l = 0; l < letters.length; l++) {
                                    // console.log('\t\t\tlettera' + l, letters[l]);
                                    var letter = letters[l];
                                    $('<span class="splitted-letter" data-content="' + letter + '">' + letter + '</span>').appendTo($('.splitted-word:last'), element);
                                }
                                $('<span class="splitted-space">&nbsp;</span>').appendTo($('.splitted-word:last'), element);
                            }
                        }
                    }
                }

                setTimeout(function() {
                    splitText();
                }, 1);

            }
        };
    }]);

}());