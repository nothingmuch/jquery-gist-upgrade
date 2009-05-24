#!/usr/bin/env perl

use MooseX::Declare;

class FakeGistUpdater with MooseX::Getopt {
	use XML::LibXML;
	use LWP::Simple qw(get);

	has parser => (
		isa        => "Object",
		is         => "ro",
		lazy_build => 1,
		handles    => [qw(parse_file)],
	);

	method _build_parser {
		my $parser = XML::LibXML->new;

		$parser->no_network(1);

		return $parser;
	}

	method get_gists ($doc) {
		$doc->documentElement->findnodes(q{//*[contains(concat(' ', @class, ' '), ' fake-gist ')]})->get_nodelist;
	}

	method get_gist ($gist) {
		get("http://gist.github.com/${gist}.txt");
	}

	method replace_text ($elem, $text) {
		$elem->removeChild($_) for $elem->getChildNodes;
		$elem->addChild( $elem->ownerDocument->createTextNode($text) );
	}

	method run {
		my $dom = $self->parse_file($ARGV[0]);

		foreach my $node ( $self->get_gists($dom) ) {
			my $id = $node->getAttribute('id');

			my ( $gist_id ) = ( $id =~ /^fake-gist-(.+)$/ );
			my $gist_text = $self->get_gist($gist_id);

			$self->replace_text($node, $gist_text);
		}

		print $dom->toString;
	}
}

FakeGistUpdater->new_with_options->run;

