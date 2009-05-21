/* This script finds pre.fake-gist elements with an ID containing the gist ID,
 * and upgrades them in place into the syntax highlighted version */

/* Copyright 2009 Yuval Kogman, MIT license */

jQuery(document).ready(function () {
    /* this wraps the pre so that it looks like a gist before it's
     * highlighted, and then makes an ajax call to load the gist */

    jQuery('pre.fake-gist').each(function (i, e) {
        var id = jQuery(e).attr('id').match('\\d+');

        jQuery(e).wrap(
            /* first we wrap with the various classes */
            '<div class="gist-file">' +
                '<div class="gist-data gist-syntax">' +
                    '<div class="gist-highlight">' +
                        '<div class="line nn"></div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        ).parents('.gist-file:first').append(
            /* then add the blurb at the bottom (no raw link though) */
            '<div class="gist-meta">' +
                '<a href="http://gist.github.com/'+id+'">This Gist</a>' +
                ' brought to you by <a href="http://github.com">GitHub</a>.' +
            '</div>'
        ).wrap(
            /* wrap in another div that we use for the ajax load, and then
             * fetch the HTML block from github */
            '<div></div>'
        ).parent().load("http://gist.github.com/"+id+".pibb");
    });
});


