const WebSocket = require("ws");
const express = require("express");

const PORT = process.env.PORT || 8080;
const app = express(PORT);
app.use(express.static("public"));
server = app.listen(PORT);

const wss = new WebSocket.Server({ server });

const players = {};
const playerName = "";
const playerRadius = 0;
const playerColor = "red";

function generateUniqueId() {
  return Math.random().toString(36);
}

wss.on("connection", function connection(ws) {
  const playerId = generateUniqueId();
  players[playerId] = { ws, x: 0, y: 0 };

  //received message from client of player position
  ws.on("message", function incoming(message) {
    console.log("Received message from client:", message);
    const data = JSON.parse(message);
    //if the message is player position, update the player position
    if (data.type === "playerPosition") {
      players[playerId].x = data.x;
      players[playerId].y = data.y;
      players[playerId].name = data.userName;
      players[playerId].radius = data.radius;
      players[playerId].color = data.color;
      console.log("Player position radius:", players[playerId].radius);
      broadcastPlayerPositions();
    }
  });

  ws.on("close", function () {
    console.log("Client disconnected:", playerId);
    delete players[playerId];
    broadcastPlayerPositions();
  });

  ws.send(JSON.stringify({ type: "playerId", playerId }));
});

function broadcastPlayerPositions() {
  const playerPositions = Object.keys(players).map((playerId) => ({
    playerId,
    name: players[playerId].name,
    x: players[playerId].x,
    y: players[playerId].y,
    radius: players[playerId].radius,
    color: players[playerId].color,
  }));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "playerPositions", playerPositions }));
    }
  });
}
