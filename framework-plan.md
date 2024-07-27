# Plan for adding the framework

[1. Overview](#1-overview)

[2. Event listeners](#2-event-listeners)

[3. Elements](#3-elements)

## 1. Overview

I suggest we just framework the game itself, rather than the intro.

As a first step, here is a catalogue of all the DOM stuff: all DOM elements and variables that refer to them, all lines that affect the DOM, and all event handlers.

As it turns out, `overReact`'s event delegation system is indeed an overreaction in this case. The only event handler that's attached to a descendant of `game` (a plausible root element for our app) is the `animationend` handler, which removes the "breakable-block-destruction" class from a block at the end of its destruction animation. The keypress handlers are attached to `document`, and the other event handlers are all for the socket. But sure, if we do use `overReact`, then, for the sake of the exercise, we can shoehorn that little `animationend` handler into being centrally delegated.

Therefore this catalog of event handlers is just for the sake of identifying places where the DOM is modified.

## 2. Event handlers

These include handlers for the following event types:

- socket (i.e. signals received from the server)
- `keydown`
- `keyup`
- `animationend`

Of these, the `keydown` and `keyup` handlers don't affect the DOM directly. Rather they emit signals to the server, which performs the game logic and sends signals back to the client to initiate changes. There's just one `animationend` handler, set in the socket "destroy block" handler, which does perform one action on the DOM. Thus, the main source of DOM manipulation is the socket handlers and a few functions that they call.

Socket handlers are callbacks passed to the `socket.on` method. Here are all the names of the socket events for the game itself (as opposed to the intro).

- lose remote control
- life up
- add fire
- remove fire
- start
- move
- get powerup
- plant normal bomb
- plant remote control bomb
- detonate remote control bomb
- destroy block
- destroy powerup
- dead
- used full-fire
- spawned
- game over
- play again

Here are where `keydown`, `keyup`, and `animationend` listeners are added or removed:

In `generateLevel`,

`document.addEventListener("keydown", onKeyDown);`
`document.addEventListener("keyup", onKeyUp);`

In `socket.on("dead", ...`,

`document.removeEventListener("keydown", onKeyDown);`

In `destroyBlocks(y, x)`,

`cell.addEventListener("animationend", () => {`

In `socket.on("start", ...`,

`document.removeEventListener("keydown", keydownHandler);`

In `socket.on("spawned", ...`,

`document.addEventListener("keydown", onKeyDown);`

In `socket.on("game over", ...`,

`document.removeEventListener("keydown", onKeyDown);`
`document.removeEventListener("keyup", onKeyUp);`

## 3. Elements and code that affects them

Initial HTML consists of a `game` element that starts out hidden and is revealed when the countdown ends. `game-over`, of course, starts out hidden too. At the end, text will be inserted into `game-over` according to who won. The `grid-wrapper` contains everything else, including the `game-grid` itself, an `info` section above it, and `instructions` below. The grid will be filled in with data from the server at the end of the countdown. The `info` section contains three items with class `info-box`, representing the different pieces of info to be displayed for one's own character.

```html
<div id="game">
  <h1 id="game-over"></h1>
  <div id="grid-wrapper">
    <div id="info">
      <div class="info-box">
        <div id="player-color">Player:</div>
      </div>
      <div class="info-box">
        <div id="power-up">Powerup:</div>
      </div>
      <div class="info-box">
        <div id="lives">Lives: 0</div>
      </div>
    </div>
    <div id="game-grid"></div>
    <div id="instructions">
      <div>ARROWS TO MOVE . 'X' TO PLANT BOMB</div>
      <div>REMOTE CONTROL MODE . PRESS 'SPACE' TO EXPLODE</div>
    </div>
  </div>
</div>
```

The top level of our code declares the following global variables:

```javascript
let grid = document.getElementById("game-grid");
const startUp = document.getElementById("start-up");
const gameOver = document.getElementById("game-over");
const gridWrapper = document.getElementById("grid-wrapper");
const infoWrapper = document.getElementById("info");
const instructions = document.getElementById("instructions");
const playerColor = document.getElementById("player-color");
const lives = document.getElementById("lives");
const power = document.getElementById("power-up");
let cellsArr; // 2d array to store the cells of the game grid
let bomberManWrapper; // Array to store the player sprite divs
```

In `socket.on("start game" ...`, we make the game visible with `document.getElementById("game").classList.add("show");`

`generateLevel()` concludes the setup. It calls `buildGrid()`, which returns `cellsArr`, a 2d array with 13 rows of 15 columns each. In `buildGrid()`, for each cell of the grid, we make a div and give it the class `cell`, the `style` attributes `top` and `left` with its pixel coordinates, and a `power-up` class if it contains a powerup, along with a class with the name of the specific powerup, `bomb-up`, `fire-up`, `skate`, etc.

```javascript
function buildGrid() {
  let newGrid = document.createElement("div");
  grid.parentNode.replaceChild(newGrid, grid);
  grid = newGrid;
  grid.id = "game-grid";
  const cellsArr = [];
  for (let row = 0; row < numberOfRowsInGrid; row++) {
    cellsArr.push([]);
    for (let col = 0; col < numberOfColumnsInGrid; col++) {
      const cellData = gridDataFromServer[row][col];
      const cell = document.createElement("div");
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
  return cellsArr;
}
```

`generateLevel()` goes on to call `setSprite(spriteX, spriteY, player)`, which is also used during the game. It changes the CSS `background-position` property to animate the player's walk:

```javascript
player.style.backgroundPosition = `-${spriteX * spriteSize}px -${
  spriteY * spriteSize
}px`;
```

`generateLevel()` creates the stats bar and a new game grid, substituting it for the previous one. Initially, `game-grid` is an empty div, `<div id="game-grid"></div>`, referenced in the JS as `let grid = document.getElementById("game-grid");`.

```javascript
playerInfo.textContent = `Player: ${color[ownIndex]}`;
lives.textContent = "Lives: 3";
power.innerHTML = "PowerUp: none";
```

Then, after `buildGrid()` has populated the grid with cells, `generateLevel()` continues with

```javascript
game.style.display = "flex";
game.classList.add("show");
gridWrapper.classList.remove("hide");
infoWrapper.style.display = "flex";
instructions.style.display = "flex";
```

It concludes by styling the the player character elements in the `bomberManWrapper` array. To each `bomberManWrapper[i]`, where `i` ranges over the length of the players array, `geneerateLevel()` assigns the class `bomber-man` and sets the background image and initial position, i.e. frame, of the walking animation, then appends the bomberManWrapper to the grid.

```javascript
bomberManWrapper = [];
for (let i = 0; i < players.length; i++) {
  // ...
  bomberManWrapper[i] = document.createElement("div");
  bomberManWrapper[i].style.transition = `transform ${normalTime}ms`;
  bomberManWrapper[i].classList.add("bomber-man");
  bomberManWrapper[
    i
  ].style.backgroundImage = `url('assets/images/player-sprites/${color[i]}.png')`;
  setSprite(horizontalAnimation[i], (1 + i) & 1, bomberManWrapper[i]);
  grid.appendChild(bomberManWrapper[i]);
}
```

Now we come to the socket and keypress event handlers associated with the game itself, and to the functions they call.

When the socket receives a "get powerup" signal, it first drops any previous powerup in the cell the player just left:

```javascript
if (previousPowerup) {
  const cell = cellsArr[oldY][oldX];
  cell.classList.add("power-up");
  cell.classList.add(previousPowerup.name);
}
```

Then it calls `getPowerup(y, x, powerup, index)`, which collects the powerup, modifying the cell thus:

```javascript
cell.classList.remove("power-up");
cell.classList.remove(powerup.name);
cell.classList.remove("mystery");
cell.classList.add("walkable");
```

If the powerup being collected is a skate, the relevant `bomberManWrapper` is adjusted thus to synchronize the CSS animation that moves the player sprite smoothly from cell to cell with its new speed:

```javascript
if (powerup.name === "skate") {
  bomberManWrapper[index].style.transition = `transform ${skateTime}ms`;
} else {
  bomberManWrapper[index].style.transition = `transform ${normalTime}ms`;
}
```

The game loop calls `animateWalk(index)`, which calls `setSprite(spriteX, spriteY, playerWrapper)` with arguments depending on direction of movement and player to be animated, which updates the walking animation frame:

```javascript
playerWrapper.style.backgroundPosition = `-${spriteX * spriteSize}px -${
  spriteY * spriteSize
}px`;
```

Then the game loop calls `move(index)` to translate each player character:

```javascript
bomberManWrapper[index].style.transform = `translate(${
  position[index].x * cellSize
}px, ${position[index].y * cellSize}px)`;
```

When the socket receives a "dead" signal (a signal to kill one of the players), it does the following:

```javascript
if (index == ownIndex) {
  document.removeEventListener("keydown", onKeyDown);
}
bomberManWrapper[index].classList.remove("bomber-man");
bomberManWrapper[index].classList.remove(`bomber-man${index}`);
bomberManWrapper[index].classList.add("death");
```

When the socket receives a "life-up" signal (indicating that someone has collected a "life-up" powerup), it does the following, briefly displaying a heart symbol in the powerup `info-box` if it was the current player who picked it up:

```javascript
const cell = cellsArr[y][x];
cell.classList.remove("power-up");
cell.classList.remove("life-up");
if (index === ownIndex) {
  lives.textContent = `Lives: ${life}`;
  power.innerHTML = "PowerUp: &#x2665;&#xfe0f;";
  setTimeout(() => {
    power.innerHTML = "PowerUp: none";
  }, 2048);
}
```

In the "remove fire" handler,

```javascript
cellsArr[y][x].classList.remove(style);
```

In "add fire",

```javascript
const bombElement = document.getElementById(`bomb-${arr[0].y}-${arr[0].x}`);
bombElement.remove();
arr.forEach((cellData) => {
  cellsArr[cellData.y][cellData.x].classList.add(cellData.style);
  if (gridData[cellData.y][cellData.x].type === "breakable") {
    socket.emit("destroy", { y: cellData.y, x: cellData.x });
  }
});
```

In "plant normal bomb",

```javascript
const bomberManCell = cellsArr[y][x];
const bombElement = document.createElement("div");
bombElement.classList.add("bomb");
bombElement.style.top = bomberManCell.style.top;
bombElement.style.left = bomberManCell.style.left;
bombElement.id = `bomb-${y}-${x}`;
grid.appendChild(bombElement);
bombElement.style.animation = "bomb-animation 1s steps(1) 2";
```

In "plant remote control bomb",

```javascript
const bomberManCell = cellsArr[y][x];
const bombElement = document.createElement("div");
bombElement.classList.add("bomb");
bombElement.style.top = bomberManCell.style.top;
bombElement.style.left = bomberManCell.style.left;
bombElement.id = `bomb-${y}-${x}`;
grid.appendChild(bombElement);
bombElement.style.animation = "bomb-animation 1s steps(1) infinite";
```

In "destroy block",

```javascript
const cell = cellsArr[y][x];
cell.classList.remove("breakable");
cell.classList.add("breakable-block-destruction");
cell.addEventListener("animationend", () => {
  cell.classList.remove("breakable-block-destruction");
});
```

In "destroy powerup",

```javascript
const cell = cellsArr[y][x];
cell.classList.remove("power-up");
cell.classList.remove(powerupName);
```

In "dead",

```javascript
if (index == ownIndex) {
  document.removeEventListener("keydown", onKeyDown);
}
bomberManWrapper[index].classList.remove("bomber-man");
bomberManWrapper[index].classList.remove(`bomber-man${index}`);
bomberManWrapper[index].classList.add("death");
```

In "used full-fire",

```javascript
power.innerHTML = "PowerUp: none";
```

In "spawned",

```javascript
bomberManWrapper[index].style.transition = `transform ${normalTime}ms`;
// ...
const cell = cellsArr[y][x];
cell.classList.add("power-up");
cell.classList.add(powerup.name);
power.innerHTML = "PowerUp: none";
// ...
bomberManWrapper[index].style.opacity = 0;
if (index === ownIndex) {
  lives.textContent = `Lives: ${life}`;
}
// ...
bomberManWrapper[index].classList.remove("death");
bomberManWrapper[index].classList.add("bomber-man");
setSprite(horizontalAnimation[index], (1 + index) & 1, bomberManWrapper[index]);
if (index == ownIndex) {
  lives.textContent = `Lives: ${life}`;
  document.addEventListener("keydown", onKeyDown);
}
// ...
```

In "game over",

```javascript
document.removeEventListener("keydown", onKeyDown);
document.removeEventListener("keyup", onKeyUp);
cancelAnimationFrame(gameLoopId);
gridWrapper.classList.add("hide");
gameOver.innerHTML = "";
gameOver.classList.remove("hide");
gameOver.classList.add("show");
gameOver.style.display = "flex";
```

And pretty much the whole of `displayGameOverMessage(survivorIndex, type)` and `transitionToOutro()` is DOM stuff. And that's it for the game itself.
