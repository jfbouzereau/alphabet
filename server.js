
const http = require("http");
const express = require("express");
const WebSocketServer = require("ws").Server;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer( {server:server} );

//**************************************************************************

const port = 8000;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const NX = ALPHABET.length;
const NY = ALPHABET.length;

var board = [];
var id = 0;
var players = {};
var connections = {};

random_board();

app.get("/", function(req,res) {
	res.sendFile("index.html",{root:"static"});
});

console.log("Listening on port "+port);
server.listen(port);

wss.on("connection", function(cn) {

    start_connection(cn);

    cn.on("message", function(data) {
        var msg = JSON.parse(data);
        switch(msg.type) {
            case "name":
                process_name(cn,msg.value);
                break;

            case "move":
                process_move(cn,msg.value);
                break;
            }
        });

    cn.on("close", close_connection);
    });

//**************************************************************************

function random_board() {

	// remplissage du plateau
    board = [];
    for(let i=0;i<NX*NY;i++)
        board.push(ALPHABET[i%26]);

	// echange aleatoire des lettres
    for(let i=0;i<NX*NY;i++)
        {
        var k1 = Math.floor(Math.random()*NX*NY);
        var k2 = Math.floor(Math.random()*NX*NY);
        var temp = board[k1];
        board[k1] = board[k2];
        board[k2] = temp;
        }

}

//**************************************************************************

function start_connection(cn) {

    id++;

    cn.id = id;
    connections[id] = cn;

    var p = {x:0,y:0,last:" ",score:0,name:""};
    players[id] = p;

    var msg = {type:"welcome", nx:NX, ny:NY, id:id};
    cn.send(JSON.stringify(msg));

    send_game();

}

//**************************************************************************

function send_game() {

    var msg = {type:"game",players:players,board:board.join("")};
    var data = JSON.stringify(msg);

    for(var key in connections)
        connections[key].send(data);

}

//**************************************************************************

function process_name(cn,name) {

players[cn.id].name = name;

}

//**************************************************************************

function process_move(cn,value) {

    var p = players[cn.id];

    switch(value) {
        case 37: if(p.x>0) p.x--; break;
        case 38: if(p.y>0) p.y--; break;
        case 39: if(p.x<NX-1) p.x++; break;
        case 40: if(p.y<NY-1) p.y++; break;
        }

    var index = ALPHABET.indexOf(p.last)+1;
    var next = ALPHABET[index%26];
    if(board[p.x+p.y*NX]==next) {
        board[p.x+p.y*NX] = " ";
        p.last = next;
        p.score++;
        }

    send_game();
}

//**************************************************************************

function close_connection() {

    delete connections[this.id];
    delete players[this.id];
    send_game();

}

//**************************************************************************

