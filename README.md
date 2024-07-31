# The Mad Bomber's Tea Party

[1. Setup](#1-setup)

[2. Background](#2-background)

[3. Progress](#2-progress)

## 1. Setup

To run the server, install Node dependencies: `npm install`. If it reports any vulnerabilities, `npm audit fix`, as directed. Then `node server.js` to run the server on port 3000.

The server will log its IP address in the terminal. To connect over a mobile hotspot, players can enter that address in their browser. As yet it only supports a single instance of the game.

## 2. Background

[bomberman-dom](https://learn.01founders.co/git/root/public/src/branch/master/subjects/bomberman-dom) is the final JavaScript project of the 01Founders course. The brief asks us to make a multiplayer browser game, based on the classic 1983 [Bomberman](https://en.wikipedia.org/wiki/Bomberman), using web sockets, but no WebGL or any framework apart from the toy frontend framework we made in the previous project, [mini-framework](https://github.com/01-edu/public/tree/master/subjects/mini-framework). ([Our mini-framework](https://github.com/pjtunstall/mini-framework).)

Our multiplayer game was adapted from a single-player original by teammate Rashid and his teammates on that project. (See in-game credits.)

[Other features](docs/optional-extras.md) may be added to the game at some point.

## 3. Framework

Branch `<frame>` contains a version that "uses" our framework. We won't be merging it with `main` since it's superfluous to the program. We just added it in a minimal way for the sake of the exercise. Rather than integrating it fully, we just used it to create the grid structure and do one initial render. Since I won't be updating the docs in that branch, it might be convenient to see the difference here.

In that version, the only changes we made were as follows. We placed the `overreact` folder from our `mini-frameowrk` project in the root folder of this one. In `main.js`, we imported it with

```javascript
import { overReact } from "./overreact/over-react.js";
```

Then, in `main.js`, we rewrote the `buildGrid()` function from

```javascript
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
```

to

```javascript
function buildGrid() {
  const vApp = new VNode("div", { attrs: { id: "game-grid" } });
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
```

For more detail, see this [discussion](docs/framework.md), which includes the original plan and thoughts on developing it further, together with a catalog of all code in `index.html` and `main.js` that affects the game part of the DOM. I don't see see any gain to be had from integrating it more thoroughly. It would be a needless drag on performance, at best unnoticeable.

## 4. Progress

I think we can call it done.

The multiplayer Bomberman game is working in Chrome, Brave, Firefox, and Safari. Not yet tested in Edge. As in the single-player version from make-your-game, all bonus powerups are implemented except bomb-push/throw.

Notes:

0. I replaced the nice, smooth, pixel-by-pixel movement of the single-player version with translate and transition from cell to cell. That was my rough-and-ready solution to keeping the multiple players in sync. With pixel-by-pixel movement, they easily got out of sync, I think due to accumulation of small rounding differences in different browsers. The original single-player version from make-your-game looked more like [this version](https://www.retrogames.cc/nes-games/bomberman-usa.html).

1. The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever has joined during the first countdown. Instead, I chose to implement a 10s countdown only. The two countdowns didn't make dramatic sense in the context of my over-the-top intro. Also, 20s is not long to chat! (The instructions don't make it clear whether they expect the chat to continue during the game. I've assumed not.)

2. As far as I can see, the instructions for the required tasks don't say whether a player can hold more than one powerup at a time. I followed the single-player game in assuming not. However, one of the bonus tasks is to ensure that "when a player dies it drops one of it's power ups. If the player had no power ups, it drops a random power up." That does imply the possibility of holding multiple powerups. According to Gemini, the original did allow multiple powerups. Does "dies" mean loses a life or loses their last life? I guess the former. If the so, should they lose the all their powerups or just one? If we allow players to hold multiple powerups at once, it will involve changing quite a bit of game logic, as well as the UI where it displays the name of the current powerup. (One possibility would be to have the game grid on one side of the screen and a margin at the other side with a guide to what the powerup symbols mean, along with how many of each you're holding, or something to indicate whether a boolean powerup is held.) I think it would make the game more fun. Not necessary for the audit, though, so we don't need to let it hold us up.

3. The corresponding audit question asks, "When a player dies, is a random power up release [sic] as described in the subject's bonus section?" I've made it so that the player just drops any powerup they're holding. That seemed more logical to me.

4. The instructions are ambigious as to whether "increases the amount of bombs dropped at a time by 1" and "increases explosion range from the bomb in four directions by 1 block" is in comparison to the player's baseline without powerup or their current ability. As a consequence of being able to only hold ond powerup at a time, this has been a moot point. But in case we do allow multiple powerups to be held at once, Gemini says that, indeed, the original game did allow each player to acquire an increasing numbers of bombs, up to a maximum of 10. And, "Each fire-up powerup increased the explosion radius of the bombs by one tile. There was no set limit to how many fire-up powerups could be collected, but the explosion could eventually fill the entire screen."
