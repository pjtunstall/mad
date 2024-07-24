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
