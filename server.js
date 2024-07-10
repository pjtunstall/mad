const http = require("http");
const fs = require("fs");
const socketIo = require("socket.io");
const url = require("url");
const path = require("path");

// INTRO

const Player = require("./classes/player.js");

let players;
let playersInChat;
let playersInCountdown;
let gameInProgress;
let isGameActive;
let isGameInitialized;
let playAgainTimeoutId;
let isAfterGame;
let playersInGame;

function initializeIntro() {
  players = [];
  playersInChat = 0;
  playersInCountdown = 0;
  playersInGame = 0;
  gameInProgress = false;
  isGameActive = false;
  isGameInitialized = false;
  isAfterGame = false;
}

initializeIntro();

const server = http.createServer((req, res) => {
  const requestUrl = url.parse(req.url);
  let filePath = path.join(__dirname, requestUrl.pathname);
  if (filePath.endsWith("/")) {
    filePath += "index.html";
  }

  let contentType;
  switch (path.extname(filePath)) {
    case ".js":
      contentType = "application/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".html":
      contentType = "text/html";
      break;
    default:
      contentType = "text/plain";
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Error loading " + requestUrl.pathname);
    }

    res.writeHead(200, {
      "Content-Type": contentType,
    });
    res.end(data);
  });
});

let io = socketIo(server);
disconnectAll();
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server listening on port ${port}`));

function disconnectAll() {
  for (let [id, socket] of io.of("/").sockets) {
    socket.disconnect(true);
  }
}

io.on("connection", (socket) => {
  if (gameInProgress) {
    socket.emit("game in progress");
    return;
  }

  let player;
  for (let [index, existingPlayer] of players.entries()) {
    if (!existingPlayer) {
      player = new Player(index, socket);
      players[index] = player;
      break;
    }
  }

  if (!player) {
    if (players.length < 4) {
      player = new Player(players.length, socket);
      players.push(player);
    } else {
      socket.emit("server full");
      return;
    }
  }

  socket.emit("own index", player.index);
  console.log(`User ${player.index} connected`, socket.id);
  socket.emit("players", players);

  socket.on("name", (name) => {
    player.name = name;
    player.phase = "roles";
  });

  socket.on("color", (color) => {
    player._color = color;
    player.phase = "chat";
    playersInChat++;
    io.emit("player joined chat", { player, playersInChat });
  });

  socket.on("typing", (data) => {
    if (data.typing) {
      io.emit("typing", { index: socket.id, typing: true, player });
    } else {
      io.emit("typing", { index: socket.id, typing: false, player });
    }
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", { msg, player });
  });

  socket.on("ready", () => {
    if (isAfterGame) {
      return;
    }
    gameInProgress = true;
    playersInCountdown = 0;
    for (const player of players) {
      if (player?.phase === "chat") {
        playersInCountdown++;
      }
    }
    io.emit("ready");
  });

  socket.on("pause", () => {
    io.emit("pause");
  });

  socket.on("start game", () => {
    if (isGameActive) {
      // Necessary because all players will send this signal. Eventually, move countdown logic to server.
      return;
    }
    isGameActive = true;
    setTimeout(() => {
      initializeGame();
    }, 500);
  });

  socket.on("move", ({ index, key }) => {
    switch (key) {
      case "ArrowUp":
        players[index].direction = { y: -1, x: 0, key };
        break;
      case "ArrowDown":
        players[index].direction = { y: 1, x: 0, key };
        break;
      case "ArrowLeft":
        players[index].direction = { y: 0, x: -1, key };
        break;
      case "ArrowRight":
        players[index].direction = { y: 0, x: 1, key };
        break;
    }
  });

  socket.on("stop", (index) => {
    players[index].direction = { y: 0, x: 0, key: "" };
  });

  socket.on("bomb", ({ index, y, x }) => {
    if (players[index].powerup?.name === "remote-control") {
      plantRemoteControlBomb(y, x, index);
      return;
    }
    plantNormalBomb(y, x, index);
  });

  socket.on("detonateRemoteControlBomb", (index) => {
    detonate(
      remoteControlBombCoordinates[index].y,
      remoteControlBombCoordinates[index].x,
      1
    );
    remoteControlBombCoordinates[index] = null;
    if (players[index].plantedBombs > 0) {
      players[index].plantedBombs--;
    }
    io.emit("detonateRemoteControlBomb", index);
  });

  socket.on("disconnect", () => {
    console.log(`User ${player.index} disconnected`);

    if (isAfterGame) {
      playersInGame--;
      if (playersInGame === 0) {
        restart();
      }
      return;
    }

    if (isGameActive) {
      for (const player of players) {
        if (player?.id === socket.id) {
          player.lives = 1;
          kill(player);
          playersInGame--;
          return;
        }
      }
    }

    players[player.index] = null;
    if (player.phase === "chat") {
      playersInChat--;
    }
    if (playersInCountdown > 0) {
      playersInCountdown--;
      if (playersInCountdown < 2) {
        restart();
      }
    }

    io.emit("player left", { player: player, playersInChat: playersInChat });
    io.emit("new space");
  });
});

function restart() {
  clearTimeout(playAgainTimeoutId);
  playAgainTimeoutId = setTimeout(() => {
    players = [];
    playersInChat = 0;
    playersInCountdown = 0;
    playersInGame = 0;
    isGameActive = false;
    gameInProgress = false;
    isGameInitialized = false;
    isAfterGame = false;
    io.emit("play again");
  }, 100);
}

// GAME

// game loop variables
const tick = 50;
let beat = false;

// player variables
let numPlayers;

// grid variables
let grid;
const cellSize = 64;
const numberOfRowsInGrid = 13;
const numberOfColumnsInGrid = 15;

// powerup variables
const probabilityOfPowerUp = 0.1;
const remoteControlBombCoordinates = [null, null, null, null];
const powerupArray = [
  {
    name: "bomb-up",
    initialCount: 2,
    count: 2,
  },
  {
    name: "fire-up",
    initialCount: 2,
    count: 2,
  },
  {
    name: "skate",
    initialCount: 2,
    count: 2,
  },
  {
    name: "life-up",
    initialCount: 2,
    count: 2,
  },
  {
    // Single use only; otherwise it would be too powerful
    name: "full-fire",
    initialCount: 1,
    count: 1,
  },
  {
    name: "soft-block-pass",
    initialCount: 1,
    count: 1,
  },
  {
    name: "remote-control",
    initialCount: 1,
    count: 1,
  },
  {
    name: "bomb-pass",
    initialCount: 1,
    count: 1,
  },
  { name: "mystery", initialCount: 2, count: 2 },
];

let gameLoopId;

function initializeGame() {
  if (isGameInitialized) {
    return;
  }
  isGameInitialized = true;
  for (powerup of powerupArray) {
    powerup.count = powerup.initialCount;
  }
  grid = buildGrid();
  players = players.filter((p) => p && p.color);
  numPlayers = players.length;
  playersInGame = numPlayers;
  if (numPlayers === 1) {
    isGameInitialized = false;
    io.emit("game over", { survivorIndex: 0, type: false });
  }
  for (let i = 0; i < players.length; i++) {
    players[i].index = i;
    io.to(players[i].id).emit("own index", i);
    players[i].lives = 3;
    players[i].phase = "game";
    players[i].powerup = null;
    spawn(players[i]);
    io.to(players[i].id).emit("start game", {
      updatedPlayers: players,
      newGrid: grid,
    });
  }
  gameLoopId = setInterval(gameLoop, tick);
}

function gameLoop() {
  if (!gameInProgress) {
    return;
  }

  // A variable to distinguish between the two beats in a game loop cycle. Players usually move only on one of the beats, but they move on both beats if they have the skate powerup, so that they move twice as fast.
  beat = !beat;

  for (const player of players) {
    if (isDead(player)) {
      kill(player);
    }
    if (beat === true || player.powerup?.name === "skate") {
      move(player);
      io.emit("move", {
        newPosition: player.position,
        newDirection: player.direction,
        index: player.index,
      });
    }
  }
}

function move(player) {
  const nextY = player.position.y + player.direction.y;
  const nextX = player.position.x + player.direction.x;
  if (!walkable(nextY, nextX, player)) {
    return;
  }

  oldY = player.position.y;
  oldX = player.position.x;
  player.position.y = nextY;
  player.position.x = nextX;

  if (
    player.powerup?.name === "soft-block-pass" &&
    grid[nextY][nextX].type === "breakable"
  ) {
    return;
  }

  let newPowerup = grid[nextY][nextX].powerup;
  if (newPowerup) {
    grid[nextY][nextX].powerup = null;

    if (newPowerup.name === "mystery") {
      newPowerup =
        powerupArray[Math.floor(Math.random() * (powerupArray.length - 1))]; // -1 because we don't want to include the mystery powerup in the random selection
    }

    if (newPowerup.name === "life-up") {
      player.lives++;
      io.emit("life-up", player.index, player.lives, nextY, nextX);
      return;
    }

    const previousPowerup = player.powerup;
    if (previousPowerup) {
      grid[oldY][oldX].powerup = previousPowerup;
    }

    player.powerup = newPowerup;

    io.emit("powerup", {
      y: nextY,
      x: nextX,
      powerup: newPowerup,
      index: player.index,
      oldY,
      oldX,
      previousPowerup,
    });

    if (
      previousPowerup?.name === "remote-control" &&
      newPowerup.name !== "remote-control"
    ) {
      io.to(player.id).emit("lose remote control");
    }

    if (newPowerup?.name !== "bomb-up") {
      player.maxBombs = 1;
    }

    switch (newPowerup.name) {
      case "bomb-up":
        player.fireRange = 1;
        player.maxBombs = 2;
        return;
      case "fire-up":
        player.fireRange = 2;
        return;
      case "skate":
        // Speed boost handled with a flag in server game loop.
        player.fireRange = 1;
        return;
      case "full-fire":
        player.fireRange = 13;
        return;
      case "remote-control":
        player.fireRange = 1;
        return;
    }
  }
}

function walkable(y, x, player) {
  for (const otherPlayer of players) {
    // Check if another player is in the target cell
    if (otherPlayer.position.y === y && otherPlayer.position.x === x) {
      return false;
    }
  }
  return (
    grid[y][x].type === "walkable" ||
    grid[y][x].type === "fire" ||
    (player.powerup?.name === "soft-block-pass" &&
      grid[y][x].type === "breakable") ||
    (player.powerup?.name === "bomb-pass" && grid[y][x].type === "bomb")
  );
}

function plantNormalBomb(y, x, index) {
  const player = players[index];
  if (
    player.plantedBombs >= player.maxBombs ||
    grid[y][x].type === "bomb" ||
    grid[y][x].type === "breakable"
  ) {
    return;
  }
  player.plantedBombs++;
  grid[y][x].type = "bomb";
  const fireRange = player.fireRange;
  let full = false;
  if (player.powerup?.name === "full-fire") {
    full = true;
  }
  io.emit("plantNormalBomb", { y, x, full });
  setTimeout(() => {
    detonate(y, x, fireRange);
    if (player.powerup?.name === "full-fire") {
      player.powerup = null;
      player.fireRange = 1;
      io.emit("used full-fire", index);
    }
    if (player.plantedBombs > 0) {
      player.plantedBombs--;
    }
  }, 1000);
}

function plantRemoteControlBomb(y, x, index) {
  const player = players[index];
  if (player.plantedBombs >= player.maxBombs || grid[y][x].type === "bomb") {
    return;
  }
  player.plantedBombs++;
  grid[y][x].type = "bomb";
  remoteControlBombCoordinates[index] = { y, x };
  io.emit("plantRemoteControlBomb", { y, x, index });
}

// Calculates where the fire can go based on the bomb's position. We make use of the fact that the unbreakable walls are at even coordinates.
function detonate(y, x, fireRange) {
  const arr = [];
  let style = "explosion-middle";
  arr.push({ y, x, style });
  addFire(y, x, style);
  if ((x & 1) === 1) {
    const top = Math.max(y - fireRange, 1);
    const bottom = Math.min(y + fireRange, numberOfRowsInGrid - 2);
    style = "explosion-top";
    arr.push({ y: top, x, style });
    addFire(top, x, style);
    // Why is it only necessary to check if y !== bottom? Why not left, right, or top?
    if (y !== bottom) {
      style = "explosion-bottom";
      arr.push({ y: bottom, x, style });
      addFire(bottom, x, style);
    }
    for (let i = top + 1; i < y; i++) {
      style = "explosion-fireRange-top";
      arr.push({ y: i, x, style });
      addFire(i, x, style);
    }
    for (let i = y + 1; i < bottom; i++) {
      style = "explosion-fireRange-bottom";
      arr.push({ y: i, x, style });
      addFire(i, x, style);
    }
  }
  if ((y & 1) === 1) {
    const left = Math.max(x - fireRange, 1);
    const right = Math.min(x + fireRange, numberOfColumnsInGrid - 2);
    style = "explosion-left";
    arr.push({ y, x: left, style });
    addFire(y, left, style);
    style = "explosion-right";
    arr.push({ y, x: right, style });
    addFire(y, right, style);
    for (let i = left + 1; i < x; i++) {
      style = "explosion-fireRange-left";
      arr.push({ y, x: i, style });
      addFire(y, i, style);
    }
    for (let i = x + 1; i < right; i++) {
      style = "explosion-fireRange-right";
      arr.push({ y, x: i, style });
      addFire(y, i, style);
    }
  }
  io.emit("add fire", arr);
}

function addFire(y, x, style) {
  if (grid[y][x].type === "breakable") {
    io.emit("destroy block", { y, x });
  } else if (grid[y][x].powerup) {
    grid[y][x].powerup = null;
    io.emit("destroy powerup", { y, x, powerupName: grid[y][x].powerup });
  }
  grid[y][x].type = "fire";
  setTimeout(() => {
    grid[y][x].type = "walkable";
    io.emit("remove fire", { y, x, style });
  }, 1000);
}

function deathAnimationEnd(player) {
  player.deathInProgress = false;
  if (player.lives === 0) {
    return;
  }
  player.plantedBombs = 0;
  player.maxBombs = 1;
  player.fireRange = 1;
  const powerup = player.powerup;
  player.powerup = null;
  const y = player.position.y;
  const x = player.position.x;
  grid[y][x].powerup = powerup;
  if (player.lives === 1) {
    // This player is out of the game
    player.lives = 0;
    player.position = { y: 0, x: 0 };
    io.emit("spawned", {
      index: player.index,
      isGameOver: true,
      powerup,
      y,
      x,
      life: player.lives,
    });
    numPlayers--;
    if (numPlayers === 1) {
      // Last man standing: the end of the game
      isAfterGame = true;
      clearInterval(gameLoopId);
      let survivorIndex = null;
      for (const otherPlayer of players) {
        if (otherPlayer.lives > 0 && !otherPlayer.deathInProgress) {
          // Only allow a player to win if they're not in the process of losing their last life
          survivorIndex = otherPlayer.index;
          break;
        }
      }
      io.emit("game over", { survivorIndex, type: true });
    }
    return;
  }
  player.lives--;
  spawn(player);
  io.emit("spawned", {
    index: player.index,
    isGameOver: false,
    powerup,
    y,
    x,
    life: player.lives,
  });
}

function spawn(player) {
  player.direction = { y: 0, x: 0, key: "" };
  player.position = { ...player.initialPosition };
}

function isDead(player) {
  // This line was the nonspecific lightning conductor of all errors! If something went wrong, it often showed up here (e.g. if the player was not defined for some reason, or player.position, or the value was out of range).
  return grid[player?.position?.y][player?.position?.x].type === "fire";
}

function kill(player) {
  if (player.deathInProgress) {
    return;
  }
  player.deathInProgress = true;
  player.direction = { y: 0, x: 0, key: "" };
  io.emit("dead", player.index);
  if (remoteControlBombCoordinates[player.index]) {
    detonate(
      remoteControlBombCoordinates[player.index].y,
      remoteControlBombCoordinates[player.index].x,
      1
    );
    remoteControlBombCoordinates[player.index] = null;
    io.emit("detonateRemoteControlBomb", player.index);
  }
  setTimeout(deathAnimationEnd, 1000, player);
}

function buildGrid() {
  const grid = Array.from({ length: numberOfRowsInGrid }, () =>
    Array(numberOfColumnsInGrid).fill(null)
  );
  for (let row = 0; row < numberOfRowsInGrid; row++) {
    for (let col = 0; col < numberOfColumnsInGrid; col++) {
      const top = row * cellSize;
      const left = col * cellSize;
      let type = "indestructable";
      let powerup = null;
      if (
        row === 0 ||
        col === 0 ||
        row === numberOfRowsInGrid - 1 ||
        col === numberOfColumnsInGrid - 1 ||
        (row % 2 === 0 && col % 2 === 0)
      ) {
        type = "indestructible";
      } else if (
        (row >= 1 && row <= 2 && col >= 1 && col <= 2) ||
        (row >= 1 &&
          row <= 2 &&
          col >= numberOfColumnsInGrid - 3 &&
          col <= numberOfColumnsInGrid - 2) ||
        (row >= numberOfRowsInGrid - 3 &&
          row <= numberOfRowsInGrid - 2 &&
          col >= 1 &&
          col <= 2) ||
        (row >= numberOfRowsInGrid - 3 &&
          row <= numberOfRowsInGrid - 2 &&
          col >= numberOfColumnsInGrid - 3 &&
          col <= numberOfColumnsInGrid - 2) ||
        Math.random() < 0.6
      ) {
        type = "walkable";
      } else {
        type = "breakable";

        const randomPowerup =
          powerupArray[Math.floor(Math.random() * powerupArray.length)];
        if (Math.random() < probabilityOfPowerUp && randomPowerup.count > 0) {
          powerup = randomPowerup;
          randomPowerup.count--;
        }
      }
      grid[row][col] = { type, top, left, powerup };
    }
  }

  // Make sure there are definitely always at least 3 distinct powerups on the map
  let y = 3 + 2 * Math.floor(Math.random() * 4);
  let x = 3 + 2 * Math.floor(Math.random() * 5);
  for (let i = 0; i < 3; i++) {
    y += 2;
    if (y > 9) {
      y = 3;
    }
    x += 2;
    if (x > 11) {
      x = 3;
    }
    grid[y][x].type = "breakable";
    grid[y][x].powerup = powerupArray[i];
  }

  return grid;
}
