# Optional Extras

- FIX/IMPROVE
  - Possibly fixed now that I dealt with another disconnection-related error, but, just in case, here's a note of what happened: I once saw a bug where server and client logged that one of two players had disconnected, but they hadn't. Both players were still in the chat. Only one had the ready button visible. On pressing it, the countdown was triggered for both. Haven't manage to replicate it.
  - Sometimes there's a pause on initiating movement or changing direction before it takes effect. Lag due to waiting for signal from socket? But test this in case that's not the reason. Could try a rollback technique: show player's own sprite moving immediately and correct when signal comes from server if need be, e.g. if another player or a bomb blocked their way (if they don't have the bomb-pass powerup).
  - A bug I saw once, but haven't managed to replicate after many attempts, possibly already fixed now that disconnections during countdown are handled better. But I'll leave the details here just in case. Server crashed when a player in Safari pressed CTR+SHIFT+R to view simplified page, without styles, during countdown. Apparently this led to them being undefined even though the normal disconnection logic had not gone ahead. It triggered that classic lightning-conductor-of-errors, `isDead(player)`: `return grid[player?.position?.y][player?.position?.x].type === "fire";` (accusing arrow points to 2nd instance of player in the line), "TypeError: Cannot read properties of undefined (reading 'undefined')". Since then I've added some protections and logging in case of future issues.
- SECURITY
  - Implement neater "play again" logic, rather then current, crude solution, which is to force a page reload.
  - Implement some decent reconnection logic (e.g. 3 attempts then consider gone: update player.id to new id using index from client to link them; better yet, use a cookie. Test how well connections last, using a mobile hotspot.)
- COUNTDOWN
  - Move control to server.
  - Throttle ready/pause button.
- REFACTOR
  - For preformance, recycle fixed-size arrays and objects where possible, rather than pushing, popping, and making new ones.
  - Simplify any logic that can be simplified.
  - Consider whether any variable names could be made clearer or standardized.
  - Tidy project structure, maybe split into modules, such as intro and game, and maybe more. Socket handlers for each? But consider that a single file loads faster and might actually be easier to navigate.
  - `socket.IO` was probably overkill on this project, but we might as well leave it for now. Their rooms feature could make it more convenient to implement multiple game instances, especially if we went the single-threaded route, albeit we have implemented our own rooms on other projects. Look at pros and cons before changing.
- BONUS
  - Easy bonus: allow a 5th player to be spawed in the center of the grid. (Make sure they have space and that they don't interfere with the mechanism to always place one each of the three basic powerups.)
  - POWERUPS
    - `bomb-throw` powerup, aka `bomb-push`.
    - Not on the list: `smoke-bomb` that fills nearby tunnels with smoke that disperses more slowly than fire, and can be walked through but not seen through.
    - Not on the list: `soft-block-push`: push a soft block if there's nothing behind it.
  - CO-OP MODES
    - Teams.
    - AI opponent. (If we implement an AI opponent, we can also use it to fill in empty slots in the regular battle royale mode.)
  - SINGLE-PLAYER MODE
    - The enemies from the original single-player game could be re-introduced, along with the door and multiple levels.
  - GHOST
    - Player comes back as a ghost is among the suggested bonus tasks. I think it would dilute the drama though. Gilding the lily.
- DESIGN
  - Fix how the the character profile picture sometimes changes abruptly when the eyelids are still open.
  - Fix how overlapping explosions aren't organized into a big explosion, but are calculated and emitted as independent explosions, which can result in an arm-piece cutting through where a center piece should be. Look at `detonate(y, x, fireRange)` and `function addFire(y, x, style, origin)` in `server.js`.
  - Customize sprites or design own sprites from scratch.
  - See if we can get scrollbar "thumb" to appear on hover over the roles menu in all browsers, not just Firefox. At the moment, it appears briefly when the menu first appears in Chrome, for example. I think this is preferable to how it was before, though, when all sorts of scrollbars appeared all the time.
  - Make scrollbar "thumb" partially transparent or not overlapping the right edge of the text if possible.
  - Beyond a certain width, chat pane overhangs left edge of input box.
  - Make intro layout more responsive to handle smaller window size, especially the ready button that currently overlaps the title when the screen gets too narrow.
  - Fix scale in CSS to rely only on units relative to screen size and make sure it works on various screen sizes.
  - Bring back pixel-by-pixel movement (as opposed to cell-by-cell), perhaps by having the server calculate position on an extremely fine-grained grid, with as much resolution as the most detailed screen it's likely to be played on, and let clients round this each to their own current resolution, updated with corrections from the server each tick.
  - Test scrollbars etc. in Edge too. Improve current hacky solution. Understand better.
  - Find a font with more punctiation. None that I've tried looked good enough to sacrifice Wolves and Ravens.
- ROLES
  - Add randomizer to allow alternative profile pictures for roles: name consistently and put each selection in its own folder so we can programmatically pic one from the folder.
  - Get gray's pitchfork in shot.
  - Write backstory or character sketch for each role and think how and where to display them: maybe in windows superimposed partly over the roles with a little box-shadow, and make them visible on hovering over the character image.
- KEYS
  - Let different keys be used for different players, at least for testing, so that two can play on one keyboard.
- STRUCTURE
  - I originally wrote: "Bring client structure more into line with how things are done on the server: player objects rather than those position and direction arrays (which are a leftover from my initial tinkering with the single-player client-only game to make it multi-player, before I moved the logic to the server)." But before doing that, consider whether it would actually be detrimental to performance. (See Andrew Kelley's talk [Practical Data-Oriented Design](https://www.youtube.com/watch?v=IroPQ150F6c).)
  - Investigate whether it would be worth implementing the "state pattern" for powerups, especially the movement logic.
- HOSTING
  - Privately.
    - To allow friends to play remotely, as an exercise to learn about hosting, and as an experiment to see how well the networking works. Research how to host on Google App Engine and make accessible by signing in to Google. The latter would need an authentication page before the game starts.
  - Publicly.
    - First adapt the server to allow multiple game instances at once. `socket.IO` has a "rooms" feature that would let us group players together into separate games and broadcast specifically to one room. Investigate memory and performance implications of worker threads versus single-thread. Worker threads would simplify the logic. They seem easier to reason about. They don't have access to the network, though, hence no direct web socket access, so the main thread would have to broker messages between game instances and clients. Another alternative would be to have a cluster module, composed of multiple Node processes. There's a `cluster` library that could help. Surely overkill in our case, but just for the sake of curiosity: if the main thread had other computationally intensive tasks, the web socket handling could be offloaded to a reverse proxy, such as Nginx (at the cost of extra network time), or a message broker library, such as Redis or RabbitMQ, that would relay messages to separate threads or processes, even processes on different machines. (Andrei has also mentioned Apache Kafka as a message broker, but Gemini says Redis and RabbitMQ are more lightweight and might be more appropriate to simple use cases.)
    - Glitch has a limited free option to host a Node server. Their free option is public only, though.