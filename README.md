# The Mad Bomber's Tea Party

[1. Setup](#1-setup)

[2. Progress](#2-progress)

[3. Todo](#3-todo)

- [Add framework](#add-framework)
- [Extra](#extra)

## Setup

To run the server, install Node dependencies: `npm install`. If it reports any vulnerabilities, `npm audit fix`, as directed. Then `node server.js` to run the server on port 3000.

The server will log its IP address in the terminal. To connect over a mobile hotspot, players can enter that address in their browser.

## Progress

The multiplayer Bomberman game is working in Chrome, Brave, Firefox, and Safari. Not yet tested in Edge. As in the single-player version from make-your-game, all bonus powerups are implemented except bomb-push/throw.

The only essential thing left to do for the sake of he audit is to add a framework. I suggest we just framework the game itself, rather than the intro, which includes all sorts of features not required by the instructions. As a first step, I've made a [catalog](framework-plan.md) of all code in `index.html` and `main.js` that affects the game part of the DOM.

Notes:

0. I replaced the nice, smooth, pixel-by-pixel movement with translate and transition from cell to cell. That was my rough-and-ready solution to keeping the multiple players in sync. With pixel-by-pixel movement, they easily got out of sync, I think due to accumulation of small rounding differences in different browsers. The original single-player version from make-your-game looked more like [this version](https://www.retrogames.cc/nes-games/bomberman-usa.html).

1. The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever has joined during the first countdown. Instead, I chose to implement a 10s countdown only. The two countdowns didn't make dramatic sense in the context of my over-the-top intro. Also, 20s is not long to chat! (The instructions don't make it clear whether they expect the chat to continue during the game. I've assumed not.)

2. As far as I can see, the instructions for the required tasks don't say whether a player can hold more than one powerup at a time. I followed the single-player game in assuming not. However, one of the bonus tasks is to ensure that "when a player dies it drops one of it's power ups. If the player had no power ups, it drops a random power up." That does imply the possibility of holding multiple powerups. According to Gemini, the original did allow multiple powerups. Does "dies" mean loses a life or loses their last life? If the former, should they lose the all their powerups or just one? If we allow players to hold multiple powerups at once, it will involve changing quite a bit of game logic, as well as the UI where it displays the name of the current powerup. (One possibility would be to have the game grid on one side of the screen and a margin at the other side with a guide to what the powerup symbols mean, along with how many of each you're holding, or something to indicate whether a boolean powerup is held.) I think it would make the game more fun. Not necessary for the audit, though, so we don't need to let it hold us up.

3. The corresponding audit question asks, "When a player dies, is a random power up release [sic] as described in the subject's bonus section?" I've made it so that the player just drops any powerup they're holding. That seemed more logical to me.

4. The instructions are ambigious as to whether "increases the amount of bombs dropped at a time by 1" and "increases explosion range from the bomb in four directions by 1 block" is in comparison to the player's baseline without powerup or their current ability. As a consequence of being able to only hold ond powerup at a time, this has been a moot point. But in case we do allow multiple powerups to be held at once, Gemini says that, indeed, the original game did allow each player to acquire an increasing numbers of bombs, up to a maximum of 10. And, "Each fire-up powerup increased the explosion radius of the bombs by one tile. There was no set limit to how many fire-up powerups could be collected, but the explosion could eventually fill the entire screen."

5. As it stands, the server only allows a single instance of the game to be played at any one time. Switching to allow multiple instances would take some work.

## Todo

### Add framework

This seems a shame as it will, at best, have no effect for players. All we can hope is that the decline in performance will not be noticeable! I suggest we start work on it in a dedicated feature branch so that we'll still have a pre-framework version, in case we want to improve it or eventually host it.

We need to decide which framework to use: mine, Stefan's, the one Bilal has been working on, or something based on Rodrigo Pombo's `Didact`. In what follows, for definiteness, I'll assume we're using my `overReact` (because, being made maively, I think it migh tbe quick and easy to apply), but a lot of the points will hold for any of them. I'll assume the goal is simply to framework the core game, taking `game` or `grid` or perhaps `gridWrapper` as the app. That's enough to satisfy the spirit of the exercise without getting bogged down in making it work with all the optional extras of the intro too.

As a first step, I've [cataloged](framework-plan.md) all code that affects the DOM subtree with `game` as its root.

Remaining tasks:

- Give unique ids to everything, including the `info-box` elements.
- Create the virtual nodes and combine them to make the app.
- Rewrite all code that affects the DOM to only modify the virtual DOM.
- Think of any suitable state variables that we want to trigger automatic updates, e.g. position and direction. We also have the option (escape hatch) of being able to simply call the `update()` method on the app, but we should try to maintain or recreate batching of updates. Caution: pass `update()` to `requestAnimationFrame` (or call it from the game loop) to ensure that the event handler has a chance to make all of its changes to the virtual DOM before diff and reconciliation.
- Make sure that updates are called whenever necessary.

### Extra

- CHAIN EXPLOSIONS
  - Move timeout from "plant normal bomb" on client to server `plantNormalBomb` so that it has access to the timeout id. Store this id in an object in the grid: `grid[y][x].plantedBomb = { player, fireRange: player.fireRange, full, timeoutId };`. When calculating explosions, the server can then cancel timeouts and trigger explosions as needed. Consider serverside functions: `planNormalBomb`, `plantRemoteControlBomb`, `detonate`, and `addFire`; and clientside handlers for "plant normal bomb", "plant remote control bomb" (plus fuse sound-effect array for the remote control bombs), and "keydown" handler. Think especially carefully about remote control bombs and be sure to replenish the correct players' stock of bombs.
- MULTI-POWERS
  - Allow multiple powerups to be held at once: logic, UI (e.g. put info in a margin, move grid to one side, list powerups by their symbol, distinguish between scalar--lives, bombs, fire--and boolean powers, highlight boolean powerups in your possession).
- HOST PRIVATELY
  - To allow friends to play remotely (to learn about hosting and as an experiment to see how well the networking works), research how to host on Google App Engine, which, I gather, can be made private, and accessible by signing in to Google. The latter would need an authentication page before the game starts. This would need an authentication page before the game starts. (We'd need to support multiple game instances before hosting publicly, which would be significantly moer work to adapt; see below.)

### Extra-extra

- FIX/IMPROVE
  - There's often a jump where the character profile picture changes when the eyelids are still open.
  - Sometimes there is a pause on initiating movement or changing direction before it takes effect. Lag due to waiting for signal from socket? But test this in case that's not the reason. Could try a rollback technique: show player's own sprite moving immediately and correct when signal comes from server if need be, e.g. if another player or a bomb blocked their way (if they don't have the bomb-pass powerup).
  - Possibly already fixed now that disconnections during countdown are handled better. I haven't managed to recreate it, but I'll leave the details here just in case. Server crashed once when a player in Safari pressed CTR+SHIFT+R to view simplified page, without styles, during countdown. Apparently this led to them being undefined even though the normal disconnection logic had not gone ahead. I've tried a few times and haven't managed to replicate it. It triggered the classic lightning-conductor-of-errors, `isDead(player)`: `return grid[player?.position?.y][player?.position?.x].type === "fire";` (accusing arrow points to 2nd instance of player in the line), "TypeError: Cannot read properties of undefined (reading 'undefined')". Since then I've added some protections and logging in case of future issues.
  - I didn't anticipate that if you drop a full-fire by collecting another powerup after planting the full-fire bomb and before it goes off, you can collect it again, allowing you to re-use it. It might be nice to leave it in as a fun quirk that can be learnt and exploited. Or it might be a good exercise to fix just it.
- SECURITY
  - Neater "play again" logic, rather then current, crude solution, which is to force a page reload.
  - Reconnection logic (e.g. 3 attempts then consider gone: update player.id to new id using index from client to link them; better yet, use a cookie. Test how well connections last, using a mobile hotspot.)
- COUNTDOWN
  - Move control to server.
  - Throttle ready/pause button.
- REFACTOR
  - For preformance, recycle fixed-size arrays and objects where possible, rather than pushing, popping, and making new ones.
  - Simplify any logic that can be simplified.
  - Consider whether any variable names could be made clearer or standardized.
  - Tidy project structure, maybe split into modules, such as intro and game, and maybe more. Socket handlers for each? But consider that a single file loads faster and might actually be easier to navigate.
- BONUS
  - Easy bonus: allow a 5th player to be spawed in the center of the grid. (Make sure they have space and that they don't interfere with the mechanism to always place one each of the three basic powerups.)
  - POWERUPS
    - `bomb-throw` powerup, aka `bomb-push`.
    - Not on the list: `smoke-bomb` that fills nearby tunnels with smoke that disperses more slowly than fire, and can be walked through but not seen through.
    - Not on the list: `soft-block-push`.
  - CO-OP MODES
    - Teams.
    - AI opponent. (If we implement an AI opponent, we can also use it to fill in empty slots in the regular battle royale mode.)
  - SINGLE-PLAYER MODE
    - The enemies from the original single-player game could be re-introduced, along with the door and multiple levels.
  - GHOST
    - Player comes back as a ghost is among the suggested bonus tasks. I think it would dilute the drama though. Gilding the lily.
- DESIGN
  - See if we can get scrollbar "thumb" to appear on hover over the roles menu in all browsers, not just Firefox. At the moment, it appears briefly when the menu first appears in Chrome, for example. I think this is preferable to how it was before, though, when all sorts of scrollbars appeared all the time.
  - Make scrollbar "thumb" partially transparent or not overlapping the right edge of the text if possible.
  - Beyond a certain width, chat pane overhangs left edge of input box.
  - Make intro layout more responsive to handle smaller window size, especially the ready button that currently overlaps the title when the screen gets too narrow.
  - Fix scale in CSS to rely only on units relative to screen size and make sure it works on various screen sizes.
  - Test scrollbars etc. in Edge too. Improve current hacky solution. Understand better.
  - Design own sprites.
  - Find a font with more punctiation. None that I've tried looked good enough to sacrifice Wolves and Ravens.
- ROLES
  - Add randomizer to allow alternative profile pictures for roles: name consistently and put each selection in its own folder so we can programmatically pic one from the folder.
  - Get gray's pitchfork in shot.
  - Write backstory or character sketch for each role and think how and where to display them.
- KEYS
  - Let different keys be used for different players, at least for testing, so that two can play on one keyboard.
- STRUCTURE
  - Bring client structure more into line with how things are done on the server: player objects rather than those position and direction arrays (which are a leftover from my initial tinkering wit hthe single-player client-only game to make it multi-player, before I moved the logic to the server).
  - Investigate whether it would be worth implementing the "state pattern" for powerups, especially the movement logic.
- HOSTING
  - Allow multiple game instance at once.
  - Host, maybe on Glitch, which I gather has a limited free option to host a Node server.
