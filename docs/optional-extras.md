# Optional Extras

## Priority

- CHAIN EXPLOSIONS
  - Move timeout from "plant normal bomb" on client to server `plantNormalBomb` so that it has access to the timeout id. Store this id in an object in the grid: `grid[y][x].plantedBomb = { player, fireRange: player.fireRange, full, timeoutId };`. When calculating explosions, the server can then cancel timeouts and trigger explosions as needed. Consider serverside functions: `planNormalBomb`, `plantRemoteControlBomb`, `detonate`, and `addFire`; and clientside handlers for "plant normal bomb", "plant remote control bomb" (plus fuse sound-effect array for the remote control bombs), and "keydown" handler. Think especially carefully about remote control bombs and be sure to replenish the correct players' stock of bombs.
- MULTI-POWERS
  - Allow multiple powerups to be held at once: logic, UI (e.g. put info in a margin, move grid to one side, list powerups by their symbol, distinguish between scalar--lives, bombs, fire--and boolean powers, highlight boolean powerups in your possession).

## Other

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
  - Customize sprites or design own sprites from scratch.
  - See if we can get scrollbar "thumb" to appear on hover over the roles menu in all browsers, not just Firefox. At the moment, it appears briefly when the menu first appears in Chrome, for example. I think this is preferable to how it was before, though, when all sorts of scrollbars appeared all the time.
  - Make scrollbar "thumb" partially transparent or not overlapping the right edge of the text if possible.
  - Beyond a certain width, chat pane overhangs left edge of input box.
  - Make intro layout more responsive to handle smaller window size, especially the ready button that currently overlaps the title when the screen gets too narrow.
  - Fix scale in CSS to rely only on units relative to screen size and make sure it works on various screen sizes.
  - Test scrollbars etc. in Edge too. Improve current hacky solution. Understand better.
  - Find a font with more punctiation. None that I've tried looked good enough to sacrifice Wolves and Ravens.
- ROLES
  - Add randomizer to allow alternative profile pictures for roles: name consistently and put each selection in its own folder so we can programmatically pic one from the folder.
  - Get gray's pitchfork in shot.
  - Write backstory or character sketch for each role and think how and where to display them: maybe in windows superimposed partly over the roles with a little box-shadow, and make them visible on hovering over the character image.
- KEYS
  - Let different keys be used for different players, at least for testing, so that two can play on one keyboard.
- STRUCTURE
  - I originally wrote: "Bring client structure more into line with how things are done on the server: player objects rather than those position and direction arrays (which are a leftover from my initial tinkering with the single-player client-only game to make it multi-player, before I moved the logic to the server)." But before doing that, consider whether it would actually be detrimental to performance.
  - Investigate whether it would be worth implementing the "state pattern" for powerups, especially the movement logic.
- HOSTING
  - Privately.
    - To allow friends to play remotely, as an exercise to learn about hosting, and as an experiment to see how well the networking works. Research how to host on Google App Engine and make accessible by signing in to Google. The latter would need an authentication page before the game starts.
  - Publicly.
    - Adapt to allow multiple game instances at once. `socket.IO` has a "rooms" feature that would let us group players together into separate games and broadcast specifically to one room. Investigate memory and performance implications of worker threads versus single-thread.
    - Glitch has a limited free option to host a Node server. Their free option is public only, though.
