function coord (x, y) {
    this.x = x;
    this.y = y;
}

var animate_loop_id = undefined;

var track_sushi = [];
var track_mouse = [];

$(function () {
    var SUSHI_MAX = 50;
    var SUSHI_DIST = 50;
    var SUSHI_IDLE_SPEED = 1;
    var SUSHI_BG = 'pink';
    var SUSHI_SEQ = ['🍣'];
    var SUSHI_FONT = 'default';

    var param = window.location.search.replace(/^\?/g, '').split('&');
    for (i in param) {
        var tmp = param[i].split('=');
        var key = tmp[0];
        var val = tmp[1];

        switch (key.toLowerCase()) {
            case 'max':
                SUSHI_MAX = parseInt(val);
                break;
            case 'dist':
                SUSHI_DIST = parseInt(val);
                break;
            case 'speed':
                SUSHI_IDLE_SPEED = parseInt(val);
                break;
            case 'bg':
                SUSHI_BG = val;
                break;
            case 'sushi':
                if (val) {
                    SUSHI_SEQ = [];
                    for (c of decodeURI(val)) {
                        SUSHI_SEQ.push(c);
                    }
                }
                break;
            case 'font':
                SUSHI_FONT = val;
                break;
        }
    }

    console.log('SUSHI_MAX =', SUSHI_MAX);
    console.log('SUSHI_DIST =', SUSHI_DIST);
    console.log('SUSHI_IDLE_SPEED =', SUSHI_IDLE_SPEED);
    console.log('SUSHI_BG =', SUSHI_BG);
    console.log('SUSHI_SEQ =', SUSHI_SEQ.join(', '));
    console.log('SUSHI_FONT =', SUSHI_FONT);

    var SUSHI_ICON = [];
    for (var i in SUSHI_SEQ) {
        if (SUSHI_FONT == 'twemoji' || SUSHI_FONT == 'twitter') {
            SUSHI_ICON.push(twemoji.parse(SUSHI_SEQ[i]));
        } else {
            SUSHI_ICON.push(SUSHI_SEQ[i]);
        }
    }

    var sushi_dom = [];
    var mouse = undefined;
    var probe = undefined;

    $('body').css('background', SUSHI_BG);

    for (var i = 0; i < SUSHI_MAX; i++) {
        var new_sushi = $('<div class="sushi hidden" style="z-index: '+ (SUSHI_MAX - i) +';">'+ SUSHI_ICON[sushi_dom.length % SUSHI_ICON.length] +'</div>');
        sushi_dom.push(new_sushi);
        $('#content').append(new_sushi);
    }

    $(window).mousemove(function (e) {
        if (mouse === undefined) {
            mouse = new coord(e.clientX, e.clientY);
        } else {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }
    }).keydown(function (e) {
        console.log(e.which);
        switch (e.which) {
            case 32:
                if (animate_loop_id) {
                    console.log('pause');
                    clearInterval(animate_loop_id);
                    animate_loop_id = undefined;
                } else {
                    console.log('start');
                    animate_loop_id = setInterval(move, 50);
                }
                break;

            default:
                console.log('No handler');
        }
    });

    function move () {
        if (mouse === undefined) {
            return;

        } else if (probe === undefined) {
            probe = new coord(mouse.x, mouse.y);

            for (var i = 0; i < SUSHI_MAX; i++) {
                sushi_dom[i].css({
                    'top': probe.y - sushi_dom[i].height() / 2,
                    'left': probe.x - sushi_dom[i].width() / 2,
                });
            }

        } else {
            probe = lerp_coord(probe, mouse, 0.2);
        }

        if (track_mouse.length == 1) {
            var curve = bezier_curve_1st(track_mouse[0], probe);
            if (curve.length == 0) {
                for (var i = 0; i < SUSHI_IDLE_SPEED; i++) {
                    track_sushi.unshift(probe);
                }
            } else {
                track_sushi = curve.concat(track_sushi);
            }

        } else if (track_mouse.length >= 2) {
            var d = Math.round(dist(track_mouse[0], probe) + dist(track_mouse[1], track_mouse[0]));
            var p0 = track_mouse[1];
            var p2 = probe;
            var mx = (p0.x + probe.x) / 2;
            var my = (p0.y + probe.y) / 2;
            var p1 = new coord((track_mouse[0].x - mx) * 2 + mx, (track_mouse[0].y - my) * 2 + my);
            var curve = bezier_curve_1st(track_mouse[0], probe);

            if (curve.length == 0) {
                for (var i = 0; i < SUSHI_IDLE_SPEED; i++) {
                    track_sushi.unshift(probe);
                }
            } else {
                track_sushi = curve.concat(track_sushi);
            }
        }

        track_mouse.unshift(new coord(probe.x, probe.y));

        for (var i in sushi_dom) {
            if ((i * SUSHI_DIST) >= track_sushi.length) {
                continue;
            }

            sushi_dom[i].removeClass('hidden');

            sushi_dom[i].css({
                'top': track_sushi[i * SUSHI_DIST].y - sushi_dom[i].height() / 2,
                'left': track_sushi[i * SUSHI_DIST].x - sushi_dom[i].width() / 2,
            });
        }

        track_sushi = track_sushi.slice(0, SUSHI_MAX * SUSHI_DIST + 1);
        track_mouse = track_mouse.slice(0, 5);
    }

    animate_loop_id = setInterval(move, 50);
});


function dist (c1, c2) {
    return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
}


function lerp (a, b, f) {
    return a * (1 - f) + b * f;
}


function lerp_coord (a, b, f) {
    return new coord(lerp(a.x, b.x, f), lerp(a.y, b.y, f));
}


function bezier_curve_1st (p0, p1) {
    var d = Math.round(dist(p0, p1));
    if (d <= 1) {
        return [];
    } else {
        var ret = [];
        for (var t = 1; t < d; t++) {
            var f = t / d;
            var nc = lerp_coord(p0, p1, f);
            ret.unshift(nc);
        }
    }
    return ret;
}


function bezier_curve_2nd (p0, p1, p2, d) {
    // Bézier curve
    if (d <= 1) {
        return [];
    } else {
        var ret = [];
        for (var t = d / 2; t < d; t++) {
            var f = t / d;
            var q0 = lerp_coord(p0, p1, f);
            var q1 = lerp_coord(p1, p2, f);
            ret.unshift(lerp_coord(q0, q1, f));
        }
        return ret;
    }
}


if (/fbclid=[^&]+/.test(window.location.href)) {
    history.replaceState(null, '', window.location.href.replace(/[&?]fbclid=[^&#]+/, ''));
}
