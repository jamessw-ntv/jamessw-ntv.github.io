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

## Headless check (run after engine/bot changes)
```
node -e "const sim=require('./neptunes-sandbox/sim.js');for(let seed=1;seed<=20;seed++){const S=sim.newGame({seed});while(!S.winner)sim.nextTurn(S);console.log(seed,S.winner.how,S.winner.turn,S.alliances.length)}"
```
