# Factorio — Endgame Planner — project rules

Tile-exact endgame base layouts for Factorio (base game, Nauvis), sized from a
science-per-minute target: **Your world** (drag resource patches; blocks are placed
around them, with a research stepper that lights new blocks green), a **main bus**
and a **city-block train grid**. Renders at
<https://jamessw-ntv.github.io/factorio/>.

## Layout

- `engine.js` — data + solver + layout engine. Runs in the browser and in node
  (`module.exports`), so it can be tested with `node -e "require('./engine.js')"`.
  - `MACHINES`, `BEACON`, `R` (recipes), `OIL` are **datamined** from
    `wube/factorio-data` base mod 2.1.21 (`base/prototypes/recipe.lua`, `item.lua`,
    `entity/entities.lua`). Don't change them from memory; re-check the source.
  - `BLOCKS` decides what is built where (`makes` = shipped outputs, `local` = sub-parts
    made inside). It is listed **consumer-first**: a block's demand must be final before
    its suppliers are sized, so a new block goes above everything that feeds it.
  - `RESEARCH` (from `technology.lua`) is an ordered tech list with the recipes each
    unlocks; `blockStep` says when a block opens.
  - `solve(opt)` → machine counts per block; `layoutWorld` / `layoutBus` / `layoutCity` → positions;
    `packBlock` turns machine counts into rectangles using the line patterns in
    `linePattern` (the same patterns drawn in the Templates tab).
- `index.html` — the UI (tabs: Build Map, Build Order, Blocks, Ratios, Templates, Guide).
  Links `../assets/hub.css` and follows the hub design system.
  `?layout=world|bus|city&tab=map|order|blocks|ratios|templates|guide` deep-links.

## House rules

- Base game only. A Space Age plan (50-part rockets, space platforms, other planets)
  would be a separate model, not a toggle.
- Keep it dependency-free and relative-linked. Commit to `main`, push.
