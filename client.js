const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//set the map size for the dot to explore
const mapWidth = 2000;
const mapHeight = 2000;

//make the canvase the size of the window
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

//set the player position to the center of the map
let dotX = mapWidth / 2;
let dotY = mapHeight / 2;
let mouseX = dotX;
let mouseY = dotY;

let prevMouseX = dotX;
let prevMouseY = dotY;

canvas.addEventListener("mousemove", function (event) {
  const deltaX = event.clientX - prevMouseX;
  const deltaY = event.clientY - prevMouseY;
  mouseX += deltaX;
  mouseY += deltaY;
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
});

const ul = document.querySelector("ul");

function updateLeaderboard() {
  ul.innerHTML = "";

  playerPairSorted.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = `${player.name}: ${player.radius}`;
    ul.appendChild(li);
  });
}

setInterval(updateLeaderboard, 1000);

let dotRadius = 16;
let userName = "";

const staticDots = [];
var changeVal = document.getElementById("startButton");
var startingBox = document.getElementById("startingBox");

var name = document.getElementById("nameInput");

startButton.addEventListener("change", function (event) {
  // update username
  userName = event.target.value;
});
function change() {
  console.log("startButton", changeVal.value);
  if (changeVal.value == "false") {
    startingBox.style.display = "none";
    changeVal.value = "true";
  } else {
    changeVal.value = "false";
  }
}

//create 1000 static dots with random positions and colors
for (let i = 0; i < 1000; i++) {
  staticDots.push({
    x: Math.random() * mapWidth,
    y: Math.random() * mapHeight,
    radius: Math.random() * 10 + 2,
    color: getRandomColor(),
  });
}

function updateDotPosition() {
  //move the player towards the mouse
  const dx = mouseX - dotX;
  const dy = mouseY - dotY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = 3;
  // if distance is greater than speed, move towards mouse
  if (distance > speed) {
    dotX += (dx / distance) * speed;
    dotY += (dy / distance) * speed;
  } else {
    //otherwise set the player position to the mouse position
    dotX = mouseX;
    dotY = mouseY;
  }
  if (changeVal.value == "true") {
    count = 0;
    //for every static dot, check if player is colliding with it if it is increase the size of the player and remove the dot
    staticDots.forEach((dot) => {
      const dx = dotX - dot.x;
      const dy = dotY - dot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < dot.radius + dotRadius) {
        dotRadius += dot.radius * 0.05;
        count += 1;
        staticDots.splice(staticDots.indexOf(dot), 1);
      }
    });
    //send the player position to the server
    sendPlayerPosition(dotX, dotY, userName);
    draw();
  }
}

canvas.addEventListener("mousemove", function (event) {
  // follow mouse from a distance
  mouseX = event.clientX + (dotX - canvas.width / 2);
  mouseY = event.clientY + (dotY - canvas.height / 2);
});

const nameInput = document.getElementById("nameInput");
nameInput.addEventListener("change", function (event) {
  // update username
  userName = event.target.value;
});
const gameStarted = false;
//draw the player and the static dots
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 - dotX, canvas.height / 2 - dotY);

  staticDots.forEach((dot) => {
    // draw static dots
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.fill();
    ctx.closePath();
  });

  // draw player dot
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  if (changeVal.value == "true") {
    //style name on player dot
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(userName, dotX, dotY - dotRadius + 18);

    //draw other players
    Object.keys(players).forEach((playerId) => {
      const player = players[playerId];
      console.log("Player:", player);
      if (playerId !== myPlayerId) {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(player.name, player.x, player.y);
      }
    });

    ctx.restore();
  }
}

function getRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

//update the player position every 10ms
setInterval(updateDotPosition, 10);

var HOST = location.origin.replace(/^http/, "ws");
const ws = new WebSocket(HOST);

let myPlayerId;
const players = {};

ws.onmessage = function (event) {
  console.log("Received message from server:", event.data);
  const data = JSON.parse(event.data);
  if (data.type === "playerId") {
    console.log("Received player id:", data.playerId);
    myPlayerId = data.playerId;
  } else if (data.type === "playerPositions") {
    updatePlayerPositions(data.playerPositions);
  }
};
ws.onopen = function (event) {
  console.log("Connected to WS Server");
};

function updatePlayerPositions(newPlayerPositions) {
  newPlayerPositions.forEach((playerPosition) => {
    players[playerPosition.playerId] = playerPosition;
  });
  getLargestForLeaderboard();
}

function sendPlayerPosition(x, y, name) {
  ws.send(
    JSON.stringify({
      type: "playerPosition",
      x: x,
      y: y,
      userName: name,
      radius: dotRadius,
      color: "red",
    })
  );
  getLargestForLeaderboard();
  console.log(playerPairSorted);
}
var playerPairSorted = [];

function getLargestForLeaderboard() {
  PlayerRadiusPair = [{ userName: "", radius: 0 }];
  Object.keys(players).forEach((playerId) => {
    const player = players[playerId];
    PlayerRadiusPair.push({
      name: player.name,
      radius: player.radius,
    });
  });
  //sort the players by radius
  PlayerRadiusPair.sort((a, b) => b.radius - a.radius);
  playerPairSorted = PlayerRadiusPair;
}
