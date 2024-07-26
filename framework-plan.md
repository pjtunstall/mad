# Plan for adding the framework

[1. Overview](#1-overview)

[2. Event listeners](#2-event-listeners)

[3. Elements](#3-elements)

## 1. Overview

I suggest we just framework the game itself, rather than the intro.

First, catalogue all DOM stuff: all DOM elements and variables that refer to them, plus all event handlers (and functions called by event handlers, directly or indirectly) that change the DOM.

## 2. Event handlers

These include handlers for the following event types:

- socket (i.e. signals received from the server)
- `keydown`
- `keyup`
- `animationend`

Socket handlers are callbacks passed to the `socket.on` method. Here are all the names of the socket events for the game itself (as opposed to the intro).

- lose remote control
- life up
- add fire
- remove fire
- start
- move
- powerup
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

Initial HTML consists of a `game` element that starts out hidden and is revealed when the countdown ends. `game-over`, of course, starts out hidden too. At the end, text will be inserted according to who won. The `grid-wrapper` contains everything else, including the `game-grid` itself, an `info` section above it, and `instructions` below. The grid will be filled in with data from the server at the end of the countdown. The `info` section contains three items with class `info-box`, representing the different pieces of info to be displayed for one's own character.

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

Globally,

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
let bomberManWrapper = [];
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

`generateLevel()` calls `setSprite(spriteX, spriteY, player)`, which is also used during the game. It changes the CSS `background-position` property to animate the player's walk:

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
  // n & 1 is 1 if n is odd, 0 if n is even
  setSprite(horizontalAnimation[i], (1 + i) & 1, bomberManWrapper[i]);
  grid.appendChild(bomberManWrapper[i]);
}
```

Now we come to the socket and keypress event handlers associated with the game itself, and to the functions they call.

In `getPowerup(y, x, powerup, index)`, the cell is manipulated thus:

```javascript
cell.classList.remove("power-up");
cell.classList.remove(powerup.name);
cell.classList.remove("mystery");
cell.classList.add("walkable");
```

If the powerup being collected is a skate, the relevant `bomberManWrapper` is adjusted thus:

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
