/**
 * UI
 * @author Airing
 */

var canvas = document.getElementById("chess");
if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
    canvas.height = canvas.width = document.body.clientWidth - 50; //移动端
} else {
    canvas.height = canvas.width = 600; // pc 固定 600px
}

var context = canvas.getContext("2d");
var me = true; // 判断该轮黑白棋落子权
var over = false; // 判断游戏是否结束
var begin = false; // 游戏是否开始
var chessBoard = []; // 棋盘二维数组,存储棋盘信息 0 -> 空， 1 -> 白子， 2 -> 黑子

var chessBoardLength = 15; // 棋盘大小
var paddingWidth = (canvas.width / chessBoardLength) / 2; // 棋盘边界宽度
var cellWidth = (canvas.width - paddingWidth * 2) / (chessBoardLength - 1); // 15 线 =》14 格
var chessWidth = cellWidth / 2 - 2; // 棋子的半径

var connected = false; // 连接状态

var aiFlag = false; // PLAY WITH AI 标识位
var hostName = window.location.host;
var ws = new WebSocket("ws://" + hostName);

// 初始化
function init() {
    $('.loading').show();
    $('.content').hide();
    var time = Math.floor((Math.random()*3)+1) * 1000;
    setTimeout(function(){
        $('.loading').hide();
        $('.content').show();
        $('#chess').css('display', 'block')
    }, time);
}

function tips(text, idx) {
    var imgSrc = 'img/face/' + idx + '.jpg';
    $('#tipText').text(text);
    $('#tipImg').attr('src', imgSrc);
}

function playWithAi() {
    aiFlag = true;
    startGame(true);
    tips('让你先行，你的回合！', 5);
    if(connected) {
        ws.close();
    }
}

function rePlay() {
    enter($('#roomId').text());
    $('.replayBtn').hide();
}

init();
/**
 * 开始按钮逻辑:初始化棋盘,并让电脑黑棋先行(chessBoardLength/2,chessBoardLength/2)位置
 */
function startGame(isMeRound) {

    // 初始化棋盘信息
    for (var i = 0; i < chessBoardLength; i++) {
        chessBoard[i] = [];
        for (var j = 0; j < chessBoardLength; j++) {
            chessBoard[i][j] = 0;
        }
    }

    // 清除棋盘
    cleanChess();
    // 绘制棋盘
    drawChess();

    // 轮到玩家(白棋)行棋
    me = isMeRound;
    // 重置游戏结束标志
    over = false;

    // 初始化赢法统计数组
    for (var i = 0; i < count; i++) {
        myWin[i] = 0;
        airingWin[i] = 0;
    }
    $('.waitting').hide();
    // 让电脑先行，(7,7)处绘制黑棋，并存储信息
    if(aiFlag && !isMeRound) {
        airingGo();
        // var initLoc = Math.floor(chessBoardLength/2);
        // oneStep(initLoc, initLoc, false);
        // chessBoard[initLoc][initLoc] = 2;
    }

}

/**
 * 与服务端交互
 */
function sendMsg(msg) {
    if(connected) {
        ws.send(JSON.stringify(msg));
    } else {
        console.log("与服务器断开连接了，刷新重新连接~");
    }
}

/**
 * 清除棋盘
 */
function cleanChess() {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * 绘制棋盘
 */
function drawChess() {

    for (var i = 0; i < chessBoardLength; i++) {
        context.strokeStyle = "#4b4b4b";
        context.beginPath();
        context.moveTo(paddingWidth + i * cellWidth, paddingWidth);
        context.lineTo(paddingWidth + i * cellWidth, canvas.height - paddingWidth);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(paddingWidth, paddingWidth + i * cellWidth);
        context.lineTo(canvas.width - paddingWidth, paddingWidth + i * cellWidth);
        context.closePath();
        context.stroke();
    }
    begin = true;
}


/**
 * 绘制棋子
 * @param i     棋子x轴位置
 * @param j     棋子y轴位置
 * @param me    棋子颜色
 */
function oneStep(i, j, me) {
    context.beginPath();
    context.arc(paddingWidth + i * cellWidth, paddingWidth + j * cellWidth, chessWidth, 0, 2 * Math.PI);
    context.closePath();
    var gradient = context.createRadialGradient(paddingWidth + i * cellWidth + 2, paddingWidth + j * cellWidth - 2, chessWidth, paddingWidth + i * cellWidth + 2, paddingWidth + j * cellWidth - 2, 0);
    if (me) { // 白棋
        gradient.addColorStop(0, "#D1D1D1");
        gradient.addColorStop(1, "#F9F9F9");
    } else { // 黑棋
        gradient.addColorStop(0, "#0A0A0A");
        gradient.addColorStop(1, "#636766");
    }
    context.fillStyle = gradient;
    context.fill();
}

function changeRoom() {
    var newRoomId = prompt("换个房间玩儿，请输入房间号：");
    if(newRoomId) {
        enter(newRoomId);
    }
}

function enter(roomId) {
    if(connected) {
        // 进入房间 房间号默认 520
        sendMsg({
            t: 1,
            room_id: roomId
        });
        $('#roomId').text(roomId);
    }
}

/**
 * canvas 鼠标点击事件
 * @param e
 */
canvas.onclick = function (e) {
    // 游戏未开始或者结束或者非己方行棋时
    if (over || !begin || !me) {
        return;
    }

    var x = e.offsetX;
    var y = e.offsetY;
    var i = Math.floor(x / cellWidth);
    var j = Math.floor(y / cellWidth);

    // 如果该位置没有棋子,则允许落子
    if (chessBoard[i][j] == 0) {
        // 绘制棋子(玩家)
        oneStep(i, j, me);
        // 改变棋盘信息(该位置有棋子)
        chessBoard[i][j] = 1;

        // 遍历赢法统计数组
        for (var k = 0; k < count; k++) {
            if (wins[i][j][k]) {
                // 如果存在赢法,则玩家此赢法胜算+1(赢法为5胜取胜)
                myWin[k]++;
                // 如果存在赢法,则电脑此赢法胜算赋值为6(永远不等于5,永远无法在此处取胜)
                airingWin[k] = 6;
                // 玩家落子后,此处赢法数组凑够5,玩家取胜
                if (myWin[k] == 5) {
                    // 游戏结束
                    over = true;
                }
            }

        }

        // 如果游戏没有结束,轮到对手行棋
        if (!over) {
            me = !me;
            if(aiFlag) {
                tips('还是你的回合！', Math.floor((Math.random()*8)+1));
                airingGo();
            }
        }
        if(!over && !aiFlag) {
            tips('对手的回合...', 4);
            sendMsg({ // 将行棋信息发送给对手 
                t: 3,
                x: i,
                y: j
            })
        } else if(over && !aiFlag) {
            tips('胜利', 2);

            $('.replayBtn').show();
            sendMsg({ // 将行棋信息和胜利信息发送给对手 
                t: 9,
                x: i,
                y: j
            })
        }
        
    }
};

// 建立连接的时候更新连接状态
ws.onopen = function (e) {
    console.log('Connection to server opened');
    connected = true;
}

// 处理服务器发送过来的消息
ws.onmessage = function (e) {
    var msg = JSON.parse(e.data);
    switch (msg.t) {
        case 0:
            ws.id = msg.id
            // 建立连接的响应
            enter('001')
            break;
        case -1:
            // 收到进入房间的响应 包含房间信息
            if(msg.err == 0 && msg.room_state == 1){
                startGame(msg.roundId == ws.id);
                if(msg.roundId == ws.id) {
                    startGame(true);
                    tips('游戏开始了，现在是你的回合！', 5);
                } else {
                    startGame(false);
                    tips('游戏开始了，现在是对手的回合...', 8);
                }
                
            } else if (msg.err == 0 && msg.room_state == 0) {
                tips('等待你的对手...', 3);
                setTimeout(function(){
                    if(!begin) {
                        $('.waitting').fadeIn();
                    }
                }, 6000); // 6s 没有人进入显示提示
            } else if (msg.err == 405) {
                // 切换房间
                tips('棋房坐满了，挤不进去了.', 1);
                changeRoom();
            }
                
            break;
        case -2:
            // [预留] 准备开始游戏
            break;
        case -3:
            // 收到对手的行棋信息
            oneStep(msg.x, msg.y, false)
            tips('你的回合！', 6);
            if (!over) {
                me = !me;
            }
            break;
        case -4:
            // [预留]认输
            break;
        case -5:
            // 对手退出房间
            tips('你的对手逃跑了，你赢了.', 2);
            over = true;
            break;
        case -9:
            // 来自服务端的游戏结束的通知
            oneStep(msg.x, msg.y, false);
            tips('第二名', 2);
            over = true;
            $('.replayBtn').show();
            break;
    }
}

ws.onclose = function (e) {
    // 可以在 onclose 和 onerror 中处理重连的逻辑，再决定是否将状态更新为未连接状态
    connected = false;
}

ws.onerror = function (e) {
    connected = false;
}
