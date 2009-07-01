/* This script finds pre.fake-gist elements with an ID containing the gist ID,
 * and upgrades them in place into the syntax highlighted version */

/* Copyright 2009 Yuval Kogman, MIT license */

jQuery(function ($) {
    $(document).ready(function () {
        $('pre.fake-gist[id]').each(function () {
            var $this = $(this);
            var id = $this.attr('id').match(/\d+/)[0];

            $this.removeAttr('id').wrap(
                /* first we wrap with the various classes */
                '<div class="gist">' +
                    '<div class="gist-file">' +
                        '<div class="gist-data gist-syntax">' +
                            '<div class="gist-highlight">' +
                                '<div class="line nn"></div>' +
                            '</div>' +
                        '</div>' +
                        /* and add the blurb at the bottom (no raw link though) */
                        '<div class="gist-meta">' +
                            '<a href="http://gist.github.com/'+ id +'">This Gist</a>' +
                            ' brought to you by <a href="http://github.com">GitHub</a>.' +
                        '</div>' +
                    '</div>' +
                '</div>'
            ).parents('div.gist:first').attr('id', 'fake-gist-'+id);

        });
    });

    $(window).load(function () {
        $('div.gist[id]').each(function () {
            var id = $(this).attr('id').match(/\d+/)[0];

            /* asynchronously fetch the gist data */
            $.getJSON("http://gist.github.com/"+ id +".json?callback=?", function (gist) {
                /* Figure out if we need to add the stylesheet
                 *
                 * for some reason
                 * $("link[rel=stylesheet][href='" + gist.stylehseet + "']").length == 0
                 * doesn't work */
                var add_stylesheet = true;
                $("link[rel=stylesheet]").each(function (i,e) {
                    if ( $(e).attr('href') == gist.stylesheet )
                        add_stylesheet = false;
                });

                /* if the stylesheet is not yet in the document, add it */
                if ( add_stylesheet )
                    $("head").append('<link rel="stylesheet" href="' + gist.stylesheet + '" />');

                /* find the fake gist and replace it with the marked up one */
                $('#fake-gist-'+gist.repo).replaceWith(gist.div);
            });
        });
    });
});


