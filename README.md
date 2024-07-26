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

The multiplayer Bomberman game is working in Chrome, Brave, Firefox, and Safari. Not yet tested in Edge. As in the single-player game, all bonus powerups are implemented except bomb-push/throw. Players only drop a powerup on death if they're holding one.

The only essential thing left to do for the sake of he audit is to add a framework.

Notes:

1. The instructions and audit expect us to have a simple lobby with a 20s countdown, followed by a 10s countdown for whoever has joined during the first countdown. Instead, I chose to just implement a 10s countdown. The two countdowns didn't make dramatic sense in the context of my over-the-top intro!

2. As far as I can see, the instructions for the required tasks don't say whether a player can hold more than one powerup at a time. I've followed the single-player game in assuming not. However, one of the bonus tasks is to ensure that "when a player dies it drops one of it's power ups. If the player had no power ups, it drops a random power up." That does imply the possibility of holding multiple powerups. The corresponding audit question asks, "When a player dies, is a random power up release as described in the subject's bonus section?" I've made it so that the player just drops any powerup they're holding. That seemed more logical to me.

3. The instructions are ambigious as to whether "increases the amount of bombs dropped at a time by 1" and "increases explosion range from the bomb in four directions by 1 block" is in comparison to the player's baseline without powerup or their current ability. I've followed the single-player game in assuming the former. It wouldn't be hard to adjust the logic to the incremental interpretation.

4. As it stands, it only allows a single instance of the game to be played at any one time. Switching to allow multiple instances would take some work.

## Todo

### Add framework

This seems a shame as it will, at best, have no effect for players. All we can hope is that the decline in performance will not be noticeable! I suggest we start work on it in a dedicated feature branch so that we'll still have a pre-framework version, in case we want to improve it or eventually host it.

We need to decide which framework to use: mine, Stefan's, the one Bilal has been working on, or something based on Rodrigo Pombo's `Didact`. In what follows, for definiteness, I'll assume we're using my `overReact` (because, being made maively, I think it migh tbe quick and easy to apply), but a lot of the points will hold for any of them. I'll assume the goal is simply to framework the core game, taking `game` or `grid` or perhaps `gridWrapper` as the app. That's enough to satisfy the spirit of the exercise without getting bogged down in making it work with all the optional extras of the intro too.

Here's what I think we'll need to do:

Catalog all DOM elements that belong to the app, whether created in `index.html` or `main.js`. Catalog all code that creates, changes, or removes them, and variables that reference them. I've started this in `framework-plan.md`. Places where such code can be found are:

- top-level: typically global variable declarations
- event handlers (socket, keydown, keyup, animationend)
- other functions called by event handlers (directly or indirectly)

Create the virtual nodes and combine them to make the app.

Rewrite event handlers to only modify virtual DOM.

Think of any suitable state variables that we want to trigger automatic updates. We also have the option (escape hatch) of being able to simply call the `update` method on the app.

Make sure that updates are called whenever necessary.

### Extra

- FIX/IMPROVE
  - There's often a jump where the character profile picture changes when the eyelids are still open.
  - Sometimes there is a pause on initiating movement or changing direction before it takes effect. Lag due to waiting for signal from socket. Could try a rollback technique: show player's own sprite moving immediately and correct when signal comes from server if need be, e.g. if another player or a bomb blocked their way (if they don't have the bomb-pass powerup).
  - Possibly already fixed now that disconnections during countdown are handled better. I haven't managed to recreate it, but I'll leave the details here just in case. Server crashed once when a player in Safari pressed CTR+SHIFT+R to view simplified page, without styles, during countdown. Apparently this led to them being undefined even though the normal disconnection logic had not gone ahead. I've tried a few times and haven't managed to replicate it. It triggered the classic lightning-conductor-of-errors, `isDead(player)`: `return grid[player?.position?.y][player?.position?.x].type === "fire";` (accusing arrow points to 2nd instance of player in the line), "TypeError: Cannot read properties of undefined (reading 'undefined')". Since then I've added some protections and logging in case of future issues.
  - If you're fast enough, you can plant a bomb after being killed and before you're transported back to your corner. It could be a good exercise to think how it might be fixed. `keydown` event listener is removed on receiving the signal to kill your own character, but you've still had a chance to plant a bomb after the one that killed you exploded. A small delay could be added before allowing you to plant a new bomb, or `X` could be disabled till after the explosion logic is all dealt with. Not a priority, though. I quite like it as a quirk.
  - You can sometimes run through the fire. It still kills you, so it doens't affect the outcome, and I actually quite like the effect, so I'd be inclined not to fix this one.
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
  - Host, maybe on Glitch, which I gather has a limited free option to host a Node server, or on Google App Engine, which, I gather, can be made private, and accessible by signing in to Google. The latter would need an authentication page before the game starts.
