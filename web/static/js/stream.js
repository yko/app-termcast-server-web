var INTERVAL_ID;
var COLS = 80;
var ROWS = 24;

// two different locks: client side and server side.
//
// First level lock: If we're downloading the ajax response,
// prevent beginning a download from a succeeding timer process.
//
// Second level lock: When processing the terminal screen, don't
// let any other webserver processes begin. Without this, the
// terminal frames will not cache properly.

var downloading;
var pos_elems = [];

$(function() {
    tc = $('#container');

    for (var row = 0; row < ROWS; ++row) {
        for (var col = 0; col < COLS; ++col) {
            var span = '<span id="pos-' + row + '-' + col + '">&nbsp;</span>';
            $('#container').append(span);
        }
        tc.append('<span></span><br />');
    }

});

function termcast_cb(incoming) {
    downloading = 1;
    if (typeof(incoming) === 'object') {
        var tc = $('#container');

        for (var i = 0; i < incoming.length; i++) {
            obj = incoming[i];
            data = obj.data;

            if (data.diff) {
                for (var j = 0; j < data.diff.length; j++) {
                    var change = data.diff[j];
                    var row  = change[0],
                        col  = change[1],
                        diff = change[2];

                    var color_map = [
                        '#000000',
                        '#ca311c',
                        '#60bc33',
                        '#bebc3a',
                        '#1432c8',
                        '#c150be',
                        '#61bdbe',
                        '#c7c7c7',
                    ];

                    var bold_color_map = [
                        '#686868',
                        '#df6f6b',
                        '#70f467',
                        '#fef966',
                        '#6d75ea',
                        '#ed73fc',
                        '#73fafd',
                        '#ffffff'
                    ];

                    if (diff) {
                        var selector = '#pos-' + row + '-' + col;

                        //alert(JSON.stringify(diff));
                        if (diff['v']) {
                            var content = diff['v'];
                            if (content == ' ') { content = '&nbsp;'; }

                            var color;

                            if (diff['bo']) {
                                color = bold_color_map[diff['fg']];
                            }
                            else {
                                color = color_map[diff['fg']];
                            }

                            $(selector)
                                .html(content)
                                .css({color: color});
                        }
                    }
                }
            }
        }
    }
    else {
        clearInterval(INTERVAL_ID);
        console.log('got recv, but invalid data');
        window.location = '/';
    }
    downloading = 0;
}

function update_termcast(res_type, stream_id, client_id) {
    if (downloading) {
        //console.log('still downloading');
        return;
    }
    downloading = 1;
    var url = '/socket/' + stream_id + '/' + res_type + '?client_id=' + client_id;
    $.get(url, termcast_cb);
}

function start_stream(stream_id, client_id) {
    update_termcast('fresh', stream_id, client_id);
    INTERVAL_ID = setInterval(
        "update_termcast('diff', '" + stream_id + "', '" + client_id + "')",
        300
    );
}
