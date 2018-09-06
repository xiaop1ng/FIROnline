var ws = require('ws');

var ws_send = function (w, msg) {
    if (w.readyState == ws.OPEN) {
        w.send(JSON.stringify(msg))
    }
};

module.exports = ws_send;