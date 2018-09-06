var ws = require('ws')
var ws_room = require('./ws_room.js')
var sendMsg = require('./ws_send.js')

var ws_server = {},
    WSS = null,
    USERS = {},
    _USERS = [],
    _SEED_NUM = 0,
    _GEN_ID = function () {
        _SEED_NUM++;
        if (_SEED_NUM > 99999999) {
            _SEED_NUM = 1;
        }
        return _SEED_NUM
    }

// 进入房间
ws_server.enterRoom = function(w, msg) {
    var oldRoomId = w.room_id
    if(oldRoomId) {
        ws_server.exitRoom(w)
    }

    var roomId = msg.room_id,
        room = null
    if(roomId) {
        room = ws_room.get(roomId);
    }

    if(room) {
        w.room_id = room.id
        room.enter(w, msg)
    } else {
        // 房间不存在
        sendMsg(w, {
            t: -1,
            err: 100,
            msg: '房间不存在'
        })
    }
}

// 退出房间
ws_server.exitRoom = function(w) {
    var roomId = w.room_id,
        room = null
    if(roomId) {
        room = ws_room.get(roomId)
    }
    if(room) {
        room.exit(w)
    }
}

// 行棋
ws_server.movesTo =  function(w, msg) {
    var roomId = w.room_id,
        room = null
    if(roomId) {
        room = ws_room.get(roomId)
    }
    if(room && room.state == 1) {
        msg.t = -3;
        room.sendToRival(w, msg)
    }
}

// 游戏结束由胜利方发送该消息
ws_server.gameOver = function(w, msg) {
    var roomId = w.room_id,
    room = null
    if(roomId) {
        room = ws_room.get(roomId)
    }

    if(room && room.state == 1) {
        msg.t = -9;
        room.sendToRival(w, msg)
    }
}

// OUT 系统广播消息
var onMsg = function(msg) {
    console.log('w recved a message: ' + msg)
    msg = JSON.parse(msg)
    switch(msg.t) {
        case 1: // 进入房间并准备
            ws_server.enterRoom(this, msg)
            break
        case 2: // [预留]准备开始
            break
        case 3: // 行棋
            ws_server.movesTo(this, msg)
            break
        case 4: // [预留]认输
            break
        case 5: // 退出房间
            ws_server.exitRoom(this)
            break
        case 9: // 结束游戏 有一方获得胜利
            ws_server.gameOver(this, msg)
            break
    }
}

var onClose = function() {
    // TODO: 更新游戏中的状态
    ws_server.exitRoom(this)
}

var onOpen = function(w, req) {
    w.id = _GEN_ID()
    USERS[w.id] = w
    _USERS.push(w)
    w.on('message', onMsg)
    w.on('close', onClose)
    sendMsg(w, {t: 0, id: w.id})
}

ws_server.start = function (svr) {
    WSS = new ws.Server({ server: svr })
    WSS.on('connection', onOpen)
};

module.exports = ws_server