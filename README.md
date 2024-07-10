# Setup

Install Node dependencies: `npm install`. If it reports any vulnerabilities, `npm audit fix`, as directed. Then `node server.js` to run the server on port 3000.

# Progress

Multiplayer Bomberman game working. Just need to add a framework.

Note 1: The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever was had joined during the first countdown. Instead, I chose to just implement a 10s countdown. The two countdowns didn't make dramatic sense in the context of my over-the-top intro!

Note 2: I started a fresh repo for Gitea. That's because I used GitHub at first, which has a more generous memory limit for individual files. When I discovered that one of the sound effect files was too big for Gitea, I trimmed it to fit, but Gitea still won't accept the repo as there's a reference to the old file in history.

Note 3: as it stands, it only allows a single instance of the game to be played at any one time.

# Todo

## Required

- FRAMEWORK
  - Just game `grid`?
    - That's probably enough to satisfy the spirit of the exercise without getting bogged down in making it work with all the optional extras of the intro too. All they ask is that we use the framework; they don't say how or to what extent. They don't even ask about it at the audit.
  - Decide which mini-framework to use: mine was made naively, and thus lends itself to naive technique; plenty of escape hatches.
  - Note where all relevant the DOM stuff is in the game: `generateLevel`, `buildGrid`, socket handlers, `gameLoop`, `move`, `setSprite`. Audio is ouside of DOM, so ignore that.
  - Think of suitable state variables to trigger updates.

## Extra

- SECURITY
  - Sanitize names and messages. (Important to do this before any attempt to host the game.)
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
  - Fix credits sensitive to zoom: at less than 100%, I've seen the top of the first visible section (the unicode bomb) cut off. Test the whole intro and game on different screen sizes and fix if need be.
  - At full screen or suchlike width, chat pane overhangs left edge of input box.
  - Make intro layout more responsive to handle smaller window size, especially the ready button that currently overlaps the title when the screen gets too narrow.
  - Fix scale in CSS to rely only on units relative to screen size and make sure it works on various screen sizes.
  - Fix and understand issue with multiple vertical scoll bars on the chat messages.
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
