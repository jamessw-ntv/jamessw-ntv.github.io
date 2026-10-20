# Factorio — Endgame Planner — project rules

Tile-exact endgame base layouts for Factorio (base game, Nauvis), sized from a
science-per-minute target, delivered as a one-step-at-a-time **build guide**: tick a step
done and the next appears. Three layouts: **Your world** (resource patches from your save or
dragged by hand; blocks placed around them), a **main bus** and a **city-block train grid**.
A console command syncs patches, buildings and research from a save. Renders at
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
  - `guideSteps(sol)` turns the plan into one linear checklist (research, build, extend) with
    stable ids (`r:<tech>`, `b:<block>`, `e:<block>:<tech>`, `g:<block>:<step>`) so ticks survive re-plans.
    Builds are staged: each build/extend step carries `now` (machines to have, sized for the
    science packs the next pack research opens, in the machines and modules researched by then,
    via `rateAt`), and `grow` steps raise earlier blocks when each new pack opens. Blocks nothing
    needs yet wait until something does. The footprint stays the endgame size.
  - `SCAN_COMMAND` is the one-line `/c` Lua the player runs in game; it writes
    `script-output/factorio-planner.json` (resources, machines + recipes, research, map tags,
    enemy bases). `parseScan` reads it; `checkBase` matches machines to block footprints.
    If you change one side, change the other.
- `index.html` — the UI. Tabs: ✅ Next step (the guide, default), Map (with a step slider that
  replays the plan, landmarks and biter nests), Progress, Blocks, Ratios, Templates, Help.
  Links `../assets/hub.css` and follows the hub design system.
  `?layout=world|bus|city&tab=next|map|progress|blocks|ratios|templates|help` deep-links.
  State is in localStorage (`factorio.state`, `factorio.scan`); the connected script-output
  folder handle (Chrome/Edge File System Access) is in IndexedDB `factorio-planner`.

## House rules

- Base game only. A Space Age plan (50-part rockets, space platforms, other planets)
  would be a separate model, not a toggle.
- Keep it dependency-free and relative-linked. Commit to `main`, push.
- Test changes with headless Chromium (Playwright) walking the guide, a sync upload and
  the Map tab at phone width; there is no build step.
