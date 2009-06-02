/* This script finds pre.fake-gist elements with an ID containing the gist ID,
 * and upgrades them in place into the syntax highlighted version */

/* Copyright 2009 Yuval Kogman, MIT license */

jQuery(function ($) {
    /* I don't know of a better way to trap the gist js than this. Hopefully it
     * doesn't break anything too badly. By the time this runs document.write
     * should be pretty much useless anyway */
    var old_write = document.write;

    document.write = function (html) {
        if ( html == '<link rel="stylesheet" href="http://gist.github.com/stylesheets/gist/embed.css"/>' ) {
            /* skip the stylesheet */
        } else if ( html.indexOf('<div id="gist-') == 0 ) {
            /* find the fake gist and replace it with this one. */
            var gist = $(html);
            var id = gist.attr('id');

            if ( id.indexOf('gist') == 0 )
                $('#fake-' + id).replaceWith(gist);
        } else {
            /* otherwise proceed normally */
            old_write.apply(document, arguments);
        }
    };

    /* this chops up and wraps the pre so that it looks like a gist before it's
     * highlighted */

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

        /* asynchronously fetch the gist itself. It will be evaled and the html
         * will be trapped by the document.write wrapper */
        $.getScript("http://gist.github.com/"+ id +".js");
    });
});


