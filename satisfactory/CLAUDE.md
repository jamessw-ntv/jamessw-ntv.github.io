# Satisfactory 1.0 — Build Planner — project rules

A self-contained, build-once plan to take one Satisfactory 1.0 save from the HUB
to a finished Project Assembly (Space Elevator Phase 5). Renders at
<https://jamessw-ntv.github.io/satisfactory/>.

## Layout

- `factory-network.html` — **the app** (the whole thing: pure SVG/DOM, no
  libraries, works offline). This is where all the logic and data live.
- `index.html` — a tiny redirect to `factory-network.html`.
- `README.md` — read this first; the overview and master timeline.
- `architecture.md`, `templates.md`, `train-network.md`, `power.md`,
  `VERIFICATION.md`, `inventory.csv` — companion docs. (The old `build-guide.md`
  was folded into `architecture.md` + the app's ✅ Do Next tab.)

## Intent routing

1. **Change the app** (tweak a recipe, module, blueprint, copy): edit
   `factory-network.html`. The data lives in the `T` (standard recipes), `ALTS`
   (opt-in alternates), `DISTRICTS`, `FINAL_RATES`, `DELIVERIES` and `INVENTORY`
   consts in its `<script>`; presentation is the surrounding HTML/CSS.
   - `FINAL_RATES` is the single knob that sizes the whole build: every bank is
     demand-solved back from those 12 numbers. They are tuned so each phase's parts
     finish together (see the comment above them) — change one and re-check the
     per-phase runtimes, machine count and raw totals, not just the one part.
   - A **port-count invariant** (`PORTS` + `auditT()`) runs at load and warns in the
     console if any recipe needs more inputs than its building has. Keep it green;
     it is what caught Ballistic Warp Drive being modelled on the wrong machine.
   - The legacy `MODULES` const has been deleted — it was unused and still quoted
     pre-rebalance rates. Don't reintroduce a second source of rates.
2. **Change a doc:** edit the relevant `.md` / `.csv` and keep it in sync with
   the app.
3. **Question:** just answer; don't commit.

## House rules

- This was **ported in from a portable bundle** and is intentionally
  **fully self-contained** — it does *not* link `../assets/hub.css`. The app
  ships its own complete design system, and several of its class names (e.g.
  `.card`) collide with hub.css; linking it bled extra styles in and broke the
  layout. So the app keeps its original CSS verbatim and carries a `.hubbar`
  back-link styled with its *own* tokens instead. Use **relative links only**.
  (If you ever want true hub-skin consistency, that means a real re-skin of the
  whole app — renaming the colliding classes — not just adding the link.)
- **No GitHub Pages workflow.** The original bundle shipped a workflow that
  publishes this folder as the *site root* — that would hijack the hub. The hub
  is served from the repo root already; this project is just a folder under it.
  Do not add that workflow.
- Keep `factory-network.html` valid (open it in a browser to sanity-check the
  tabs render), commit to `main`, push. Don't open a PR unless asked.
