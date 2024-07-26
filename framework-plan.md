# Plan for adding the framework

[1. Overview](#1-overview)

[2. Event listeners](#-event-listeners)

[3. Elements](#2-elements)

## 1. Overview

I suggest we just framework the game itself, rather than the intro. First, identify all event listeners that might affect the DOM, then all DOM elements and all lines in `main.js` that affect those elements.

## 2. Event listeners

In game event listeners:

In `generateLevel`,

`document.addEventListener("keydown", onKeyDown);`
`document.addEventListener("keyup", onKeyUp);`

In `killBomberMan(index)`,

`document.removeEventListener("keydown", onKeyDown);`

In `destroyBlocks(y, x)`,

`cell.addEventListener("animationend", () => {`

In `socket.on("start", ...`,

`document.removeEventListener("keydown", keydownHandler);`

In `socket.on("spawned", ...`,

`document.addEventListener("keydown", onKeyDown);`

In `gameOverHandler(survivorIndex, type)`,

`document.removeEventListener("keydown", onKeyDown);`
`document.removeEventListener("keyup", onKeyUp);`

We also have all the socket listeners, of the form `socket.on`.

- lose remote control
- life up
- add fire
- remove fire
- start
- move
- powerup
- plantNormalBomb
- plantRemoteControlBomb
- detonateRemoteControlBomb
- destroy block
- destroy powerup
- dead
- used full-fire
- spawned
- game over
- play again

## 3. Elements

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
let gridDataFromServer;
const gameOver = document.getElementById("game-over");
const gridWrapper = document.getElementById("grid-wrapper");
const infoWrapper = document.getElementById("info");
const instructions = document.getElementById("instructions");
const playerInfo = document.getElementById("player-info");
const lives = document.getElementById("lives");
const power = document.getElementById("power-up");
```

In `socket.on("start game" ...`, we make the game visible with `document.getElementById("game").classList.add("show");`

`generateLevel()` concludes the setup. It calls `buildGrid()`, which returns `cellsArr`, a 2d array of 13 rows of 15 columns each. In `buildGrid()`, for each cell of the grid, we make a div and give it the class `cell`, the `style` attributes `top` and `left` with its pixel coordinates, and a `power-up` class if it contains a powerup, along with a class with the name of the specific powerup, `bomb-up`, `fire-up`, `skate`, etc.

```javascript
const cellData = gridDataFromServer[row][col];
const cell = document.createElement("div");
cell.classList.add("cell");
cell.style.top = `${cellData.top}px`;
cell.style.left = `${cellData.left}px`;
cell.classList.add(`${cellData.type}`);
if (cellData.powerup) {
  console.log(cellData.powerup.name);
  cell.classList.add("power-up");
  cell.classList.add(cellData.powerup.name);
}
grid.append(cell);
cellsArr[row].push(cell);
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
let newGrid = document.createElement("div");
grid.parentNode.replaceChild(newGrid, grid);
grid = newGrid;
grid.id = "game-grid";
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
