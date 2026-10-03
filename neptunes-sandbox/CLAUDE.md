# Neptune's Pride Bot Sandbox — project rules

A copy of **Neptune's Pride II: Triton** where bots play each other, stepped turn
by turn, with an admin dashboard (force/lock/break alliances) and alliance
analysis. Plain static page; no server.

## Files
- `rules.js` — every rule number, each flagged `confirmed` (checked against the
  Triton Codex / wiki) or placeholder. **Filling a rule gap = edit this file only.**
- `sim.js` — engine + bots. Pure logic, no DOM; runs under Node for testing.
- `index.html` — the viewer / dashboard. Turn playback (`playTurn`, `animateTick`,
  `fleetList`) and fog of war (`visionSet`, `seesStar`) live here; the engine side is
  `beginTurn` / `tick` / `endTurn` and `scanSources` / `inScan` in `sim.js`.
  Playback and view prefs (`PB`) are per-browser, never game state.
  Layout: the map is the whole page (`.panel[data-tab=galaxy]`, always on) under a 48px top bar
  (`.ctrl`, with the ☰ `#navmenu`). Everything else is a screen (`.scr`) that slides over the map from
  the left, like the real client's 480px npui.Screen: `tab` names the open one ("galaxy" = none),
  the selection's screen is `[data-scr=inspect]` (a bottom sheet on phones), `syncScreens()` shows
  and hides them, `showSel()` brings the selection forward.
  A person can play one seat (`players[i].human`; bots skip it). Their orders go through
  `sim.act` (buy, buyBulk, research, send, propose/accept/decline, war); bot alliance offers to
  them wait in `S.offers`. In the viewer, `humanId()` / `playerView()` gate what Player view
  hides; `PB.view` ("player" | "admin") is a per-browser pref.
  The ⚙ Game menu (`renderMenu`, key G) is the in-game admin panel; restart reads `S.setup`
  (seed, lineup, stars per player, galaxy, human seat), recorded by `newGame`.
  Carrier waypoint orders: engine side is `c.route` / `c.loop` / `c.wait`, `arrive`,
  `transferFor`, `checkRoute`, `botSupply` and `admin.setRoute` in `sim.js` (semantics copied
  from NPA's timetravel.ts); the editor is `routeEditor` / `pickStop` / `drawRoutes` in index.html.
  Warp gates: `star.gate`, `speedBetween` / `ticksBetween` (speed fixed at departure in `c.speed`).
  Battle forecasts: `forecast` in index.html runs `sim.tick` on a JSON copy of the state.
  Trading: `shareTech` / `sendCash` / `botTrade` in sim.js (`act.shareTech`, `act.sendCash`); UI is `tradeHtml`.
  Talking with the bots (Inbox, key I): `botTalk` / `ask` / `answer` / `pactView` in sim.js (`act.ask`, `act.answer`),
  phrasebook `TALK` per persona; state is `S.chat`, `S.pacts`, `S.talk`, `S.chatRead`. Only runs with a human seat, so
  bot-only games (balance.js) are unchanged. UI is `renderInbox` / `composer` / `bubble` in index.html.
  Turn history: `replay` / `openReplay` / `replayGo` / `branchHere` in index.html swap S for a `history[]` snapshot;
  `snap()` and `save()` are guarded so a look-back never overwrites the live game.
  Logistics view (key O, `PB.logi`): `logistics()` / `drawLogiLanes` / `drawLogiMarks` / `renderLogiBox` in index.html;
  scope is `logiScope()` (Player view = your own routes only).
  Techs in play: `techsOn(S)` (Terraforming and separate Scanning are off by default).

## Intent routing
1. **"The real rule for X is Y"** → update the value in `rules.js`, set
   `confirmed:true`, add a short `note` with the source. Don't guess.
2. **Bot behaviour** ("warlords betray too much") → tune `PERSONAS` or the
   `bot*` functions in `sim.js`, then run the headless check below.
3. **Dashboard / view change** → `index.html`.
4. **Question** → answer, don't commit.

## Golden rules
1. Rules come from the real game. A number is only `confirmed:true` if it was
   checked against Iron Helmet's Codex (np.ironhelmet.com/help; the page text is
   served from /html/help/<page>.html) or real game data.
2. Keep the whole game state plain JSON (rewind, save and export depend on it).
   Randomness only through `rand(S)` so a seed replays exactly.
3. Sandbox-only rules (locked alliances, coalition wins, betrayal slider) live in
   `S.settings`, never in `rules.js`.
4. Hub design system applies: `../assets/hub.css` tokens, relative links.

## Balance check (after persona or galaxy changes)
`node neptunes-sandbox/tools/balance.js` (~4 min, all cores): win share by seat, persona, empire
count and galaxy. `--mirror standard` tests seat fairness alone; `--tweak '{"turtle":{"keep":0.4}}'`
tries a persona change without editing sim.js. Aim for every row within about ×0.85–1.15.
Personalities off = every seat `standard` (`sim.lineupFrom(n, [])`); the allowed pool is `PB.pool`.

## Headless check (run after engine/bot changes)
```
node -e "const sim=require('./neptunes-sandbox/sim.js');for(let seed=1;seed<=20;seed++){const S=sim.newGame({seed});while(!S.winner)sim.nextTurn(S);console.log(seed,S.winner.how,S.winner.turn,S.alliances.length)}"
```
