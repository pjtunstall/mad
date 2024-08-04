// Global variables:
// 1. Intro and general variables
// 2. Game variables
// 3. Game loop variables
// 4. Intro and outro sounds
// 5. Game sounds
// 6. Story and credits text, character and color arrays

// Intro and general variables
let isGameOver;
let phase;
let players;
let ownIndex;
let playersInLobby;
const startButton = document.getElementById("start");
const everythingContainer = document.getElementById("everything-container");
const readyButton = document.getElementById("ready");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
let currentIndex;
let lastClickedItem;
let alreadyInChat;
let countdown;
let typingTimeout;
let counting;
let timerStartTime;
let resumeFrom;
let timerId;

// Game variables
let position = [
  { y: 1, x: 1 },
  { y: 1, x: 13 },
  { y: 11, x: 1 },
  { y: 11, x: 13 },
];
// Components of normalized velocity vector for each player, and the key pressed to achieve that vector
let direction = [
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
  { y: 0, x: 0, key: "" },
];
let skates = [false, false, false, false];
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
const power = document.getElementById("power-up");
let cellsArr; // 2d array to store the cells of the game grid
let playerSprites; // Array to store the player sprite divs
const numberOfRowsInGrid = 13;
const numberOfColumnsInGrid = 15;
const cellSize = 64;
const spriteSize = 64;
let horizontalAnimation = [0, 0, 0, 0]; // background-positions representing current frames of each player's walking animation
const startingScore = 0;
let currentScore = startingScore;
const isKilled = new Array(4).fill(false);
let remoteControl = false;
let isRemoteControlBombPlanted = false;

// Game loop variables
let gameLoopId;
let offbeat = false;
const moveInterval = 25;
let lastTime = 0;
let lastCollisionCheck = 0;
const collisionCheckInterval = 100;
let accumulatedFrameTime = 0;

// Intro and outro sounds
let context;
let musicGainNode;
const introMusic =
  "assets/music/music_fx_ominous_cinematic_nordic_folk_with_hardanger.mp3";
const outroMusic =
  "assets/music/music_fx_rustic_folk_blissful_epiphany_dulcimer_drones.mp3";
const audio = new Audio("assets/sfx/quick-mechanical-keyboard-14391.mp3");
audio.loop = true;
const clock = new Audio("assets/sfx/old-fashioned-clock-sound-37729.mp3");
clock.loop = true;

// Game sounds
const powerupSound = new Audio("assets/sfx/coin-pickup-98269.mp3");
const fuseSound = new Audio("assets/sfx/fuse.mp3");
const screamSound = new Audio("assets/sfx/cartoon-scream-1-6835.mp3");
fuseSound.loop = true;
const explosionSound = new Audio(
  "assets/sfx/8-bit-explosion-low-resonant-45659.mp3"
);
const fullExplosionSound = new Audio(
  "assets/sfx/052168_huge-explosion-85199.mp3"
);
let remoteControlFuses = [[], [], [], []];

const socket = io(":3000", {
  reconnection: false, // Changing this to allow reconnection would mean we'd have to alter how the server handles disconnections, including "play again" logic.
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from the server:", reason);
  location.reload(true);
});

// Story and credits text, character and color arrays
let slideshow;
let startImages = [
  "assets/images/slideshow/OIG1.JeeX.W.9kcfz6VS0J4uP.jpg",
  "assets/images/slideshow/OIG1.RHh.TiTv_89Q_qetbTqj.jpg",
  "assets/images/slideshow/OIG1.tT9zpwTaUvUSXc63p1uk.jpg",
  "assets/images/slideshow/OIG2.5v.ScYh44ajXn0PSpcT2.jpg",
  "assets/images/slideshow/OIG2.Jb7YWs.Tj7vKMzHxi7X7.jpg",
  "assets/images/slideshow/OIG2.L5eB8ppZFTF.HHCu1eFe.jpg",
  "assets/images/slideshow/OIG2.m1xtNwK.2dLzyjVhdYht.jpg",
  "assets/images/slideshow/OIG2.sdD0aK7mFca3yF_OSxuW.jpg",
  "assets/images/slideshow/OIG2.souzLAE7.Hfsy3099Vv4.jpg",
  "assets/images/slideshow/OIG2.X2Fui0nJzmm3u9LNVXfm.jpg",
  "assets/images/slideshow/OIG1.ixSAqnhJACfFzjGWjbPI.jpg",
];

const defaultImageForRoles = [
  "assets/images/roles/default/default.jpg",
  "assets/images/roles/default/default1.jpg",
  "assets/images/roles/default/OIG..oUUFHfUtXBqURKCJZbp.jpg",
  "assets/images/roles/default/OIG.5NlsEQhWcybBlnw0CE7F.jpg",
  "assets/images/roles/default/OIG.yykY1XiTafngQHZoIuIn.jpg",
  "assets/images/roles/default/OIG.GhKqkXmNWjAzmkLQReAz.jpg",
];

const characters = [
  "Old Nickle",
  "Blackleg",
  "Silver Bullet",
  "Ghost",
  "Shocking Pink",
  "Not So Magentle",
  "Purple with Rage",
  "Mad Bomber",
  "Livid",
  "Cyanide",
  "The Green Reaper",
  "Furious Yellow",
  "Golden Age",
  "Unhinged Orange",
  "Brown Bess",
  "Red Salamander",
];

const colors = [
  "gray",
  "black",
  "silver",
  "white",
  "pink",
  "magenta",
  "purple",
  "blue",
  "darkblue",
  "cyan",
  "green",
  "yellow",
  "gold",
  "orange",
  "brown",
  "red",
];

const placeholders = [
  "Express your rage",
  "Pour out a torrent of abuse",
  "Share your pain",
  "Vent here",
  "Let it all out",
  "Tell them what for",
  "Give them a piece of your mind",
  "Let forth your fury",
  "Scream",
  "Let the world know how it has failed you",
  "Rant away",
  "Rage against the machine",
  "Curse them all",
  "Vent your spleen",
  "Give them hell",
  "Unleash your inner beast",
  "Let your demons out",
  "Type your famous last words here",
];

const hypogeum = [
  "has entered the staging area",
  "has joined the 'game'",
  "is in the holding cage",
  "will fight today",
  "awaits the emperor's pleasure",
  "awaits the will of the Blasted God",
  "has been cast into the waiting room",
  "has descended into the entrance pit",
  "has been thrown into the holding pen",
  "is here",
  "is here now",
  "is present now",
  "is here in the hypogeum",
  "stands ready to fight",
];

const creditContent = document.getElementById("credit-content");
for (let i = 0; i < 3; i++) {
  creditContent.innerHTML += `
          <div id="credit-content-${i}" class="credit-content">
          <p class="divider">&#x1f4a3;</p>
            <p>
              Welcome to The Mad Bomber's Tea Party, a game of skill and fate
              for 2-4 players.
            </p>
            <p>
              Inspired by Hudson Soft's 1983 classic, Bomberman, created by
              Shinichi Nakamoto and Shigeki Fujiwara.
            </p>
            <p>
              This multiplayer edition by Mohammed Rashidur Rahman, Peter
              Tunstall, Bilal Sharif, and Daisy "Citric" Murray.
            </p>
            <p>
              Adapted from Mohammed Rashidur Rahman, Michael Adeleke, and Peter
              Coles' single-player version.
            </p>
            <p>Wolves and Ravens font by S. John Ross of Cumberland Fontworks.</p>
            <p>
              Bomberman (NES) sprites ripped by Black Squirrel and
              Superjustinbros.
            </p>
            <p>SFX: Pixabay.</p>
            <p>Music by Google's AI Test Kitchen</p>
            <p>AI art by Dall-E.</p>
            <p>
              This is a non-commercial project. All rights to the original game
              belong to Konami Digital Entertainment.
            </p>
            <p>Controls: arrow keys to move, X to plant bomb.</p>
            <p>Objective: kill them all.</p>
          </div>
  `;
}

const introText = `<br /><br /><br /><br />In the depths of Melancholia, heaviest planet in the universe, a mad alien emperor has issued a decree.<br /><br />Each midwinter, four trapped miners must fight.<br /><br />One alone will survive.<br /><br />But some bleak spirits have come to revel in the art, to seek it out even.<br /><br />The art. The craft.<br /><br />The bomb.<br /><br />For there is a zen to everything, anything the human mind can turn itself to:<br /><br />a zen of flower arranging, a zen of tea.<br /><br />Aye, and there is the zen of bombing.<br /><br />Certain names have become legend. Elemental spirits, gods of destruction. In later times, all gladiators would take on their mask.<br /><br />There were four.<br /><br />There will be only one . . . <br /><br />`;
let outroText;
const outroTextWin = `<br /><br /><br /><br />'Nos morituri te salutamus'<br /><br />In the depths of Melancholia, heaviest planet in the universe, a mad alien emperor once issued a decree<br /><br />Funny way to celebrate a solstice, but as good as any you suppose.<br /><br />The laurels and faded ribbons mark you apart as a bomber to be reckoned with although the further you wander the less they mean. But what does any of it mean?<br /><br />You were ready to be one of them, your heroes, the ones who went before. Ready to meet your Blasted God. Yet it's you whom that great spirit of disaster has bowed down to. You had no plan for this.<br /><br />'We who are about to die salute you'<br /><br />The words grow dim with time as you trudge on into the waste.<br /><br />'Aut non' The emperor's reply.<br /><br />'Or not'<br /><br />And now . . . Uncharted territory.<br /><br />`;
const outroTextLose = `<br /><br /><br /><br />Something was different this time. You took it to portend some especially great glory. What else could it be, this fiery feeling, this ecstasy?<br /><br />'Nos morituri . . .'<br /><br />Gunpowder, your favorite perfume, hung thick on the winter air that day. You trod as in a dream, craft honed to perfection. Mind racing beyond body, your spirit could hardly contain itself. That should have been the clue.<br /><br />But victory was all you'd known. How could you have known?<br /><br />You moved as never till now, ten steps ahead of your rivals and saw the dozen meanings in every gesture, all the futures branching.<br /><br />All but one.<br /><br />'We who are about to die salute you'<br /><br />'Or not'. The emperor's reply rings hollow in your ears. That charred husk--it dawns on you--is your own. The spectators rise in great silent tumult, but you are already far hence.<br /><br />You were a gladiator once.<br /><br />And now . . . Uncharted territory.<br /><br />`;

transitionToStart();

function transitionToStart() {
  isGameOver = false;
  phase = "start";
  ownIndex = null;
  playersInLobby = 0;
  currentIndex = 0;
  alreadyInChat = false;
  players = [];
  counting = false;
  timerStartTime = null;
  resumeFrom = 10;
  timerId = null;
  countdown = 11;
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

  // // I've noticed that, unfortunately, the way browsers display alt text interferes with the design as it positions this text intrusively over the image itself. I've decided to remove it for now.
  // imgElement.alt =
  //   "bleak slideshow images of human figures (tiny specks of insignificance) battling it out in towering, gray-black amphitheaters for the amusement of monstrous alien gods";

  let mainPane = document.getElementById("main-pane");
  mainPane.appendChild(imgElement);

  // Watch out! There is another fucntion of this name, with a different signature, in the global scope.
  function updateImage() {
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

  updateImage();
  return setInterval(updateImage, 8192);
}

// Beware! There is another function of this name, with a different signature, inside the `startSlideshow` function.
function updateImage(imageElement, toSrc, delay = 1024) {
  imageElement.classList.remove("show");

  setTimeout(() => {
    // Needed to remove and re-append the image element make it work in Safari. It was fine in Chrome, Brave, and Firefox. Safari was downloading the right image and showed the correct src for the image element. One theory is "aggressive caching". Failed solutions that might be useful on another occasion: `imageElement.src = toSrc + "?t=" + Date.now()` to make the browser think it's a new image, or `imageElement.src = "";` followed by `imageElement.src = toSrc;`, intended to force a reload. Removing the image and replacing it with a new one lost the event listeners. Rather than going to the trouble of re-adding them, I tried this approach, which worked.
    const mainPane = document.getElementById("main-pane");
    imageElement.classList.remove("show");
    mainPane.removeChild(imageElement);
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
      const toSrc = `assets/images/roles/${colors[i]}.jpg`;
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
  imageElement.src = `assets/images/numbers/${resumeFrom}.jpg`;

  for await (let count of counter(resumeFrom - 1)) {
    resumeFrom = count;
    imageElement.classList.remove("show");
    imageElement.src = `assets/images/numbers/${count}.jpg`;
    imageElement.classList.add("show");
  }

  clearTimeout(timerId);
  clearInterval(slideshow);
  counting = false;
  clock.pause();
  clock.time = 0;
  readyButton.classList.add("hide");
  readyButton.classList.remove("show");

  // At this point, we could send a signal to the server like this to start the game, but it would make more sense to move the countdown logic to the server and have it initiate the game itself when it reaches this point, maybe waiting a couple of seconds for any lagging players to catch up to zero, but starting regardless when some deadline is reached.
  socket.emit("start game");
}

socket.on("start game", ({ updatedPlayers, newGrid }) => {
  players = updatedPlayers;
  gridData = newGrid;
  audio.pause();
  intro.style.display = "none";
  document.body.style.background = "gray";
  document.body.style.transform = "scale(0.5)";
  document.getElementById("game").classList.add("show");
  generateLevel();
});

function buildGrid() {
  let newGrid = document.createElement("div");
  grid.parentNode.replaceChild(newGrid, grid);
  grid = newGrid;
  grid.id = "game-grid";
  cellsArr = [];
  for (let row = 0; row < numberOfRowsInGrid; row++) {
    cellsArr.push([]);
    for (let col = 0; col < numberOfColumnsInGrid; col++) {
      const cellData = gridData[row][col];
      const cell = document.createElement("div");
      cell.id = `cell-${row}-${col}`;
      cell.classList.add("cell");
      cell.style.top = `${cellData.top}px`;
      cell.style.left = `${cellData.left}px`;
      const type = cellData.type;
      if (type === "breakable") {
        cell.classList.add("breakable");
        if (cellData.powerup) {
          console.log(cellData.powerup.name);
          cell.classList.add("power-up");
          cell.classList.add(cellData.powerup.name);
        }
      } else if (type === "unbreakable") {
        cell.classList.add("unbreakable");
      }
      grid.append(cell);
      cellsArr[row].push(cell);
    }
  }
}

function generateLevel() {
  remoteControl = false;
  isRemoteControlBombPlanted = false;

  playerColor.textContent = players[ownIndex].role;
  lives.textContent = "Lives 3";

  buildGrid();
  gridWrapper.classList.remove("hide");
  infoWrapper.style.display = "flex";
  instructions.style.display = "flex";

  playerSprites = [];
  for (let i = 0; i < players.length; i++) {
    isKilled[i] = false;
    playerSprites[i] = document.createElement("div");
    playerSprites[i].style.transition = `transform ${normalTime}ms`;
    playerSprites[i].classList.add("bomberman");
    playerSprites[i].id = `player-${i}`;
    playerSprites[
      i
    ].style.backgroundImage = `url('assets/images/player-sprites/${players[i].color}.png')`;
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
  playerSprites[index].style.transform = `translate(${
    position[index].x * cellSize
  }px, ${position[index].y * cellSize}px)`;
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

const onKeyDown = (e) => {
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowRight":
    case "ArrowLeft":
      socket.emit("move", { index: ownIndex, key: e.key });
      break;
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
  position[index] = newPosition;
  direction[index] = newDirection;
});

socket.on("get powerup", ({ y, x, powerup, index }) => {
  getPowerup(y, x, powerup, index);
});

function getPowerup(y, x, powerup, index) {
  const sound = powerupSound.cloneNode(true);
  sound.play();
  sound.onended = function () {
    sound.src = "";
  };
  const cell = cellsArr[y][x];
  cell.classList.remove("power-up");
  cell.classList.remove(powerup.name);
  cell.classList.remove("mystery");
  if (index === ownIndex && powerup.name === "remote-control") {
    remoteControl = true;
  }
  if (powerup.name === "skate") {
    skates[index] = true;
    playerSprites[index].style.transition = `transform ${skateTime}ms`;
  }
}

socket.on("life-up", (index, life, y, x) => {
  const sound = powerupSound.cloneNode(true);
  sound.play();
  sound.onended = function () {
    sound.src = "";
  };
  const cell = cellsArr[y][x];
  cell.classList.remove("power-up");
  cell.classList.remove("life-up");
});

socket.on("lose remote control", () => {
  remoteControl = false;
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
    gridData[arr[0].y][arr[0].x].bomb.full,
    arr[0].y,
    arr[0].x
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

function triggerBombSound(fuse, full, y, x) {
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
    // // This line can't be placed directly after the line where `triggerBombSound` is called or else the function call triggers an error "can't read properties of null, reading 'fuse'". It can't be placed in `triggerBombSound` after `fuse.src = ""`, the last use of `fuse`. At first, I managed to put it here, even though I'd have thought `explosion` doesn't rely on a reference to `bomb` or `fuse`; presumably `full` is copied, being just a bool; in any case, even `full` is not used in this asynchonous callback. Later, it became a problem even here. I realized it wasn't necessary to null it since it's obly accessed if a bomb has been planted in the cell, and, if so, it will always have the latest bomb's data. But I'm leaving this comment here because I'd like to understand how the error happened.
    // gridData[y][x].bomb = null;
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
    triggerBombSound(fuse.fuse, false, fuse.y, fuse.x);
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
    remoteControl = false;
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
  }
  playerSprites[index].classList.remove("bomberman");
  playerSprites[index].classList.add("death");
});

socket.on("spawned", ({ index, isGameOver, powerup, y, x, life, hasSkate }) => {
  if (phase === "start") {
    return; // To avoid cosmetic error message for player who disconnects and is sent to wait on the "game in progress" screen.
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
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }
});

socket.on("game over", ({ survivorIndex, type }) => {
  if (phase === "start") {
    return; // To avoid cosmetic error message for player who disconnects and is sent to wait on the "game in progress" screen.
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
        imageElement.src = "assets/images/game-over/won.jpg";
        gameOver.innerHTML = `<h1>GAME OVER<br/><br/>THE CLASHING CYMBALS OF VICTORY<br/>ARE YOURS<br/>'${winner.role.toUpperCase()}'<h1>`;
      } else {
        imageElement.src = `assets/images/game-over/lost.jpg`;
        gameOver.innerHTML = `<h1>GAME OVER<br/><br/>YOU LOST TO<br/>'${winner.role}'</h1>`;
      }
    } else {
      imageElement.src = `assets/images/game-over/lost.jpg`;
      gameOver.innerHTML = `<h1>GAME OVER<br/><br/>THERE ARE NO WINNERS</h1>`;
    }
  } else {
    outroText = outroTextWin;
    imageElement.src = "assets/images/game-over/won.jpg";
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
  document.body.style.transform = "scale(1)";
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
