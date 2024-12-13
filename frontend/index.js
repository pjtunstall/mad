import { overReact } from "./overreact/over-react.js";
import {
  creditsText,
  characters,
  colors,
  placeholders,
  hypogeum,
  introText,
  outroTextWin,
  outroTextLose,
} from "./story.js";

// Global variables:
// 1. Intro and general variables
// 2. Game variables
// 3. Game loop variables
// 4. Intro and outro sounds
// 5. Game sounds

// Intro, outro, and general variables
const startButton = document.getElementById("start");
const everythingContainer = document.getElementById("everything-container");
const readyButton = document.getElementById("ready");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
let isGameOver;
let phase;
let players;
let ownIndex;
let playersInLobby;
let currentIndex;
let lastClickedItem;
let typingTimeout;
let counting;
let resumeFrom;
let timerId;
let outroText;

// Game variables
let isFirstMove = [true, true, true, true];
let position = [
  { y: 1, x: 1 },
  { y: 11, x: 13 },
  { y: 11, x: 1 },
  { y: 1, x: 13 },
];
// Components of normalized velocity vector for each player, and the key for that direction
let direction = [
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
];
let skates = [false, false, false, false]; // whether player has skate powerup
const skateTime = 32; // time in ms for player to move one cell with skate powerup
const normalTime = 64; // time in ms for player to move one cell without skate powerup
let gridData;
let grid = document.getElementById("game-grid");
const gameOver = document.getElementById("game-over");
const gridWrapper = document.getElementById("grid-wrapper");
const infoWrapper = document.getElementById("info");
const instructions = document.getElementById("instructions");
const playerColor = document.getElementById("player-role");
const lives = document.getElementById("lives");
const powerupIndicator = document.getElementById("powerup");
let cellsArr; // 2d array to store the cells of the game grid
let playerSprites; // Array to store the player sprite divs
const numberOfRowsInGrid = 13;
const numberOfColumnsInGrid = 15;
const cellSize = 64;
const spriteSize = 64;
let horizontalAnimation = [0, 0, 0, 0]; // background-positions representing current frames of each player's walking animation
const isKilled = new Array(4).fill(false);
let isRemoteControlBombPlanted = false;

// Game loop variables
let gameLoopId;
let offbeat = false;
const moveInterval = 25;
let lastTime = 0;
let accumulatedFrameTime = 0;

// Intro and outro sounds
let context;
let musicGainNode;
const introMusic =
  "frontend/assets/music/music_fx_ominous_cinematic_nordic_folk_with_hardanger.mp3";
const outroMusic =
  "frontend/assets/music/music_fx_rustic_folk_blissful_epiphany_dulcimer_drones.mp3";
const audio = new Audio(
  "frontend/assets/sfx/quick-mechanical-keyboard-14391.mp3"
);
audio.loop = true;
const clock = new Audio(
  "frontend/assets/sfx/old-fashioned-clock-sound-37729.mp3"
);
clock.loop = true;

// Game sounds
const powerupSound = new Audio("frontend/assets/sfx/coin-pickup-98269.mp3");
const fuseSound = new Audio("frontend/assets/sfx/fuse.mp3");
const screamSound = new Audio("frontend/assets/sfx/cartoon-scream-1-6835.mp3");
fuseSound.loop = true;
const explosionSound = new Audio(
  "frontend/assets/sfx/8-bit-explosion-low-resonant-45659.mp3"
);
const fullExplosionSound = new Audio(
  "frontend/assets/sfx/052168_huge-explosion-85199.mp3"
);
let remoteControlFuses = [[], [], [], []];

const socket = io(":3000", {
  reconnection: false, // Changing this to allow reconnection would mean we'd have to alter how the server handles disconnections, including "play again" logic.
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from the server:", reason);
  location.reload(true);
});

// Images
let slideshow;
let startImages = [
  "frontend/assets/images/slideshow/OIG1.JeeX.W.9kcfz6VS0J4uP.jpg",
  "frontend/assets/images/slideshow/OIG1.RHh.TiTv_89Q_qetbTqj.jpg",
  "frontend/assets/images/slideshow/OIG1.tT9zpwTaUvUSXc63p1uk.jpg",
  "frontend/assets/images/slideshow/OIG2.5v.ScYh44ajXn0PSpcT2.jpg",
  "frontend/assets/images/slideshow/OIG2.Jb7YWs.Tj7vKMzHxi7X7.jpg",
  "frontend/assets/images/slideshow/OIG2.L5eB8ppZFTF.HHCu1eFe.jpg",
  "frontend/assets/images/slideshow/OIG2.m1xtNwK.2dLzyjVhdYht.jpg",
  "frontend/assets/images/slideshow/OIG2.sdD0aK7mFca3yF_OSxuW.jpg",
  "frontend/assets/images/slideshow/OIG2.souzLAE7.Hfsy3099Vv4.jpg",
  "frontend/assets/images/slideshow/OIG2.X2Fui0nJzmm3u9LNVXfm.jpg",
  "frontend/assets/images/slideshow/OIG1.ixSAqnhJACfFzjGWjbPI.jpg",
];

const defaultImageForRoles = [
  "frontend/assets/images/roles/default/default.jpg",
  "frontend/assets/images/roles/default/default1.jpg",
  "frontend/assets/images/roles/default/OIG..oUUFHfUtXBqURKCJZbp.jpg",
  "frontend/assets/images/roles/default/OIG.5NlsEQhWcybBlnw0CE7F.jpg",
  "frontend/assets/images/roles/default/OIG.yykY1XiTafngQHZoIuIn.jpg",
  "frontend/assets/images/roles/default/OIG.GhKqkXmNWjAzmkLQReAz.jpg",
];

const creditContent = document.getElementById("credit-content");
for (let i = 0; i < 3; i++) {
  creditContent.innerHTML +=
    `<div id="credit-content-${i}" class="credit-content">` + creditsText;
}

transitionToStart();

function transitionToStart() {
  isGameOver = false;
  phase = "start";
  ownIndex = null;
  playersInLobby = 0;
  currentIndex = 0;
  players = [];
  counting = false;
  resumeFrom = 10;
  timerId = null;
  document
    .getElementById("credit-content-0")
    .addEventListener("animationend", (event) => {
      event.target.style.opacity = 0;
    });
  everythingContainer.style.pointerEvents = "none";
  startButton.addEventListener("click", transitionToName, { once: true });
  chatInput.placeholder = "Who are you?";
  chatForm.addEventListener("submit", submitName);
}

socket.on("server full", () => {
  startButton.innerHTML = `SERVER FULL<br/>SO IT GOES`;
  startButton.removeEventListener("click", transitionToName);
  startButton.style.pointerEvents = "none";
  socket.on("new space", reloadPage);
});

function reloadPage() {
  socket.off("new space", reloadPage);
  window.location.reload();
}

socket.on("game in progress", () => {
  gameInProgress();
});

function gameInProgress() {
  phase = "start";
  everythingContainer.classList.remove("show");
  everythingContainer.classList.add("hide");
  startButton.classList.remove("hide");
  startButton.classList.add("show");
  startButton.innerHTML = "GAME IN PROGRESS<br/>SUCH IS LIFE . . .";
  startButton.removeEventListener("click", transitionToName);
  startButton.style.pointerEvents = "none";
  const credits = document.getElementById("credits");
  credits.classList.remove("hide");
  credits.classList.add("show");
  setInterval(() => {
    window.location.reload();
  }, 40000);
}

function transitionToName() {
  phase = "name";
  startButton.classList.add("hide");
  document.getElementById("credits").classList.add("hide");
  everythingContainer.classList.add("show");
  everythingContainer.style.pointerEvents = "auto";
  fetchMusic(introMusic);

  slideshow = startSlideshow(startImages);

  const textElement = document.getElementById("text");
  typeLetter(textElement, introText, 14);

  chatForm.querySelector("input").focus();
}

function typeLetter(textElement, text, frequency) {
  if (currentIndex < text.length) {
    if (currentIndex === 0) {
      audio.play();
    }
    // Get the next character or tag
    let nextChar = text.charAt(currentIndex);
    if (nextChar === "<") {
      // If it's the start of a tag, find the end of the tag, ...
      let endIndex = text.indexOf(">", currentIndex);
      // ... extract the whole tag, ...
      nextChar = text.slice(currentIndex, endIndex + 1);
      // ... and update the currentIndex to be after the tag
      currentIndex = endIndex;
    }

    textElement.innerHTML += nextChar;
    textElement.scrollTop = textElement.scrollHeight;
    currentIndex++;
    setTimeout(() => typeLetter(textElement, text, frequency), frequency);
  } else {
    audio.pause();
    currentIndex = 0;
  }
}

socket.on("chat message", ({ msg, player }) => {
  if (!msg.trim()) {
    console.log("empty message received");
    return;
  }
  if (phase !== "chat") {
    return;
  }

  const item = document.createElement("li");

  item.classList.add(`${player.color}`);
  if (player.color === "black") {
    item.style.textShadow = "white 0 0 8px";
  }

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.insertBefore(item, chatMessages.firstChild);
  item.textContent = `${player.name}--${msg}`;
  item.scrollIntoView(false);
});

function startSlideshow(images) {
  let currentImageIndex = Math.floor(Math.random() * images.length);

  let imgElement = document.createElement("img");
  imgElement.className = "show";

  // // I've noticed that, unfortunately, the way browsers display alt text interferes with the design as it positions this text intrusively over the image itself. I've decided to comment it out for now, but I'll leave it here as a reminder to revisit this issue, and to illustrate the sorts of prompt I was using to cultivate the images.
  // imgElement.alt =
  //   "bleak slideshow images of human figures (tiny specks of insignificance) battling it out in towering, gray-black amphitheaters for the amusement of monstrous alien gods";

  let mainPane = document.getElementById("main-pane");
  mainPane.appendChild(imgElement);

  function updateSlideshowImage() {
    imgElement.classList.remove("show");
    document.querySelector(".top-eyelid").style.transform = "translateY(0)";
    document.querySelector(".bottom-eyelid").style.transform = "translateY(0)";
    setTimeout(() => {
      imgElement.src = images[currentImageIndex];
      imgElement.classList.add("show");
      document.querySelector(".top-eyelid").style.transform =
        "translateY(-100%)";
      document.querySelector(".bottom-eyelid").style.transform =
        "translateY(100%)";
      currentImageIndex = (currentImageIndex + 1) % images.length;
    }, 512);
  }

  updateSlideshowImage();
  return setInterval(updateSlideshowImage, 8192);
}

function updateImage(imageElement, toSrc, delay = 1024) {
  imageElement.classList.remove("show");

  setTimeout(() => {
    // Needed to remove and re-append the image element make it work in Safari. It was fine in Chrome, Brave, and Firefox. Safari was downloading the right image and showed the correct src for the image element. One theory is "aggressive caching". Failed solutions that might be useful on another occasion: `imageElement.src = toSrc + "?t=" + Date.now()` to make the browser think it's a new image, or `imageElement.src = "";` followed by `imageElement.src = toSrc;`, intended to force a reload. Removing the image and replacing it with a new one lost the event listeners. Rather than going to the trouble of re-adding them, I tried this approach, which worked.
    const mainPane = document.getElementById("main-pane");
    imageElement.classList.remove("show");
    mainPane.removeChild(imageElement); // Occasionally we see `Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.` in Chrome, at least, but everything looks fine.
    imageElement.src = toSrc;
    imageElement.classList.add("show");
    mainPane.appendChild(imageElement);
  }, 512);

  document.querySelector(".top-eyelid").style.transform = "translateY(0)";
  document.querySelector(".bottom-eyelid").style.transform = "translateY(0)";

  setTimeout(() => {
    document.querySelector(".top-eyelid").style.transform = "translateY(-100%)";
    document.querySelector(".bottom-eyelid").style.transform =
      "translateY(100%)";
  }, delay);
}

function transitionToRoles() {
  phase = "roles";

  clearInterval(slideshow);
  const imageElement = document.querySelector("#main-pane img");
  const toSrc =
    defaultImageForRoles[
      Math.floor(Math.random() * defaultImageForRoles.length)
    ];
  updateImage(imageElement, toSrc);
  makeMenu();
  setTimeout(scrollToTopOfChatMessages, 0);
}

function scrollToTopOfChatMessages() {
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function fixWidth(chatMessages) {
  const dummyItem = document.createElement("li");
  dummyItem.textContent = "This is a long dummy item to make space here.";
  dummyItem.classList.add("menu-item");
  dummyItem.classList.add("dummy");
  dummyItem.style.opacity = "0";
  dummyItem.style.height = "30px";
  dummyItem.style.padding = "0";
  dummyItem.style.pointerEvents = "none";
  chatMessages.appendChild(dummyItem);
  dummyItem.scrollIntoView();
}

function handleChooseRole() {
  const imageElement = document.querySelector("#main-pane img");
  imageElement.removeEventListener("click", handleChooseRole, {
    once: true,
  });
  socket.emit("color", lastClickedItem.style.backgroundColor);
}

function makeMenu() {
  const imageElement = document.querySelector("#main-pane img");
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = "";

  for (let i = 0; i < characters.length; i++) {
    const item = document.createElement("li");
    item.textContent = characters[i];
    item.classList.add("menu-item");
    item.classList.add("black");
    item.style.backgroundColor = colors[i];
    item.style.textShadow = "white 0 0 8px";
    if (colors[i] === "black") {
      item.style.color = "white";
      item.style.border = "1px solid silver";
      item.style.textShadow = `0 0 8px 2px ${colors[i]}`;
      item.addEventListener("mouseover", function () {
        item.style.cursor = "pointer";
        item.style.filter = "brightness(128%)";
        item.style.transform = "scaleY(1.03)";
        item.style.boxShadow = "0 0 20px silver";
      });
      item.addEventListener("mouseout", function () {
        item.style.cursor = "auto";
        item.style.filter = "none";
        item.style.transform = "none";
      });
    } else {
      item.style.boxShadow = `0 0 8px 2px ${colors[i]}`;
      item.addEventListener("mouseover", function () {
        item.style.boxShadow = `0 0 16px 8px ${colors[i]}`;
      });
      item.addEventListener("mouseout", function () {
        item.style.boxShadow = `0 0 8px 2px ${colors[i]}`;
      });
    }
    item.addEventListener("click", function () {
      if (lastClickedItem) {
        lastClickedItem.style.textDecoration = "none";
      } else {
        imageElement.addEventListener("click", handleChooseRole, {
          once: true,
        });
      }
      item.style.textDecoration = "underline";
      lastClickedItem = item;
      const toSrc = `frontend/assets/images/roles/${colors[i]}.jpg`;
      updateImage(imageElement, toSrc);
      imageElement.style.filter = "brightness(100%)";
      imageElement.style.pointerEvents = "auto";
      imageElement.classList.add("pointer");
      setTimeout(() => {
        imageElement.style.boxShadow =
          colors[i] === "black"
            ? "0 0 8px 2px rgb(90, 90, 90)"
            : `0 0 8px 2px ${colors[i]}`;
      }, 500);
      imageElement.addEventListener("mouseover", function () {
        imageElement.style.filter = "brightness(128%)";
        imageElement.style.transform = "translate(-50%, -50%) scale(1.003)";
        imageElement.style.boxShadow =
          colors[i] === "black"
            ? "0 0 16px 8px rgb(90, 90, 90)"
            : `0 0 16px 8px ${colors[i]}`;
      });
      imageElement.addEventListener("mouseout", function () {
        imageElement.style.filter = "brightness(100%)";
        imageElement.style.transform = "translate(-50%, -50%) scale(1)";
        imageElement.style.boxShadow =
          colors[i] === "black"
            ? "0 0 8px 2px rgb(90, 90, 90)"
            : `0 0 8px 2px ${colors[i]}`;
      });
    });
    chatMessages.appendChild(item);
  }

  for (let player of players) {
    if (player?.color) {
      const menu = document.getElementById("chat-messages");
      for (let item of menu.children) {
        if (item.style.backgroundColor === player.color) {
          item.classList.add("disabled");
        }
      }
    }
  }

  fixWidth(chatMessages);
}

socket.on("players", (playersFromServer) => {
  for (let i = 0; i < playersFromServer.length; i++) {
    players[i] = playersFromServer[i];
    if (players[i] && players[i].color) {
      const indicator = document.getElementById(`indicator-${i}`);
      indicator.classList.remove("hide");
      indicator.classList.add("show");
      indicator.classList.add(`led-${players[i].color}`);
    }
  }
});

socket.on("own index", (i) => {
  ownIndex = i;
});

socket.on("player joined chat", ({ player, playersInChat }) => {
  players[player.index] = player;
  const indicator = document.getElementById(`indicator-${player.index}`);
  indicator.classList.remove("hide");
  indicator.classList.add("show");
  indicator.classList.add(`led-${player.color}`);

  playersInLobby = playersInChat;

  switch (phase) {
    case "roles":
      if (player.index === ownIndex) {
        transitionToChat();
        return;
      }
      const imageElement = document.querySelector("#main-pane img");
      if (lastClickedItem?.style.backgroundColor === player.color) {
        imageElement.style.filter = "brightness(33%)";
        imageElement.style.pointerEvents = "none";
      }

      const menu = document.getElementById("chat-messages");
      for (let item of menu.children) {
        if (item.style.backgroundColor === player.color) {
          item.classList.add("disabled");
        }
      }
      return;
    case "chat":
      readyButton.classList.remove("hide");
      readyButton.classList.add("show");
      readyButton.addEventListener("click", readyHandler);
      const chatMessages = document.getElementById("chat-messages");
      const item = document.createElement("li");
      item.textContent = `${player.name} (${player.role}) ${
        hypogeum[Math.floor(Math.random() * hypogeum.length)]
      }`;
      item.classList.add(`${player.color}`);
      if (player.color === "black") {
        item.style.textShadow = "white 0 0 8px";
      }
      chatMessages.insertBefore(item, chatMessages.firstChild);
      fixWidth(chatMessages);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return;
    default:
      return;
  }
});

socket.on("player left", ({ player, playersInChat }) => {
  console.log("player left");
  if (gridData) {
    // i.e. if the game has been initialized and the server has sent the grid data. In that case, a signal will have been sent to kill that player.
    return;
  }

  players[player.index] = null;
  const indicator = document.getElementById(`indicator-${player.index}`);
  indicator?.classList.remove(`led-${player.color}`);
  indicator?.classList.remove("show");
  indicator?.classList.add("hide");

  playersInLobby = playersInChat;

  switch (phase) {
    case "roles":
      const imageElement = document.querySelector("#main-pane img");
      if (lastClickedItem?.style.backgroundColor === player.color) {
        imageElement.style.filter = "brightness(100%)";
        imageElement.style.pointerEvents = "auto";
        imageElement.classList.add("pointer");
      }
      const menu = document.getElementById("chat-messages");
      for (let item of menu.children) {
        if (item.style.backgroundColor === player.color) {
          item.classList.remove("disabled");
        }
      }
      return;
    case "chat":
      const chatMessages = document.getElementById("chat-messages");
      const item = document.createElement("li");
      item.textContent = `${player.name} has left the game.`;
      item.classList.add(`${player.color}`);
      if (player.color === "black") {
        item.style.textShadow = "white 0 0 8px";
      }
      chatMessages.insertBefore(item, chatMessages.firstChild);
      fixWidth(chatMessages);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      if (playersInChat < 2) {
        readyButton.classList.add("hide");
        readyButton.classList.remove("show");
        readyButton.removeEventListener("click", readyHandler);
      }
      return;
  }
});

function transitionToChat() {
  phase = "chat";

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = "";
  chatForm.style.opacity = 1;
  const inputField = chatForm.querySelector("input");
  inputField.value = "";
  inputField.setAttribute("maxLength", 1024);
  let placeholderIndex = Math.floor(Math.random() * placeholders.length);
  inputField.placeholder = placeholders[placeholderIndex];
  inputField.focus();

  const imageElement = document.querySelector("#main-pane img");
  imageElement.remove();
  slideshow = startSlideshow(startImages);

  chatForm.removeEventListener("submit", submitName);
  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const input = event.target.querySelector("input");
    socket.emit("chat message", input.value);
    input.value = "";
  });

  fixWidth(chatMessages);
  playersInLobby = 0;
  for (const player of players) {
    if (player?.color) {
      playersInLobby++;
      const item = document.createElement("li");
      item.textContent = `${player.name} (${player.role}) ${
        hypogeum[Math.floor(Math.random() * hypogeum.length)]
      }`;
      if (player.color === "black") {
        item.style.textShadow = "white 0 0 8px";
      }
      item.classList.add(`${player.color}`);
      chatMessages.insertBefore(item, chatMessages.firstChild);
      fixWidth(chatMessages);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  if (playersInLobby > 1) {
    readyButton.classList.remove("hide");
    readyButton.classList.add("show");
    readyButton.addEventListener("click", readyHandler);
  }
}

function submitName(event) {
  event.preventDefault();
  const input = event.target.querySelector("input");
  socket.emit("name", input.value);
  input.value = "";
  chatForm.style.opacity = 0;
  transitionToRoles();
}

chatInput.addEventListener("input", () => {
  clearTimeout(typingTimeout);
  socket.emit("typing", { typing: true });

  typingTimeout = setTimeout(() => {
    socket.emit("typing", { typing: false });
  }, 256);
});

socket.on("own index", (i) => {
  ownIndex = i;
});

socket.on("typing", (data) => {
  const indicator = document.getElementById(`indicator-${data.player.index}`);
  if (data.typing) {
    indicator.classList.add("flicker");
    if (phase !== "start" && data.player.index !== ownIndex) {
      audio.play();
    }
  } else {
    indicator.classList.remove("flicker");
    audio.pause();
  }
});

function readyHandler() {
  if (counting) {
    socket.emit("pause");
    return;
  }
  socket.emit("ready");
}

socket.on("ready", () => {
  if (phase !== "chat") {
    gameInProgress();
    return;
  }

  counting = true;
  clearInterval(slideshow);
  clock.play();
  // // Silences the music; superfluous here since we're stopping it for good right after.
  // musicGainNode.gain.value = 0;
  context.close();
  readyButton.innerHTML = "II";
  startCountdown(resumeFrom);
});

socket.on("pause", () => {
  counting = false;
  clearTimeout(timerId);
  clock.pause();
  clock.time = 0;
  readyButton.innerHTML = "&#9658;";
});

async function* counter(i) {
  for (let count = i; count >= 0; count--) {
    await new Promise((resolve) => {
      timerId = setTimeout(resolve, 1000);
    });
    yield count;
  }
}

async function startCountdown() {
  if (gridData) {
    // Prevents the countdown from starting when ready button is used to restart game at the end
    return;
  }
  const imageElement = document.querySelector("#main-pane img");
  resumeFrom = Math.min(resumeFrom, 10);
  imageElement.src = `frontend/assets/images/numbers/${resumeFrom}.jpg`;

  for await (let count of counter(resumeFrom - 1)) {
    resumeFrom = count;
    imageElement.classList.remove("show");
    imageElement.src = `frontend/assets/images/numbers/${count}.jpg`;
    imageElement.classList.add("show");
  }

  clearTimeout(timerId);
  clearInterval(slideshow);
  counting = false;
  clock.pause();
  clock.time = 0;
  readyButton.classList.add("hide");
  readyButton.classList.remove("show");

  // At this point, we could send a signal to the server like this to start the game, but I think it would make more sense to move the countdown logic to the server and have it initiate the game itself when it reaches this point, maybe waiting a couple of seconds for any lagging players to catch up to zero, but starting regardless when some deadline is reached.
  socket.emit("start game");
}

socket.on("start game", ({ updatedPlayers, newGrid }) => {
  players = updatedPlayers;
  gridData = newGrid;
  audio.pause();
  intro.style.display = "none";
  document.body.style.background = "gray";
  const factor = Math.min(screen.height / 768, screen.width / 1366);
  document.body.style.transform = `scale(${0.5 * factor})`;
  document.getElementById("game").classList.add("show");
  generateLevel();
});

// This is where we use our overReact framework for the sake of the audit. See immediately after for the original `buildGrid` function.
function buildGrid() {
  const vApp = new overReact.VNode("div", { attrs: { id: "game-grid" } });
  cellsArr = [];
  for (let row = 0; row < numberOfRowsInGrid; row++) {
    cellsArr.push([]);
    for (let col = 0; col < numberOfColumnsInGrid; col++) {
      const cellData = gridData[row][col];
      const cell = new overReact.VNode("div", {
        attrs: {
          id: `cell-${row}-${col}`,
          class: "cell",
          style: `top: ${cellData.top}px; left: ${cellData.left}px;`,
        },
      });
      const type = cellData.type;
      if (type === "breakable") {
        cell.addClass("breakable");
        if (cellData.powerup) {
          console.log(cellData.powerup.name);
          cell.addClass("power-up");
          cell.addClass(cellData.powerup.name);
        }
      } else if (type === "unbreakable") {
        cell.addClass("unbreakable");
      }
      vApp.children.push(cell);
    }
  }
  let app = new overReact.App(vApp, grid, { dummyState: 0 });
  grid = app.$app;
  for (let row = 0; row < numberOfRowsInGrid; row++) {
    for (let col = 0; col < numberOfColumnsInGrid; col++) {
      cellsArr[row][col] = document.getElementById(`cell-${row}-${col}`);
    }
  }
}

// // Original version of the function, that manipulates the DOM directly without using the overReact framework.
// function buildGrid() {
//   let newGrid = document.createElement("div");
//   grid.parentNode.replaceChild(newGrid, grid);
//   grid = newGrid;
//   grid.id = "game-grid";
//   cellsArr = [];
//   for (let row = 0; row < numberOfRowsInGrid; row++) {
//     cellsArr.push([]);
//     for (let col = 0; col < numberOfColumnsInGrid; col++) {
//       const cellData = gridData[row][col];
//       const cell = document.createElement("div");
//       cell.id = `cell-${row}-${col}`;
//       cell.classList.add("cell");
//       cell.style.top = `${cellData.top}px`;
//       cell.style.left = `${cellData.left}px`;
//       const type = cellData.type;
//       if (type === "breakable") {
//         cell.classList.add("breakable");
//         if (cellData.powerup) {
//           console.log(cellData.powerup.name);
//           cell.classList.add("power-up");
//           cell.classList.add(cellData.powerup.name);
//         }
//       } else if (type === "unbreakable") {
//         cell.classList.add("unbreakable");
//       }
//       grid.append(cell);
//       cellsArr[row].push(cell);
//     }
//   }
// }

function generateLevel() {
  isRemoteControlBombPlanted = false;

  playerColor.textContent = players[ownIndex].role;
  powerupIndicator.textContent = "Power-up";
  lives.textContent = "Lives 3";

  buildGrid();
  gridWrapper.classList.remove("hide");
  infoWrapper.style.display = "flex";
  instructions.style.display = "flex";

  playerSprites = [];
  for (let i = 0; i < players.length; i++) {
    isFirstMove[i] = true;
    isKilled[i] = false;
    playerSprites[i] = document.createElement("div");
    playerSprites[i].style.transition = `transform ${normalTime}ms`;
    playerSprites[i].classList.add("bomberman");
    playerSprites[i].id = `player-${i}`;
    playerSprites[
      i
    ].style.backgroundImage = `url('frontend/assets/images/player-sprites/${players[i].color}.png')`;
    // n & 1 is 1 if n is odd, 0 if n is even
    setSprite(horizontalAnimation[i], (1 + i) & 1, playerSprites[i]);
    grid.appendChild(playerSprites[i]);

    game.style.display = "flex";
    game.classList.add("show");
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  gameLoopId = requestAnimationFrame(gameLoop);
  if (!lastTime) {
    lastTime = timestamp;
  }
  const moveDeltaTime = timestamp - lastTime;
  lastTime = timestamp;
  accumulatedFrameTime += moveDeltaTime;
  while (accumulatedFrameTime >= moveInterval) {
    offbeat = !offbeat;
    accumulatedFrameTime -= moveInterval;
    for (let i = 0; i < players.length; i++) {
      if (!skates[i] && offbeat) {
        continue;
      }
      animateWalk(i);
      move(i);
    }
  }
}

function move(index) {
  // // The commented-out lines were an experiment to prevent unnecessary repaints of player sprites when their position hasn't changed. This convoluted process would be needed apparently to access a transformed position (`sprite.style.left` won't do it). But, in practice, they didn't seem to make a difference. We only see paint flashing in Chrome when a player sprite actually changes position. The one nuance to this is that each player sprite has to be promoted to its own layer with `will-change: transform` or else a paint flash is seen on all younger siblings of the current player sprite, i.e. those appended later to the grid.
  // const sprite = playerSprites[index];
  // const style = window.getComputedStyle(sprite);
  // const matrixString = style.getPropertyValue("transform");
  // if (matrixString !== "none") {
  //   const matrixValues = matrixString
  //     .match(/matrix\((.+)\)/)[1]
  //     .split(", ")
  //     .map(Number);
  //   const currentX = matrixValues[4];
  //   const currentY = matrixValues[5];
  //   if (
  //     currentX === position[index].x * cellSize &&
  //     currentY === position[index].y * cellSize
  //   ) {
  //     return;
  //   }
  // }

  playerSprites[index].style.transform = `translate(${
    position[index].x * cellSize
  }px, ${position[index].y * cellSize}px)`;
  isFirstMove[index] = false;
}

function animateWalk(index) {
  const key = direction[index].key;
  if (!key) {
    return;
  }
  switch (key) {
    case "ArrowUp":
      setSprite(horizontalAnimation[index] + 3, 1, playerSprites[index]);
      break;
    case "ArrowDown":
      setSprite(horizontalAnimation[index] + 3, 0, playerSprites[index]);
      break;
    case "ArrowRight":
      setSprite(horizontalAnimation[index], 1, playerSprites[index]);
      break;
    case "ArrowLeft":
      setSprite(horizontalAnimation[index], 0, playerSprites[index]);
      break;
    default:
      return;
  }
  horizontalAnimation[index] = (horizontalAnimation[index] + 1) % 3;
}

// Player walking sprites are arranged in the spritesheet as follows:
// top row: left (3 frames), down (3 frames);
// bottom row: right (3 frames), up (3 frames).
function setSprite(spriteX, spriteY, playerWrapper) {
  playerWrapper.style.backgroundPosition = `-${spriteX * spriteSize}px -${
    spriteY * spriteSize
  }px`;
}

function anticipateMove(key) {
  direction[ownIndex].key = key;
  switch (key) {
    case "ArrowUp":
      direction[ownIndex].y = -1;
      direction[ownIndex].x = 0;
      break;
    case "ArrowDown":
      direction[ownIndex].y = 1;
      direction[ownIndex].x = 0;
      break;
    case "ArrowLeft":
      direction[ownIndex].y = 0;
      direction[ownIndex].x = -1;
      break;
    case "ArrowRight":
      direction[ownIndex].y = 0;
      direction[ownIndex].x = 1;
  }
  animateWalk(ownIndex);
}

let onKeyDown = (e) => {
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight":
      socket.emit("move", { index: ownIndex, key: e.key });
      anticipateMove(e.key);
      break;
    case "X":
    case "x":
      if (!isKilled[ownIndex]) {
        socket.emit("bomb", {
          y: position[ownIndex].y,
          x: position[ownIndex].x,
          index: ownIndex,
        });
      }
      break;
    case " ":
    case "Spacebar":
      if (isRemoteControlBombPlanted) {
        socket.emit("detonate remote control bombs", ownIndex);
      }
      break;
  }
};

const onKeyUp = (e) => {
  direction[ownIndex].y = 0;
  direction[ownIndex].x = 0;
  direction[ownIndex].key = "";
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowRight":
    case "ArrowLeft":
      socket.emit("stop", ownIndex);
      break;
  }
};

socket.on("move", ({ newPosition, newDirection, index }) => {
  position[index].y = newPosition.y;
  position[index].x = newPosition.x;
  if (index === ownIndex) {
    return;
  }
  direction[index].y = newDirection.y;
  direction[index].x = newDirection.x;
  direction[index].key = newDirection.key;
});

let powerupDisplayTimeoutId;

socket.on("get powerup", ({ y, x, powerup, index }) => {
  const sound = powerupSound.cloneNode(true);
  sound.play();
  sound.onended = function () {
    sound.src = "";
  };
  const cell = cellsArr[y][x];
  cell.classList.remove("power-up");
  cell.classList.remove(powerup.name);
  cell.classList.remove("mystery");
  if (powerup.name === "skate") {
    skates[index] = true;
    playerSprites[index].style.transition = `transform ${skateTime}ms`;
  }
  if (index === ownIndex) {
    powerupIndicator.textContent = powerup.name;
    clearTimeout(powerupDisplayTimeoutId);
    powerupDisplayTimeoutId = setTimeout(() => {
      powerupIndicator.textContent = "Power-up";
    }, 3000);
  }
});

socket.on("life-up", (index, life, y, x) => {
  const sound = powerupSound.cloneNode(true);
  sound.play();
  sound.onended = function () {
    sound.src = "";
  };
  const cell = cellsArr[y][x];
  cell.classList.remove("power-up");
  cell.classList.remove("life-up");
  if (index === ownIndex) {
    lives.textContent = `Lives ${life}`;
    powerupIndicator.innerHTML = "life-up";
    clearTimeout(powerupDisplayTimeoutId);
    powerupDisplayTimeoutId = setTimeout(() => {
      powerupIndicator.textContent = "Power-up";
    }, 3000);
  }
});

socket.on("add fire", (arr) => {
  if (isGameOver) {
    return;
  }
  // arr[0] is the cell where the bomb was planted.
  cellsArr[arr[0].y][arr[0].x].classList.remove(
    "bomb",
    "normal-bomb",
    "remote-control-bomb"
  );
  triggerBombSound(
    gridData[arr[0].y][arr[0].x].bomb.fuse,
    gridData[arr[0].y][arr[0].x].bomb.full
  );
  arr.forEach((cellData) => {
    cellsArr[cellData.y][cellData.x].classList.add(cellData.style);
    if (gridData[cellData.y][cellData.x].type === "breakable") {
      socket.emit("destroy", { y: cellData.y, x: cellData.x });
    }
  });
});

socket.on("remove fire", ({ y, x, style }) => {
  cellsArr[y][x].classList.remove(style);
});

function triggerBombSound(fuse, full) {
  fuse.src = "";
  const explosion = full
    ? fullExplosionSound.cloneNode(true)
    : explosionSound.cloneNode(true);
  if (!full) {
    explosion.volume = 0.3;
  }
  explosion.play();
  explosion.onended = () => {
    explosion.src = "";
  };
}

socket.on("plant normal bomb", ({ y, x, full }) => {
  const fuse = fuseSound.cloneNode(true);
  fuse.play();
  gridData[y][x].bomb = { fuse, full };
  cellsArr[y][x].classList.add("bomb", "normal-bomb");
});

socket.on("plant remote control bomb", ({ y, x, index, full }) => {
  if (index === ownIndex) {
    isRemoteControlBombPlanted = true;
  }
  const fuse = fuseSound.cloneNode(true);
  fuse.play();
  remoteControlFuses[index].push({ fuse, y, x });
  gridData[y][x].bomb = { fuse, full };
  cellsArr[y][x].classList.add("bomb", "remote-control-bomb");
});

socket.on("detonate remote control bombs", (index) => {
  if (index === ownIndex) {
    isRemoteControlBombPlanted = false;
  }
  // If we want allow multiple remote control bombs, we can make each `remoteControlFuses[index]` an array of fuses, and iterate over it here.
  for (const fuse of remoteControlFuses[index]) {
    triggerBombSound(fuse.fuse, false);
  }
  remoteControlFuses[index].length = 0;
});

socket.on("destroy block", ({ y, x }) => {
  if (isGameOver) {
    return;
  }
  const cell = cellsArr[y][x];
  cell.classList.remove("breakable");
  cell.classList.add("breakable-block-destruction");
  cell.addEventListener("animationend", () => {
    cell.classList.remove("breakable-block-destruction");
  });
  gridData[y][x].type = "walkable";
});

socket.on("destroy powerup", ({ y, x, powerupName }) => {
  const cell = cellsArr[y][x];
  cell.classList.remove("power-up");
  cell.classList.remove(powerupName);
});

socket.on("dead", (index) => {
  if (isKilled[index]) {
    return;
  }
  isKilled[index] = true;
  const scream = screamSound.cloneNode(true);
  scream.play();
  scream.onended = function () {
    scream.src = "";
  };
  if (index == ownIndex) {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
  }
  playerSprites[index].classList.remove("bomberman");
  playerSprites[index].classList.add("death");
});

socket.on("spawned", ({ index, isGameOver, powerup, y, x, life, hasSkate }) => {
  if (phase === "start") {
    return; // To avoid error for player who disconnects and is sent to wait on the "game in progress" screen.
  }
  const cell = cellsArr[y][x];
  cell.classList.add("power-up");
  cell.classList.add(powerup.name);
  if (!hasSkate) {
    skates[index] = false;
    playerSprites[index].style.transition = `transform ${normalTime}ms`;
  }
  if (isGameOver) {
    playerSprites[index].style.opacity = 0;
    if (index === ownIndex) {
      lives.textContent = `Lives ${life}`;
    }
    return;
  }
  isKilled[index] = false;
  playerSprites[index].classList.remove("death");
  playerSprites[index].classList.add("bomberman");
  setSprite(
    horizontalAnimation[index],
    // n & 1 is 1 if n is odd, 0 if n is even
    (1 + index) & 1,
    playerSprites[index]
  );
  if (index == ownIndex) {
    lives.textContent = `Lives ${life}`;
    direction[index].y = 0;
    direction[index].x = 0;
    direction[index].key = "";
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }
});

socket.on("game over", ({ survivorIndex, type }) => {
  if (phase === "start") {
    return; // To avoid error for player who disconnects and is sent to wait on the "game in progress" screen.
  }
  isGameOver = true;
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("keyup", onKeyUp);
  cancelAnimationFrame(gameLoopId);
  for (const remoteControlFusesArray of remoteControlFuses) {
    for (const fuse of remoteControlFusesArray) {
      if (fuse) {
        fuse.src = "";
      }
    }
    remoteControlFusesArray.length = 0;
  }
  gridWrapper.classList.add("hide");
  gameOver.innerHTML = "";
  gameOver.classList.remove("hide");
  gameOver.classList.add("show");
  gameOver.style.display = "flex";
  setTimeout(() => {
    displayGameOverMessage(survivorIndex, type);
  }, 4096);
});

function displayGameOverMessage(survivorIndex, type) {
  const winner = players[survivorIndex];
  const imageElement = document.querySelector("#main-pane img");
  outroText = outroTextLose;
  if (type) {
    if (winner) {
      if (ownIndex === survivorIndex) {
        outroText = outroTextWin;
        imageElement.src = "frontend/assets/images/game-over/won.jpg";
        gameOver.innerHTML = `<h1>GAME OVER<br/><br/>THE CLASHING CYMBALS OF VICTORY<br/>ARE YOURS<br/>'${winner.role.toUpperCase()}'<h1>`;
      } else {
        imageElement.src = `frontend/assets/images/game-over/lost.jpg`;
        gameOver.innerHTML = `<h1>GAME OVER<br/><br/>YOU LOST TO<br/>'${winner.role}'</h1>`;
      }
    } else {
      imageElement.src = `frontend/assets/images/game-over/lost.jpg`;
      gameOver.innerHTML = `<h1>GAME OVER<br/><br/>THERE ARE NO WINNERS</h1>`;
    }
  } else {
    outroText = outroTextWin;
    imageElement.src = "frontend/assets/images/game-over/won.jpg";
    gameOver.innerHTML = `<h1>GAME OVER<br/><br/>A MEANINGLESS TRIUMPH<br/>YOUR FOES HAVE FLED INTO THE AETHER<h1>`;
  }
  gameOver.classList.remove("show");
  gameOver.classList.add("hide");
  setTimeout(() => {
    transitionToOutro();
  }, 8192);
}

function transitionToOutro() {
  fetchMusic(outroMusic);
  document.body.style.background = "black";
  document.body.style.transform = `scale(${1})`;
  game.style.display = "none";
  credits.style.display = "none";
  intro.style.display = "block";
  intro.classList.add("show");
  readyButton.innerHTML = "&#x1f4a3;";
  readyButton.classList.remove("hide");
  readyButton.classList.add("show");
  readyButton.addEventListener("click", playAgainHandler);
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = "";
  const textElement = document.createElement("li");
  textElement.style.color = "silver";
  chatForm.querySelector("input").focus();
  chatMessages.insertBefore(textElement, chatMessages.firstChild);
  typeLetter(textElement, outroText, 14);
}

function playAgainHandler() {
  window.location.reload();
}

socket.on("play again", () => {
  window.location.reload();
});

function fetchMusic(musicSource) {
  context = new (window.AudioContext || window.webkitAudioContext)();
  musicGainNode = context.createGain();
  musicGainNode.connect(context.destination);
  context.resume();

  if (window.currentSource) {
    window.currentSource.stop();
    window.currentSource.disconnect();
    window.currentSource = null;
  }

  fetch(musicSource)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      function playAudio() {
        // Ensure any previous source is stopped and disconnected
        if (window.currentSource) {
          window.currentSource.disconnect();
          window.currentSource = null;
        }

        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(musicGainNode);

        let duration = audioBuffer.duration;
        let startTime = duration;

        source.start();

        musicGainNode.gain.setValueAtTime(0, context.currentTime);
        musicGainNode.gain.linearRampToValueAtTime(1, context.currentTime + 1);
        musicGainNode.gain.linearRampToValueAtTime(
          0,
          context.currentTime + startTime
        );

        source.onended = () => {
          playAudio();
        };

        // Update the global currentSource to the new source
        window.currentSource = source;
      }

      function stopAudio() {
        if (window.currentSource) {
          musicGainNode.gain.cancelScheduledValues(context.currentTime);
          musicGainNode.gain.setValueAtTime(
            musicGainNode.gain.value,
            context.currentTime
          );
          musicGainNode.gain.linearRampToValueAtTime(
            0,
            context.currentTime + 0.2
          );
          window.currentSource.stop(context.currentTime + 0.2);
          window.currentSource.disconnect();
          window.currentSource = null;
        }
      }

      // Expose playAudio and stopAudio to be callable globally
      window.startMusic = playAudio;
      window.stopMusic = stopAudio;

      playAudio();
    });
}
