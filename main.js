

$(function () {
    var SUSHI_MAX = 50;
    var SUSHI_DIST = 50;
    var SUSHI_IDLE_SPEED = 1;

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
        }
    }

    var sushi = [];
    var probex = [];
    var probey = [];
    var trackx = [];
    var tracky = [];
    var mousex = undefined;
    var mousey = undefined;
    var x = undefined;
    var y = undefined;

    $(window).mousemove(function (e) {
        mousex = e.clientX;
        mousey = e.clientY;
    });

    function move () {
        if (mousex === undefined) {
            return;
        } else if (x === undefined) {
            x = mousex;
            y = mousey;
        } else {
            x = lerp(x, mousex, 0.2);
            y = lerp(y, mousey, 0.2);
        }

        if (probex.length == 1) {
            var d = Math.round(dist(probex[0], probey[0], x, y));
            var p0x = probex[0];
            var p0y = probey[0];
            for (var t = 1; t < d; t++) {
                var f = t / d;
                trackx.unshift(lerp(p0x, p0y, f));
                tracky.unshift(lerp(p0x, p0y, f));
            }

        } else if (probex.length >= 2) {
            // Bézier curve
            var d = Math.round(dist(probex[0], probey[0], x, y) + dist(probex[1], probey[1], probex[0], probey[0]));
            var p0x = probex[1];
            var p0y = probey[1];
            var p2x = x;
            var p2y = y;
            var mx = (p0x + x) / 2;
            var my = (p0y + y) / 2;
            var p1x = (probex[0] - mx) * 2 + mx;
            var p1y = (probey[0] - my) * 2 + my;

            for (var t = d / 2; t < d; t++) {
                var f = t / d;
                var q0x = lerp(p0x, p1x, f);
                var q1x = lerp(p1x, p2x, f);
                trackx.unshift(lerp(q0x, q1x, f));

                var q0y = lerp(p0y, p1y, f);
                var q1y = lerp(p1y, p2y, f);
                tracky.unshift(lerp(q0y, q1y, f));
            }
        }

        probex.unshift(x);
        probey.unshift(y);

        // auto move
        for (var i = 0; i < SUSHI_IDLE_SPEED; i++) {
            trackx.unshift(x);
            tracky.unshift(y);
        }

        for (var i = sushi.length; i < trackx.length / SUSHI_DIST && i < SUSHI_MAX; i++) {
            var new_sushi = $('<div class="sushi" style="z-index: '+ (SUSHI_MAX - sushi.length) +';">🍣</div>');
            sushi.push(new_sushi);
            $('#content').append(new_sushi);
        }

        for (var i = 0; i < sushi.length; i++) {
            sushi[i].css({
                'top': tracky[i * SUSHI_DIST] - sushi[i].height() / 2,
                'left': trackx[i * SUSHI_DIST] - sushi[i].width() / 2,
            });
        }

        trackx = trackx.slice(0, SUSHI_MAX * SUSHI_DIST + 1);
        tracky = tracky.slice(0, SUSHI_MAX * SUSHI_DIST + 1);
        probex = probex.slice(0, SUSHI_MAX + 1);
        probey = probey.slice(0, SUSHI_MAX + 1);
    }

    setInterval(move, 50);
});


function dist (x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}


function lerp (a, b, f) {
    return a * (1 - f) + b * f;
}
