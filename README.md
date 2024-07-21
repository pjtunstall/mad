# Setup

Install Node dependencies: `npm install`. If it reports any vulnerabilities, `npm audit fix`, as directed. Then `node server.js` to run the server on port 3000.

The server will log its IP address in the browser. To connect over a mobile hotspot, players can enter that address in their browser.

# Progress

The multiplayer Bomberman game is working. We just need to add a framework. It seems a shame as it will, at best, have no effect for players. All we can hope is that the decline in performance will not be noticeable! We can start work on it in a dedicated feature branch.

Notes:

1. The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever was had joined during the first countdown. Instead, I chose to just implement a 10s countdown. The two countdowns didn't make dramatic sense in the context of my over-the-top intro!

2. I started a fresh repo for Gitea. That's because I used GitHub at first, which has a more generous memory limit for individual files. When I discovered that one of the sound effect files was too big for Gitea, I trimmed it to fit, but Gitea still won't accept the repo as there's a reference to the old file in history.

3. As it stands, it only allows a single instance of the game to be played at any one time. Switching to allow multiple instances would take some work. For that reason, I'm no longer aiming to host it in the near future.

# Todo

## Fix

- Make sure outro text for loser scrolls all the way into view.

- If you're fast enough, you can plant a bomb after being killed and before you're transported back to your corner. Disable X while death in progress.

- I didn't adticipate that if you drop a full-fire by collecting another powerup after planting the full-fire bomb and before it goes off, you can collect it again, allowing you to re-use it. It might be nice to leave it in as a fun quirk that can be learnt and exploited. Leave as is?

## Add framework

We needs to decide which framework to use: mine, Stefan's, or something based on Rodrigo Pombo's `Didact`. Rather than letting that hold us up, we could pick one and have a go. In what follows, for definiteness, I'll assume we're using my `overReact` (because, being made maively, I think it migh tbe quick and easy to apply), but a lot of the points will hold for any of them. I'll assume the goal is simply to framework the core game, taking `grid` or perhaps `gridWrapper` as the app. That's enough to satisfy the spirit of the exercise without getting bogged down in making it work with all the optional extras of the intro too.

Here's what I think we'll need to do:

Find all DOM elements that belong to the app, all code that accesses or changes them, and all relevant global variables. Code that access or changes DOM elements may be

- top-level: typically global variable declarations
- in event handlers (input handlers and WebSocket on-message handlers)
- in normal functions such as `generateLevel`, `buildGrid`, `gameLoop`, `move`, `setSprite`.

Write functions to create the virtual nodes and combine them to make the app.

Think of any suitable state variables that we want trigger automatic updates. We also have the option (escape hatch) of being able to simply call the `update` method on the app.

Rewrite the code to use the framework. Some of this will just be a matter of switching from DOM syntax to virtual DOM syntax. I anticipate it will only be in the event handlers whose logic will need changing a bit.

## Extra

- SECURITY
  - Sanitize names and messages. (Important to do this before any attempt to host the game.)
  - Disconnection logic on client: gracefully handle what happens if they disconnect at any stage before, during, or after the game.
  - Reconnection logic (e.g. 3 attempts then consider gone: update player.id to new id using index from client to link them; better yet, use a cookie. Test how well connections last, using a mobile hotspot.)
- COUNTDOWN
  - Move control to server.
  - Throttle ready/pause button.
- REFACTOR
  - Simplify any logic if possible.
  - Consider whether any variable names could be made clearer or standardized.
    - In particular, `gameInProgress`, `isGameActive`, `isGameInitialized` could be renamed to reflect exactly when each is set to true and what it indicates. Are all of them necessary?
  - Tidy project structure, maybe split into modules.
- BONUS
  - Easy bonus: allow a 5th player to be spawed in the center of the grid. (Make sure they have space and that they don't interfere with the mechanism to always place one each of the three basic powerups.)
  - POWERUPS
    - `bomb-throw` powerup.
    - Not on the list: `smoke-bomb` that fills nearby tunnels with smoke that disperses more slowly than fire, and can be walked through but not seen through.
    - Not on the list: `soft-block-push`.
  - CO-OP MODES
    - Teams.
    - AI opponent. (If we implement an AI opponent, we can also use it to fill in empty slots in the regular battle royale mode.)
  - SINGLE-PLAYER MODE
  - GHOST
    - Player comes back as a ghost is suggested. I think it would dilute the drama though. Gilding the lily.
- DESIGN
  - Make sure end of intro and outro text scrolls fully into view on different browsers and operating systems, screen sizes, shapes, and zooms.
  - At full screen or suchlike width, chat pane overhangs left edge of input box.
  - Make intro layout more responsive to handle smaller window size, especially the ready button that currently overlaps the title when the screen gets too narrow.
  - Fix scale in CSS to rely only on units relative to screen size and make sure it works on various screen sizes.
  - Test scrollbars etc. in Edge too. Improve current hacky solution. Understand better.
  - Design own sprites.
- ROLES
  - Add randomizer to allow alternative profile pictures for roles: name consistently and put each selection in its own folder so we can programmatically pic one from the folder.
    - If we then use it, make a background for red3.
  - Get gray's pitchfork in shot.
  - Write backstory or character sketch for each role and have it appear possibly as a popup on hovering over their profile picture.
- KEYS
  - Let different keys be used for different players, at least for testing, so that two can play on one keyboard.
- STRUCTURE
  - Bring client structure more into line with how things are done on the server: player objects rather than those position and direction arrays (which are a leftover from my initial tinkering wit hthe single-player client-only game to make it multi-player, before I moved the logic to the server).
  - Investigate whether it would be worth implementing the "state pattern" for powerups, especially the movement logic.
- HOSTING
  - Sanitize names and messages, as noted in SECURITY.
  - Allow multiple game instance at once.
  - Host, maybe on Glitch, which I gather has a limited free option to host a Node server.
