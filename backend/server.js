const http = require("http");
const fs = require("fs");
const os = require("os");
const socketIo = require("socket.io");
const url = require("url");
const path = require("path");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
function sanitize(message) {
  return DOMPurify.sanitize(message, { ALLOWED_TAGS: [] });
}

const Player = require("./classes/player.js");

let players;
let playersInChat;
let playersInCountdown;
let isGameInProgress; // Set to true when the first player sends the "ready" signal to initiate the countdown for all players in chat.
let isGameInitialized; // Set to true when the `initializeGame` function is called at the end of the countdown.
let isAfterGame; // Set to true as soon as only one player is left in the game.
let playersInGame;
let disconnectees;
let numberOfStartSignalsReceived;
let playAgainTimeoutId;

// INTRO

function initializeIntro() {
  players = [];
  disconnectees = [];
  playersInChat = 0;
  playersInCountdown = 0;
  playersInGame = 0;
  isGameInProgress = false;
  isGameInitialized = false;
  isAfterGame = false;
  numberOfStartSignalsReceived = 0;
}

initializeIntro();

const server = http.createServer((req, res) => {
  const requestUrl = url.parse(req.url);
  let filePath = path.join(__dirname, "..", requestUrl.pathname);

  // // The above seems to be invulnerable to directory traversal, even without explicit sanitization. I needed to allow query parameters, as in the following lines, before I succeeded with a directory traversal attack:
  // const query = url.parse(req.url, true).query;
  // let filePath = path.join(__dirname, query.path || "");

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

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (
        address.family === "IPv4" &&
        !address.internal &&
        interfaceName !== "lo"
      ) {
        return address.address;
      }
    }
  }
  return null; // No suitable IP address found.
}

const SERVER_IP_ADDRESS = getLocalIP() || "localhost";
const io = socketIo(server, {
  cors: {
    origin: ":3000",
    methods: ["GET", "POST"],
  },
});

disconnectAll();

const port = process.env.PORT || 3000;
server.listen(port, () =>
  console.log(
    `Server listening on http://localhost:3000 or http://${SERVER_IP_ADDRESS}:3000`
  )
);

function disconnectAll() {
  for (let [id, socket] of io.of("/").sockets) {
    socket.disconnect(true);
  }
}

io.on("connection", (socket) => {
  if (isGameInProgress) {
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
    name = sanitize(name);
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
    msg = sanitize(msg);
    io.emit("chat message", { msg, player });
  });

  socket.on("ready", () => {
    if (isAfterGame) {
      return;
    }
    isGameInProgress = true;
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
    numberOfStartSignalsReceived++;
    if (numberOfStartSignalsReceived < playersInCountdown) {
      // Necessary because all players will send this signal. Eventually, move countdown logic to server.
      return;
    }
    setTimeout(() => {
      initializeGame();
    }, 500);
  });

  socket.on("move", ({ index, key }) => {
    players[index].direction.key = key;
    switch (key) {
      case "ArrowUp":
        players[index].direction.y = -1;
        players[index].direction.x = 0;
        break;
      case "ArrowDown":
        players[index].direction.y = 1;
        players[index].direction.x = 0;
        break;
      case "ArrowLeft":
        players[index].direction.y = 0;
        players[index].direction.x = -1;
        break;
      case "ArrowRight":
        players[index].direction.y = 0;
        players[index].direction.x = 1;
    }
  });

  socket.on("stop", (index) => {
    player.direction.y = 0;
    player.direction.x = 0;
    player.direction.key = "";
  });

  socket.on("bomb", ({ y, x, index }) => {
    if (players[index].remoteControl) {
      plantRemoteControlBomb(y, x, index);
      return;
    }
    plantNormalBomb(y, x, index);
  });

  socket.on("detonate remote control bombs", (index) => {
    for (const bomb of players[index].remoteControlBombs) {
      detonate(bomb.y, bomb.x, bomb.full ? 13 : bomb.fireRange);
      if (players[index].plantedBombs > 0) {
        players[index].plantedBombs--;
      }
    }
    players[index].remoteControlBombs.length = 0;
    io.emit("detonate remote control bomb", index);
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

    if (isGameInitialized) {
      for (const player of players) {
        if (player?.id === socket.id) {
          player.lives = 1;
          playersInGame--;
          kill(player, false);
          return;
        }
      }
    }

    if (player.phase === "chat") {
      playersInChat--;
    }
    if (playersInCountdown > 0) {
      playersInCountdown--;
      disconnectees.push(player.index);
      if (playersInCountdown === 0) {
        restart();
      }
      return;
    }

    players[player.index] = null;
    io.emit("player left", { player: player, playersInChat: playersInChat });
    io.emit("new space");
  });
});

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
    name: "full-fire", // I decided to make it single-use because it's so powerful.
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

function restart() {
  clearTimeout(playAgainTimeoutId);
  playAgainTimeoutId = setTimeout(() => {
    players = [];
    disconnectees = [];
    playersInChat = 0;
    playersInCountdown = 0;
    playersInGame = 0;
    numberOfStartSignalsReceived = 0;
    isGameInProgress = false;
    isGameInitialized = false;
    isAfterGame = false;
    io.emit("play again");
  }, 100);
}

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
  for (let i = 0; i < players.length; i++) {
    players[i].index = i;
    io.to(players[i].id).emit("own index", i);
    players[i].lives = 3;
    players[i].phase = "game";
    spawn(players[i]);
    io.to(players[i].id).emit("start game", {
      updatedPlayers: players,
      newGrid: grid,
    });
    if (disconnectees.includes(i)) {
      const x = i;
      setTimeout(() => {
        players[i].lives = 1;
        playersInGame--;
        kill(players[i], false);
      }, 1000);
    }
  }
  gameLoopId = setInterval(gameLoop, tick);
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
        type = "unbreakable";
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

  // Make sure there are definitely always at least 3 distinct powerups on the map.
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

function gameLoop() {
  if (!isGameInProgress) {
    return;
  }

  // A variable to distinguish between the two beats in a game loop cycle. Players usually move only on one of the beats, but they move on both beats if they have the skate powerup, so that they move twice as fast.
  beat = !beat;

  for (const player of players) {
    if (isDead(player)) {
      kill(player);
    }
    if (beat === true || player.skates > 0) {
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
  player.position.y = nextY;
  player.position.x = nextX;
  if (player.softBlockPass && grid[nextY][nextX].type === "breakable") {
    return;
  }

  let newPowerup = grid[nextY][nextX].powerup;
  if (newPowerup) {
    grid[nextY][nextX].powerup = null;

    if (newPowerup.name === "mystery") {
      newPowerup = powerupArray[Math.floor(Math.random() * 3)]; // Mustn't generate one of the unique powerups. If we want to allow them, we'd have to change the logic in `player.drop(powerupName)`.
    }

    if (newPowerup.name === "life-up") {
      player.lives++;
      io.emit("life-up", player.index, player.lives, nextY, nextX);
      return;
    }

    player.powerups.push(newPowerup);

    io.emit("get powerup", {
      y: nextY,
      x: nextX,
      powerup: newPowerup,
      index: player.index,
    });

    switch (newPowerup.name) {
      case "bomb-up":
        player.maxBombs++;
        return;
      case "fire-up":
        player.fireRange++;
        return;
      case "skate":
        player.skates++;
        return;
      case "full-fire":
        player.fullFire = true; // like player.fireRange = 13;
        return;
      case "remote-control":
        player.remoteControl = true;
        return;
      case "soft-block-pass":
        player.softBlockPass = true;
        return;
      case "bomb-pass":
        player.bombPass = true;
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
    grid[y][x]?.type === "walkable" ||
    grid[y][x]?.type === "fire" ||
    (player.softBlockPass && grid[y][x].type === "breakable") ||
    (player.bombPass && grid[y][x].type === "bomb")
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
  if (player.fullFire) {
    full = true;
    player.fullFire = false;
    player.powerups = player.powerups.filter(
      (powerup) => powerup.name !== "full-fire"
    );
  }
  io.emit("plant normal bomb", { y, x, full });
  const timeoutId = setTimeout(() => {
    detonate(y, x, full ? 13 : fireRange);
    if (player.plantedBombs > 0) {
      player.plantedBombs--;
    }
  }, 1000);
  grid[y][x].bombData = { index, fireRange, timeoutId };
}

function plantRemoteControlBomb(y, x, index) {
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
  player.remoteControlBombs.push({
    y,
    x,
    fireRange: player.fireRange,
    full: player.fullFire,
  });
  io.emit("plant remote control bomb", { y, x, index, full: player.fullFire });
  grid[y][x].bombData = {
    index,
    fireRange: player.fullFire ? 13 : player.fireRange,
    timeoutId: null,
  };
  if (player.fullFire) {
    full = true;
    player.fullFire = false;
    player.powerups = player.powerups.filter(
      (powerup) => powerup.name !== "full-fire"
    );
  }
}

// Calculates where the fire can go based on the bomb's position. We make use of the fact that the unbreakable walls are at even coordinates.
function detonate(y, x, fireRange) {
  const arr = [];
  let style = "explosion-middle";
  arr.push({ y, x, style });
  addFire(y, x, style, true);
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

function addFire(y, x, style, origin) {
  if (grid[y][x].type === "breakable") {
    io.emit("destroy block", { y, x });
  } else if (grid[y][x].powerup) {
    grid[y][x].powerup = null;
    io.emit("destroy powerup", { y, x, powerupName: grid[y][x].powerup });
  } else if (grid[y][x].type === "bomb" && !origin) {
    setTimeout(() => {
      clearTimeout(grid[y][x].bombData.timeoutId);
      detonate(y, x, grid[y][x].bombData.fireRange);
      if (players[grid[y][x].bombData.index].plantedBombs > 0) {
        players[grid[y][x].bombData.index].plantedBombs--;
      }
      grid[y][x].bombData = null;
      for (const player of players) {
        player.remoteControlBombs = player.remoteControlBombs.filter(
          (bomb) => !(bomb.y === y && bomb.x === x)
        );
      }
    }, 0);
  }
  grid[y][x].type = "fire";
  setTimeout(() => {
    grid[y][x].type = "walkable";
    io.emit("remove fire", { y, x, style });
  }, 1000);
}

function deathAnimationEnd(player, isNotDisconnected) {
  player.deathInProgress = false;
  if (player.lives === 0) {
    return;
  }
  let powerup;
  if (player.powerups.length === 0) {
    powerup = powerupArray[Math.floor(Math.random() * 3)]; // Mustn't generate one of the unique powerups. If we want to allow them, we'd have to change the logic in `player.drop(powerupName)`.
  } else {
    const r = Math.floor(Math.random() * player.powerups.length);
    powerup = player.powerups[r];
    player.powerups.splice(r, 1);
    player.drop(powerup.name);
  }
  const y = player.position.y;
  const x = player.position.x;
  grid[y][x].powerup = powerup;
  if (player.lives === 1) {
    // This player is out of the game.
    player.lives = 0;
    player.position = { y: 0, x: 0 };
    io.emit("spawned", {
      index: player.index,
      isGameOver: true,
      powerup,
      y,
      x,
      life: player.lives,
      hasSkate: player.skates > 0,
    });
    numPlayers--;
    if (numPlayers === 1) {
      // Last man standing: the end of the game.
      isAfterGame = true;
      clearInterval(gameLoopId);
      let survivorIndex = null;
      for (const otherPlayer of players) {
        if (
          otherPlayer.lives > 1 ||
          (otherPlayer.lives > 0 && !otherPlayer.deathInProgress)
        ) {
          // Only allow a player to win if they're not in the process of losing their last life.
          survivorIndex = otherPlayer.index;
          break;
        }
      }
      io.emit("game over", { survivorIndex, type: isNotDisconnected });
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
  // This line has been the nonspecific lightning conductor of errors. If something goes wrong, it often shows up here (e.g. if the player was not defined for some reason, or player.position, or the value was out of range).
  if (!player) {
    console.warn("isDead: Player object is undefined.");
    return false;
  }
  if (!player.position) {
    console.warn("isDead: Player position is undefined.");
    return false;
  }
  if (!grid) {
    console.warn("isDead: Grid is undefined.");
    return false;
  }
  return grid[player?.position?.y][player?.position?.x]?.type === "fire";
}

function kill(player, isNotDisconnected = true) {
  if (player.deathInProgress) {
    return;
  }
  player.deathInProgress = true;
  player.direction = { y: 0, x: 0, key: "" };
  io.emit("dead", player.index);
  for (const bomb of player.remoteControlBombs) {
    detonate(bomb.y, bomb.x, bomb.full ? 13 : bomb.fireRange);
    if (player.plantedBombs > 0) {
      players.plantedBombs--;
    }
    io.emit("detonate remote control bomb", player.index);
  }
  setTimeout(() => {
    deathAnimationEnd(player, isNotDisconnected);
  }, 1000);
}
