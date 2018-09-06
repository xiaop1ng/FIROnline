var sendMsg = require('./ws_send.js')

// 游戏房间的构造器
var ws_room = function(options) {
    if (options) {
        for (var k in options) {
            this[k] = options[k]
        }
    }
    this.state = 0  // 状态，0：游戏未开始；1：已开始对战
    this.player0 = {}   // 玩家 1
    this.player1 = {}   // 玩家 2
    this.roundId = 0    // 记录当前回合的玩家的 Id
}

// 保存所有的房间信息
ws_room.ROOMS = {}

// 获取或创建一个房间
ws_room.get = function(roomId) {
    var _room = ws_room.ROOMS[roomId]

    if(!_room) {
        _room = new ws_room({
            id: roomId
        })
        ws_room.ROOMS[roomId] = _room
    }
    
    return _room
}

// 进入房间
ws_room.prototype.enter = function(w, msg) {
    if(w.id == this.player0.id || w.id == this.player1.id) {
        // 已经在房间了
        sendMsg(w, {t: -1, err: 0, msg: '你已经在房间中了', room_state: this.state})
    } else {
        // 进入房间
        if(this.player0.id && this.player1.id) {
            sendMsg(w, {t: -1, err: 405, msg: '该房间已满'})
            return
        } else if(this.player0.id) {
            this.player1 = w
        } else {
            this.player0 = w
        }

        if(this.player0.id && this.player1.id) {
            // 两名玩家均在房间， 准备开始游戏
            this.state = 1  
        }
        
        this.broadcast({
            t: -1,
            err: 0,
            msg: '进入房间成功',
            room_state: this.state,
            player0Id: this.player0.id,
            player1Id: this.player1.id,
            roundId: this.player0.id // 暂时让先进来的人先行棋
        })
    }
}

// 退出房间
ws_room.prototype.exit = function(w) {
    this.sendToRival(w, {
        t: -5,
        err: 0,
        msg: '你的对手已退出房间'
    })
    this.state = 0
    // 当玩家退出房间时，直接判负
    if(w.id == this.player0.id) {
        this.player0 = {}
    }

    if(w.id == this.player1.id) {
        this.player1 = {}
    }
}

// 在房间内广播消息
ws_room.prototype.broadcast = function(msg) {
    if(this.player0.id) {
        sendMsg(this.player0, msg)
    }

    if(this.player1.id) {
        sendMsg(this.player1, msg)
    }
}

// 发送消息给对手(只有游戏一开始状态可用)
ws_room.prototype.sendToRival = function(w, msg) {
    if(this.state == 1) {
        if(this.player0.id == w.id) {
            sendMsg(this.player1, msg)
        } else if(this.player1.id == w.id) {
            sendMsg(this.player0, msg)
        }
    } else {
        // 非法操作
    }
}

module.exports = ws_room;
