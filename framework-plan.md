## Event listeners

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

## Elements

Globally,

```javascript
let grid = document.getElementById("game-grid");
let gridDataFromServer;
const gameStatus = document.getElementById("game-status");
const startUp = document.getElementById("start-up");
const gameOver = document.getElementById("game-over");
const gridWrapper = document.getElementById("grid-wrapper");
const infoWrapper = document.getElementById("info");
const instructions = document.getElementById("instructions");
const playerInfo = document.getElementById("player-info");
const lives = document.getElementById("lives");
const power = document.getElementById("power-up");
```

In web socket on "start game" handler,

```javascript
bomberManWrapper = new Array(players.length);
for (let i = 0; i < players.length; i++) {
  bomberManWrapper[i] = document.createElement("div");
  bomberManWrapper[i].style.transition = `transform ${normalTime}ms`;
}
```

In `startGame()`,

`document.getElementById("game").classList.add("show");`

Then `buildGrid()`, `setSprite(spriteX, spriteY, player)`, and `generateLevel()` are all relevant. And that concludes the setup. In detail, in `buildGrid()`, for each cell of the grid, we make a div and give it the class `cell`, the `style` attributes `top` and `left` with its pixel coordinates, and a `power-up` class if it contains a powerup, along with a class with the name of the specific powerup, `bomb-up`, `fire-up`, `skate`, etc.

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
```
