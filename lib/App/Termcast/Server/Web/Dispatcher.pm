#!/usr/bin/env perl
package App::Termcast::Server::Web::Dispatcher;
use Template;

=head1 NAME

Foo -

=head1 SYNOPSIS


=head1 DESCRIPTION


=cut

use Path::Dispatcher::Declarative -base, -default => {
    token_delimiter => '/',
};

on qr{^/$} => sub {
    my $req = shift;
    my $web = shift;

    my $output;

    $output = join(
        qq|<br />|,
        map {
            sprintf q|<a href="/view/%s">%s</a>|,
                ($_), $web->get_stream($_)->{user};
        } $web->stream_ids
    );

    response($output);
};

under { REQUEST_METHOD => 'GET' } => sub {
    on ['socket', qr|^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$|] => sub {
        my $req = shift;
        my $web = shift;

        my $output;
        my $stream = $2;
        my $handle = $web->get_stream_handle($stream)
            or return response('Stream not found');

        my $screen = $handle->session->html_generator->html;

        return response($screen);
    };
};

under { REQUEST_METHOD => 'GET' } => sub {
    on ['view', qr|^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$|] => sub {
        my $req = shift;
        my $web = shift;

        my $output;
        my $stream = $2;

        my $config = {
            INCLUDE_PATH => 'web/tt',
        };

        my $t = Template->new($config);
        my $vars = {
            stream_id => $stream,
        };

        $t->process('viewer.tt', $vars, \$output) or die $t->error();

        return response($output);
    };
};

sub response {
    my $message = shift;

    return [200, ['Content-Type', 'text/html'], [$message]];
}

1;

__END__

=head1 METHODS


=head1 AUTHOR

Jason May C<< <jason.a.may@gmail.com> >>

=head1 LICENSE

This program is free software; you can redistribute it and/or modify it under the same terms as Perl itself.

