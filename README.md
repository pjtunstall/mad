# The Mad Bomber's Tea Party

[1. Setup](#1-setup)

[2. Background](#2-background)

[3. Progress](#3-progress)

[4. Framework](#4-framework)

## 1. Setup

To run the server, install Node dependencies: `npm install`. If it reports any vulnerabilities, `npm audit fix`, as directed. Then `node server.js` to run the server on port 3000.

The server will log its IP address in the terminal. To connect over a mobile hotspot, players can enter that address into their browser. As yet it only supports a single instance of the game.

For the audit, to demonstrate use of our `mini-framework`, switch to branch `<frame>`. See [below](#4-framework).

## 2. Background

This is our take on the final project of the JavaScript section of the [01Founders course](https://01edu.notion.site/Global-01-Curriculum-50b7d94ac56a429fb3aee19a32248732), a branch of the [01Edu](https://01-edu.org/pedagogy) coding bootcamp system. The [brief](https://github.com/01-edu/public/tree/master/subjects/bomberman-dom) asks us to make a multiplayer browser game, based on the classic 1983 [Bomberman](https://en.wikipedia.org/wiki/Bomberman), using web sockets, but no WebGL or any framework apart from the [toy one](https://github.com/pjtunstall/mini-framework) we made in a previous project, [mini-framework](https://github.com/01-edu/public/tree/master/subjects/mini-framework).

Our multiplayer game was adapted from a single-player original by one of us, Rashid, and his teammates on that project. (See in-game credits.)

[Other features](docs/optional-extras.md) may be added to the game at some point.

## 3. Progress

I think we can call it done.

The multiplayer Bomberman game is working in Chrome, Brave, Firefox, and Safari. Not yet tested in Edge. As in the single-player version from make-your-game, all bonus powerups are implemented except bomb-push/throw.

Notes:

0. I replaced the nice, smooth, pixel-by-pixel movement of the single-player version with translate and transition from cell to cell. That was my rough-and-ready solution to keeping the multiple players in sync. With pixel-by-pixel movement, they easily got out of sync as I moved the logic incrementally to the server, I think due to accumulation of small rounding differences in different browsers. The original single-player version from make-your-game looked more like [this version](https://www.retrogames.cc/nes-games/bomberman-usa.html). Pixelwise movement could perhaps be restored by having the server calculate position on an extremely fine-grained grid, with as much resolution as the most detailed screen it's likely to be played on, and let clients round this each to their own current resolution, updated with corrections from the server each tick.

1. The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever has joined during the first countdown. Instead, I chose to implement a 10s countdown only. The two countdowns didn't make dramatic sense in the context of my over-the-top intro. Also, 20s is not long to chat! (The instructions don't make it clear whether they expect the chat to continue during the game. I've assumed not.)

## 4. Framework

Branch `<frame>` contains a version that "uses" our framework. We won't be merging it with `main` since it's superfluous to the game. We just added it in a minimal way just for the sake of the audit. Rather than integrating it fully, we followed the example of students who went before us and just used it to create the grid structure and do one initial render. Since I won't be updating the docs in that branch, it might be convenient to document the difference here.

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

For more detail, see this [discussion](docs/framework.md), which includes the original plan and thoughts on how it might be developed it further, together with a catalog of all code in `index.html` and `main.js` that affects the game part of the DOM. I don't see see any gain to be had from integrating it more thoroughly. It would be a needless drag on performance, at best unnoticeable.
