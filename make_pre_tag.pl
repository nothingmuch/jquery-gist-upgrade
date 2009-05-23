#!/usr/bin/env perl

use strict;
use warnings;

use LWP::Simple qw(get);
use HTML::Entities qw(encode_entities);

my $gist = shift or die "No gist ID specified";

my $raw = get("http://gist.github.com/${gist}.txt");
my $escaped = encode_entities($raw);

print <<HTML;
<pre id="fake-gist-$gist" class="fake-gist">
$escaped</pre>
HTML
