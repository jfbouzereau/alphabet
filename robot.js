var port = 8000;

var WebSocket = require("ws");

var socket = new WebSocket("ws://localhost:"+port);


var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var board = null;
var players = null;
var nx = 0;
var ny = 0;
var id = 0;
var me = {};
var name = process.argv[2] || "robot";

socket.on("open", function() {
	console.log("SOCKET OPEN");

	var msg = {type:"name",value:name};
	socket.send(JSON.stringify(msg));
	
	});

socket.on("error", function(err) {
	console.log("SOCKET ERROR "+err);
	});

socket.on("message", function(data) {
	var msg = JSON.parse(data);

	switch(msg.type) {
		case "welcome" : process_welcome(msg); break;
			break;

		case "game": process_game(msg); break;
			break;
		}
	
	});


function process_welcome(msg) {
	nx = msg.nx;
	ny = msg.ny;
	id = msg.id;
}


function process_game(msg) {
	players = msg.players;
	board = msg.board;
	me = players[id];
	play();
}

var lastplay = Date.now();

function play() {
	var now = Date.now();
	if(now-lastplay<25)
		{
		setTimeout(play,25-now+lastplay);
		return;
		}

	lastplay = now;

    var index = ALPHABET.indexOf(me.last)+1;
    var next = ALPHABET[index%26];

    // look for nearest target
    var dtarget = 999999;
    var xtarget = 0;
    var ytarget = 0;
    var k = 0;
    for(var y=0;y<ny;y++)
        for(var x=0;x<nx;x++)
            if(board[k++]==next)
                {
                var d = Math.abs(x-me.x)+Math.abs(y-me.y);
                if(d<dtarget)
                    {
                    dtarget = d;
                    xtarget = x;
                    ytarget = y;
                    }
                }

    if(dtarget==999999)
        return;


	var msg = {type:"move"};	
	if(Math.abs(me.x-xtarget)>Math.abs(me.y-ytarget))
		{
		if(xtarget<me.x)
			msg.value = 37;
		else if(xtarget>me.x)
			msg.value = 39;
		else
			msg.value = 0;
		}
	else 
		{
    	if(ytarget<me.y)
			msg.value = 38;
		else if(ytarget>me.y)
			msg.value = 40;
		else
			msg.value = 0;
		}

	socket.send(JSON.stringify(msg));
}

