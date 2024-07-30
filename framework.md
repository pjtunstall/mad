# Original plan for adding the framework

[1. Overview](#1-overview)

[2. Original plan](#2-earlier-plan)

[3. Event listeners](#3-event-listeners)

[4. Elements and code that affects them](#4-elements-and-code-that-affects-them)

## 1. Overview

After talking to others, I decided to just use the framework to set up the grid initially, taking `game-grid` as the root node of (frameworked part of) the app. That satisfies the audit. The only function affected is `buildGrid()`. Integrating it thoroughly would make the game less performant, but in case anyone is interested in doing something in this direction as an exercise, here is my earlier plan together with a guide to the DOM-related material in the game itself. Further steps that could be taken include:

- Rewrite all code that affects the DOM to only modify the virtual DOM.
- Think of any suitable state variables that we want to trigger automatic updates, e.g. position and direction. We also have the option (escape hatch) of being able to simply call the `update()` method on the app, but we should try to maintain or recreate batching of updates. Caution: pass `update()` to `requestAnimationFrame` (or call it from the game loop) to ensure that the event handler has a chance to make all of its changes to the virtual DOM before diff and reconciliation.
- Make sure that updates are called whenever necessary.

A smaller-scale project might be to replace `dummyState` with a state object containing all components of position and direction for each player. We'd need to make sure that the updates automatically performed by `overReact` in response to any change to these values are rate-limited. Compare how the current game loop prevents updates from happening more often for clients with a higher frame-rate. Although the server controls the timing of movements from cell to cell, the clientside JavaScript is still responsible for the walking animation.

## 2. Original plan

I suggest we just framework the game itself, rather than the intro. Easiest of all would be to take `game-grid` as the root node of our frameworked app. (Other candidates are `game` and `grid-wrapper`.) We could, as others have done, just use the framework to create the elements and render them initially. Routing is irrelevant: we don't want players being able to navigate at will between different phases of the game.

As a first step, here is a catalogue of all the DOM stuff: all DOM elements and variables that refer to them, all lines that affect the DOM, and all event handlers.

As it turns out, `overReact`'s event delegation system is indeed an overreaction in this case. The only event handler that's attached to a descendant of `game` (a plausible root element for our app) is the `animationend` handler, which removes the "breakable-block-destruction" class from a block at the end of its destruction animation. The keypress handlers are attached to `document`, and the other event handlers are all for the socket. For the sake of the exercise, we could shoehorn that little `animationend` handler into being centrally delegated, but it's hardly worth it.

Therefore this catalog of event handlers is just for the sake of identifying DOM elements and places where the DOM is modified.

## 3. Event handlers

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

## 4. Elements and code that affects them

All the game elements defined in `index.html` are shown here. They're all labeled here by id, except for the `info-box`s, which are anonymous and labeled by class. To adapt them to `overReact`, we'd need to give them ids too. They all have tag `div`, except for `game-over`, which is a `h1`.

```
game
├── game-over
├── grid-wrapper
│   ├── info
│   │   ├── info-box
│   │   │   └── player-color
│   │   ├── info-box
│   │   │   └── power-up
│   │   └── info-box
│   │       └── lives
│   ├── game-grid
│   └── instructions
│       ├── ARROWS TO MOVE . 'X' TO PLANT BOMB
│       └── REMOTE CONTROL MODE . PRESS 'SPACE' TO EXPLODE
```

Initial HTML consists of a `game` element that starts out hidden and is revealed when the countdown ends. `game-over`, of course, starts out hidden too. At the end, text will be inserted into `game-over` according to who won.

The `grid-wrapper` contains everything else, including the `game-grid` itself, an `info` section above it (containing three items of class `info-box`, representing the different pieces of info to be displayed for one's own character) and `instructions` below. (I have an idea for changing this to accomodate holding multiple powerups, but this is how it is for now.)

The game grid will be filled in with 13 \* 15 = 195 `div`s of class `cell` (and possibly other classes, as described below), based on data from the server at the end of the countdown.

```html
<div id="game">
  <h1 id="game-over"></h1>
  <div id="grid-wrapper">
    <div id="info">
      <div class="info-box" id="color-box">
        <div id="player-color">Player:</div>
      </div>
      <div class="info-box" id="power-box">
        <div id="power-up">Powerup:</div>
      </div>
      <div class="info-box" id="life-box">
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

The JavaScript in `main.js` represents the different types of blocks by applying CSS classes: `breakable` or `unbreakable` to the cells. The original `walkable` class is now omitted and its style treated as default. 2-4 player sprites are appended to the grid when the game begins, also with tag `div`, and given the `bomberman` class, which is replaced by a `death` class to show the animation of them being blown up. During the game, cells are given the class `bomb` when a bomb is planted, together with `normal-bomb` or `remote-control-bomb`, as the case may be, to apply the relevant animation (finite or infinite). When they explode, the different styles of fire (center, intermediate, and end-pieces) are represented by classes given to the affected cells. On "game over", the `grid-wrapper` is hidden and `game-over` revealed by juggling of `hide` and `show` classes and adding `display: flex` style to `game-over`. Finally, in `transitionToOutro`, `game` is hidden with `display: none`, and our work is done.

Here's a detailed catalog of the JavaScript that interacts with the DOM.

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
let playerSprites; // Array to store the player sprite divs
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

It concludes by creating and styling the the player character elements in the `playerSprites` array. To each `playerSprites[i]`, where `i` ranges over the length of the players array, `generateLevel()` assigns the class `bomberman` and sets the background image and initial position, i.e. frame, of the walking animation, then appends each player sprite to the grid.

```javascript
playerSprites = [];
for (let i = 0; i < players.length; i++) {
  // ...
  playerSprites[i] = document.createElement("div");
  playerSprites[i].style.transition = `transform ${normalTime}ms`;
  playerSprites[i].classList.add("bomberman");
  playerSprites[
    i
  ].style.backgroundImage = `url('assets/images/player-sprites/${color[i]}.png')`;
  setSprite(horizontalAnimation[i], (1 + i) & 1, playerSprites[i]);
  grid.appendChild(playerSprites[i]);
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

If the powerup being collected is a skate, the relevant `playerSprites` is adjusted thus to synchronize the CSS animation that moves the player sprite smoothly from cell to cell with its new speed:

```javascript
if (powerup.name === "skate") {
  playerSprites[index].style.transition = `transform ${skateTime}ms`;
} else {
  playerSprites[index].style.transition = `transform ${normalTime}ms`;
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
playerSprites[index].style.transform = `translate(${
  position[index].x * cellSize
}px, ${position[index].y * cellSize}px)`;
```

When the socket receives a "dead" signal (a signal to kill one of the players), it does the following:

```javascript
if (index == ownIndex) {
  document.removeEventListener("keydown", onKeyDown);
}
playerSprites[index].classList.remove("bomberman");
playerSprites[index].classList.add("death");
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

In "add fire",

```javascript
cellsArr[arr[0].y][arr[0].x].classList.remove(
  "bomb",
  "normal-bomb",
  "remote-control-bomb"
);
arr.forEach((cellData) => {
  cellsArr[cellData.y][cellData.x].classList.add(cellData.style);
  if (gridData[cellData.y][cellData.x].type === "breakable") {
    socket.emit("destroy", { y: cellData.y, x: cellData.x });
  }
});
```

In the "remove fire" handler,

```javascript
cellsArr[y][x].classList.remove(style);
```

In "plant normal bomb",

```javascript
cellsArr[y][x].classList.add("bomb", "normal-bomb");
```

In "plant remote control bomb",

```javascript
cellsArr[y][x].classList.add("bomb", "remote-control-bomb");
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
playerSprites[index].classList.remove("bomberman");
playerSprites[index].classList.remove(`bomberman${index}`);
playerSprites[index].classList.add("death");
```

In "used full-fire",

```javascript
power.innerHTML = "PowerUp: none";
```

In "spawned",

```javascript
playerSprites[index].style.transition = `transform ${normalTime}ms`;
// ...
const cell = cellsArr[y][x];
cell.classList.add("power-up");
cell.classList.add(powerup.name);
power.innerHTML = "PowerUp: none";
// ...
playerSprites[index].style.opacity = 0;
if (index === ownIndex) {
  lives.textContent = `Lives: ${life}`;
}
// ...
playerSprites[index].classList.remove("death");
playerSprites[index].classList.add("bomberman");
setSprite(horizontalAnimation[index], (1 + index) & 1, playerSprites[index]);
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
