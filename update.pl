#!/usr/bin/env perl

use MooseX::Declare;

use MooseX::Getopt (); # preload the traits

use 5.010;

class FakeGistUpdater with MooseX::Getopt::Dashes {
	use AnyEvent::HTTP;
	use Carp qw(croak);
	use MooseX::Types::Path::Class qw(File);
	
	use autodie;

	has file => (
		traits        => [qw(Getopt)],
		isa           => File,
		is            => "ro",
		coerce        => 1,
		lazy_build    => 1,
		cmd_aliases   => ['f'],
		documentation => "The file to update",
	);

	sub _build_file {
		my $self = shift;

		Path::Class::file($self->ARGV->[0] || croak "Either specify --file or provide one as an argument");
	}

	has allow_network => (
		traits        => [qw(Getopt)],
		isa           => "Bool",
		is            => "ro",
		default       => 0,
		cmd_aliases   => ['n'],
		documentation => "If true XML::LibXML will be allowed to fetch DTDs etc (defaults to false)",
	);

	has strip_leading_newline => (
		traits        => [qw(Getopt)],
		isa           => "Bool",
		is            => "ro",
		default       => 1,
		cmd_aliases   => ['s'],
		documentation => "Remove leading newline before posting (defaults to true)",
	);

	has chomp => (
		traits        => [qw(Getopt)],
		isa           => "Bool",
		is            => "ro",
		default       => 1,
		cmd_aliases   => ['c'],
		documentation => "Remove trailing newline before posting (defaults to true)",
	);

	has in_place => (
		traits        => [qw(Getopt)],
		isa           => "Bool",
		is            => "ro",
		default       => 0,
		cmd_aliases   => ['i'],
		documentation => "Update the file in place (defaults to false)",
	);

	has backup_extension => (
		traits        => [qw(Getopt)],
		isa           => "Str",
		is            => "ro",
		default       => '~',
		cmd_aliases   => ['b'],
		documentation => "Backup extension (defaults to ~)"
	);

	has parser_class => (
		traits        => [qw(Getopt)],
		isa           => "Str",
		is            => "ro",
		default       => "XML::LibXML",
		documentation => "Specify an XML parser class (e.g. XML::Liberal) (defaults to XML::LibXML)",
	);


	has parser => (
		traits     => [qw(NoGetopt)],
		isa        => "Object",
		is         => "ro",
		lazy_build => 1,
		handles    => [qw(parse_file)],
	);

	method _build_parser {
		my $class = $self->parser_class;

		Class::MOP::load_class($class);

		my $parser = $class->new;

		$parser->no_network(1) unless $self->allow_network;

		return $parser;
	}

	has dom => (
		traits     => [qw(NoGetopt)],
		isa        => "Object",
		is         => "ro",
		lazy_build => 1,
	);

	method _build_dom {
		$self->parse_file($self->file->stringify);
	}

	has output_handle => (
		traits     => [qw(NoGetopt)],
		isa        => "FileHandle",
		is         => "ro",
		lazy_build => 1,
	);

	method _build_output_handle {
		if ( $self->in_place ) {
			rename ( $self->file, $self->file . $self->backup_extension );
			return $self->file->openw;
		} else {
			require FileHandle;
			return \*STDOUT;
		}
	}


	method get_fake_gist_nodes {
		$self->dom->documentElement->findnodes(q{//*[contains(concat(' ', @class, ' '), ' fake-gist ')]})->get_nodelist;
	}

	method gist_uri ($gist) {
		"http://gist.github.com/${gist}.txt";
	}

	method replace_text ($elem, $text) {
		$elem->removeChild($_) for $elem->getChildNodes;
		$elem->appendText($text);
	}

	method update_gist ($node) {
		my $id = $node->getAttribute('id');

		my ( $gist_id ) = ( $id =~ /^fake-gist-(.+)$/ );

		my $v = AnyEvent->condvar;

		say "Fetching gist $gist_id";

		http_get $self->gist_uri($gist_id), sub {
			my $gist_text = shift;
			$self->replace_text($node, $gist_text);
			$v->send($node);
		};

		return $v;
	}

	method extract_text ($node) {
		my $text = $node->getChildNodes;

		$text =~ s/^\n// if $self->strip_leading_newline;

		chomp($text) if $self->chomp;

		return $text;
	}

	method extract_gist_args ($node) {
		my $lang = $node->getAttribute('lang');

		return (
			text => $self->extract_text($node),
			( defined $lang ? ( lang => $lang ) : () ),
		);
	}


	method post_gist ($node) {
		require App::Nopaste::Service::Gist;

		croak "App::Nopaste::Service::Gist unavailable"
			unless App::Nopaste::Service::Gist->available;

		my %args = $self->extract_gist_args($node);

		say "Creating new gist";

		my ( $ok, $link ) = App::Nopaste::Service::Gist->nopaste(%args);

		croak "Gist creation failed: $link" unless $ok;

		my ( $id ) = ( $link =~ /(\d+)$/ );

		say "Created gist $id";

		$node->removeAttribute('lang');
		$self->replace_text($node, $args{text}); # for consistency
		$node->setAttribute(id => "fake-gist-$id");

		my $v = AnyEvent->condvar;
		$v->send($node);
		return $v;
	}

	method process_node ($node) {
		if ( $node->getAttribute('id') ) {
			return $self->update_gist($node);
		} else {
			return $self->post_gist($node);
		}
	}

	method process_dom {
		$_->recv for map { $self->process_node($_) } $self->get_fake_gist_nodes;
	}

	method output_dom {
		$self->output_handle->print($self->dom->toString);
	}

	method run {
		$self->process_dom;
		$self->output_dom;
	}
}

FakeGistUpdater->new_with_options->run;

