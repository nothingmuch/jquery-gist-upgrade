/* This script finds pre.fake-gist elements with an ID containing the gist ID,
 * and upgrades them in place into the syntax highlighted version */

/* Copyright 2009 Yuval Kogman, MIT license */

jQuery(document).ready(function () {
    /* I don't know of a better way to trap the gist js than this. Hopefully it
     * doesn't break anything too badly. By the time this runs document.write
     * should be pretty much useless anyway */
    document._non_gist_write = document.write;

    document.write = function (html) {
        if ( html.match(/gist/) ) {
            /* find the fake gist and replace it with this one. We skip the
             * <link rel="stylesheet"> */

            var gist = jQuery(html);

            if ( gist.attr('id').match('gist') ) {
                jQuery('#fake-' + gist.attr('id')).replaceWith(gist);
            }
        } else {
            /* otherwise proceed normally */
            document._non_gist_write(html);
        }
    };

    /* this chops up and wraps the pre so that it looks like a gist before it's
     * highlighted */

    jQuery('pre.fake-gist').each(function (i, e) {
        var id = jQuery(e).attr('id').match('\\d+');

        jQuery(e).removeAttr('id').wrap(
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

        /* asynchronously fetch the gist itself. It will be evaled and the html
         * will be trapped by the document.write wrapper */
        jQuery.getScript("http://gist.github.com/"+ id +".js");
    });
});


