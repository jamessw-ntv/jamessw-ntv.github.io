# Plan review — findings & improvement roadmap

A recorded review of the Satisfactory 1.0 Build Planner (`factory-network.html` +
companion docs), against its stated purpose: **"take the thinking away"** — always
know exactly *what* to build next, *how many*, *where*, and *how it connects*,
with no spaghetti and no mid-game re-planning.

Two parts: the **core review** (structural findings), then the
**persona review panel** (six independent perspectives).

---

## Part 1 — Core review

Overall: the district model is well-argued, the demand solver ("sized to total
demand, made once") is the right backbone, and the phase-aware machinery needed
for the fixes below **already exists in the code** (`solveDemandPhase`,
`bankCountAt`, `carrierAtPhase`, `BM_SEQ`). The gaps are altitude and rendering,
not modelling.

### 1.1 The step-by-step is at the wrong altitude for "what's next"

`masterSteps()` flattens ~130 items — phase-0 milestones, *every production bank
of every district*, rail links, expansions, deliverables — into one list. The
"▶ DO THIS NOW" card surfaces the first unticked item, so it usually shows
placement-granularity ("[A] §4 Screw farm — 10× Constructor…") instead of
goal-granularity ("stand up Steelworks", "get coal power online").

**Fix — two-tier spine:**

- **Tier 1 (~25–35 goal steps):** power milestones, "Build district X" as one
  step, "Add station Y to ★", rail links, "Expand for Phase p", deliveries,
  launch. `BM_SEQ` is already this narrative — merge it with the Do Next spine
  so the Build Map slider follows real progress.
- **Tier 2:** the per-bank checklist collapses *inside* its tier-1 goal, with a
  mini progress bar ("4 of 8 banks built"). The orange card shows: the goal, a
  **why** line (which delivery/unlock it feeds — derivable from
  `DELIVERIES`/`FINAL_PHASE`), and "next inside it: §4 Screw farm → 📐".
- Make the `TECH[p]` unlock lines tickable tier-1 steps, not passive hints.
- While restructuring: progress keys are positional (`bp:A:3`); switch to
  template ids (`bp:A:T-SCREW`) with a one-time migration so future edits don't
  scramble saved ticks.

### 1.2 Maps show the finished factory; they should show growth

The Build Map draws the end-state and the phase slider only dims unbuilt
districts; Blueprints always draw final counts. The modelling for a truly
expandable map already exists (`solveDemandPhase(p)` / `bankCountAt(tid,p)` /
`carrierAtPhase`). Rendering changes:

- **Final silhouette as a ghost** — dashed panel outline = the land you reserve;
  makes "leave room to expand" visually concrete.
- **Blocks fill in per phase** — at slider phase *p*, a bank renders solid iff
  `bankCountAt(tid,p) > 0`, labelled with its phase-*p* count; future banks are
  dashed ghosts. Cross-district belts appear only when both ends exist, labelled
  with the belt Mk you'd have at that phase.
- **No per-phase re-layout** — positional stability *is* the build-once message;
  only contents should be phase-aware.
- **Same in Blueprints** — a phase selector so Flow/Grid show "as of Phase 3",
  generalising what `focusBankSvg` already does for one bank.
- **"Expand" ticks change nothing visually** today (`bankNowCount` is fixed at
  build-phase size). Derive an *effective phase* from ticked
  deliveries/expansions so counts, ghosts and belt labels track reality. That
  yields three coherent view modes from one concept:
  **Final plan · Phase p · My progress**.

### 1.3 Other findings

- **Nuclear fuel chain missing (correctness, biggest real gap).** PWR4 says
  "build first Nuclear Power Plant(s)" and power.md prices it at 0.2 Uranium
  Fuel Rod/min per plant — but there are no templates for the Encased Uranium
  Cell → Uranium Fuel Rod chain, uranium never appears in the raw-nodes table,
  and there's no waste-handling bank. Either add the templates (sized from the
  power plan's generator count) or explicitly scope it out in power.md with a
  fixed recipe block.
- **Generator fuel absent from the shopping list.** "Raw nodes to claim" counts
  only production inputs — no coal/water for coal power, no crude for fuel gens.
  Under-claims nodes exactly when node-claiming matters (Phase 2–3).
- **6 vs 7 districts inconsistency.** README and architecture.md both say "6
  production districts" while listing A–G (seven); the app's Districts tab
  correctly says 7.
- **Step numbers are unstable identity** — "Step 47 of 131" shifts when ⚡ MAX /
  ×scale toggles change expansion steps. Never refer to steps by number in
  docs/print; the tier-1 restructure mostly dissolves this.
- **Skip vs done:** the orange card needs a "⏭ already built / not doing this"
  affordance distinct from ✓ Done, for mid-save adopters.

---

## Part 2 — Persona review panel

Six independent reviewers, each reading the full app and docs in persona:

| Persona | Lens |
|---|---|
| 10-year-old new player | comprehension, jargon, overwhelm |
| 800-hour veteran | "is the thinking *fully* taken away?" — decisions, transport, trust |
| Cognitive-load UX designer | hierarchy, resume, choice overload, guided flow |
| Satisfactory 1.0 reality-checker | does the plan survive a real save? nodes, sloops, power math, pacing |
| Returning / mid-save player | reopen after months; adopt with an existing factory; state safety |
| Accessibility + print/mobile | keyboard, screen reader, contrast, touch, paper manual |

### 2.1 The 10-year-old new player

**Verdict: the default plan is impossible for a newcomer, and the app talks to
someone else.**

- **⚡ MAX defaults to ON** (`bpMax=true`), so every count, belt Mk, kit list and
  Do Next step assumes 3 Power Shards + 1 Somersloop *per machine* from Phase 0.
  A new player has zero and doesn't know Somersloops exist — the plan as shipped
  cannot be followed. Wants a first-run "Is this your first factory?" toggle
  that starts at 100% and hides ×scale / alt-recipes / shard budgets.
- **Jargon wall with the glossary in the wrong place.** "manifold down the row",
  "trunk", "RIP", "belt-mark", "demand-solved", "slug lesser nodes", "head-lift",
  "HOR" — the Guide tab *has* a glossary table, seven tabs from where the words
  appear. Wants tappable inline definitions.
- **Copy addresses the original owner:** *"practical for a slug/sloop-rich save
  (you said you'll have enough)"*, *"(you left room)"* — alienating for anyone
  else.
- **Two unrelated "Step" counters** (Do Next "Step N of ~131" vs Build Map
  "Step 0 / 12") read as deleted progress.
- **Touch is broken:** the Build Map has *no* pinch-zoom handler (wheel-only,
  coarse pointers deliberately ignored), and phones hide the Blueprints
  diagrams entirely ("the fun part").
- **Quest framing wishlist:** phases as chapters with title screens ("Chapter 1:
  Wake up the Ironworks — quest 3 of 9"), per-district celebration/badges (the
  "Districts online" row as a trophy shelf), a picture quest-card (big count,
  machine icon, one sentence, one button), per-card time estimates.
- **What already works for a kid:** the auto-advancing orange card, ticks going
  green on the map, the "✅ Done when" lines, and the Templates search box.

### 2.2 The cognitive-load / guided-UX designer

**Verdict: "the planning has gone away, but the *orienting* hasn't."** The data
model is superb; the app runs two disconnected narrations of the same journey
(131-step flat list vs the 13-step `BM_SEQ` story that isn't wired to anything).
Every ingredient of the ideal experience already exists in the file — **this is
a wiring job, not a redesign.**

- **Altitude mixing, quantified:** `masterSteps()` concatenates four altitudes
  (goal / site / bank / meta) into one numbered list; the DO THIS NOW card
  styles them identically, so the user oscillates between "pull a lever"
  (2 min) and "place 11 constructors + manifold" (an evening) with no mode
  signal. No chunking (working memory must reconstruct the chapter from the
  `[C]` prefix), no goal gradient (1/131 ≈ 0.8% per tick), purpose amnesia
  (the *why* sits unused in `BM_SEQ[..].d`).
- **Proposed hierarchy** (all derivable from existing data):
  *Phase 2 · Construction Dock → Chapter 5/13: ② Build the STEELWORKS district
  → Task 3/8: §3 Steel Pipe — 4× Constructor.*
- **Progress-model audit:** 5 tick surfaces + 7 progress representations.
  Conflicts: the map slider is fake progress (not persisted, resets to 0 — a
  60%-done user opens the map and sees their base dimmed to 11% as "nothing
  built", while the blocks *inside* panels truthfully reflect ticks — two
  contradictory dimming semantics on one canvas); `gotoMapStep()` silently
  mutates the slider; denominators disagree (Blueprints counts pad+banks but
  renders tickable `rail`/`util` rows excluded from its own bar; `bp:D:util`
  is in no total anywhere; `exp:` steps exist only in Do Next); `tickKey()`
  still rolls up into dead legacy `MODULES` ids.
- **Resume after 2 weeks:** ~3–5 min of cross-referencing with residual doubt;
  target <30 s. State stores bare `true` — no timestamps, so "last ticked" is
  unrecoverable *in principle*. Fix: store tick time; add a resume strip
  ("Welcome back · last tick 14 days ago: [C] §2 Steel Beam · before building,
  check: §2 steadily outputs ~15/min" — that check line is `bankStepHTML`'s
  existing "Done when" text, repurposed).
- **Choice overload:** ⚡ MAX and ×scale are *plan-time* decisions masquerading
  as build-time controls (flipping MAX retroactively rewrites the meaning of
  ticked history) → move behind "⚙ Plan settings" with a warning. 🏭 Districts
  tab is ~100% redundant with Map+Blueprints. Toolbar (Print/CSV/Save/Load/
  Reset) → "⋯" menu; Reset all shouldn't sit one mis-tap from the daily button.
  7 tabs → 3 "doing" + 1 reference cluster. Hide ▶ Play; Grid becomes a step
  inside the bank drill-down rather than a sibling of Flow.
- **GPS-style feedback:** replace the 131-step overall % with distance-to-next-
  turn — "▲ Next unlock: Coal Power — 6 steps, then ~50 min runtime" (computable
  from `masterSteps` + `phaseDeliverMin`). Add arrival moments (district-online
  celebration card) and a persistent 8-slot A–G/★ "you are here" strip with
  partial fills (the current "Districts online" is all-or-nothing and silent
  for the many hours between completions).

### 2.3 The returning player / mid-save adopter

**Verdict: the cold-open (orange card + districts-online + MW) is genuinely
strong — but the app can't answer "when was I here, what was I mid-way through,
and does my save still match?", and its state is one mis-click from gone.**

**Returning after 3 months:**
- `state[key]=true` stores **no timestamps** — "last ticked" is unrecoverable in
  principle. Fix is one line (`state[key]=Date.now()` stays truthy for every
  existing check) and unlocks a welcome-back banner: *"last tick 14 Apr: Step 33
  [C] §4 · Phase 3 (Steelworks 4/6) · verify last 3 ticks first"*.
- The Build Map opens at slider Step 0: three months of progress renders as
  "you haven't started" (everything at opacity 0.11). On load the slider should
  derive from ticks (`BM_SEQI` + `state['bp:X:pad']` already suffice).
- The checkbox is binary — no "in progress", no notes, so a half-placed bank
  quits to nothing.
- **Drift** (built-without-ticking, or ticked-optimistically) mis-aims the DO
  THIS NOW card in both directions, and nothing frames the existing per-bank
  "✅ Done when" tests as the audit script they already are. Wants a
  "🔁 Audit vs my save" mode: walk bank steps, show the Done-when test,
  Built ✓ / Not built ✗ / Equivalent ≈ per item.
- Visual contradiction: copy says ticked things "colour green" on the map, but
  built map blocks *fade* (opacity .5) — reads as disabled, the opposite.

**Adopting with a 120-hour spaghetti save:**
- Phase 0–2 milestones tick cleanly, but per-bank steps assert demand-solved
  banks that don't exist in a spaghetti save. The state vocabulary (`true` /
  absent) has no **mark-as-equivalent** (amber, counts as done, flags
  downstream feeds "verify rate"), no **skip-with-note**, no **relocate
  district** (location text and belt-vs-train classification are hardcoded via
  `d.near`). No migration concept for "keep spaghetti oil for power, build D
  fresh, decommission later".
- **MAX/scale adapt fully but invisibly:** `bpMax`/`bpScale` propagate through
  every count, kit, power and step string — but the toggle lives only in
  Blueprints, defaults ON, and **isn't persisted** — a plain `let`. A no-sloop
  player following DO THIS NOW verbatim builds ~⅕ the machines needed, and must
  re-toggle every session. Persist both in the save state; surface a pill on
  the Do Next toolbar; ask once on first run.

**State fragility:** Reset all = one native confirm, no backup/undo (and doesn't
re-render Blueprints/Map); Load code silently replaces newer progress with no
preview or backup; localStorage is per-browser and evictable with no export
nudge; positional keys (`bp:C:4`) mean a future reorder silently re-points
months of ticks. Wants: a 5-slot timestamped backup ring on every save, backup
+ undo on Reset/Load, an export reminder, template-id keys, a versioned
save-code envelope.

**Bugs found:** dead `MODULES` auto-complete branch in `tickKey` (district keys
can never match `M1…`); `exportall` checks `s.works` which no step has;
`bp:X:util` is tickable in Blueprints but absent from `masterSteps`, so utility
work never appears in DO THIS NOW or any total.

### 2.4 The 800-hour veteran

**Verdict: it takes away the *arithmetic*, not yet the *thinking*. Phases 1–3
deliver the dream ("I would genuinely just place buildings"); Phases 4–5 —
where the tool is most needed — is where the approx flags cluster, the sloop
math breaks, nuclear goes blank, and the map goes vague.**

**Decisions the app still forces (16 catalogued; the big ones):**
- **Which real nodes to claim** — "~3 pure / 5 normal" is arithmetic, not an
  assignment. Wants: node → purity → coordinates → district §bank table with
  interactive-map deep links. Nobody has checked the plateau's nodes can supply
  the solved raw totals — and district D is `near:'crude oil'` when there's
  likely no crude *on* the plateau, so the most-connected core district gets
  sited by vibes mid-game: the exact re-planning failure the tool exists to
  prevent.
- **The overclock ramp contradiction** — every count assumes MAX from Phase 1,
  but the power plan itself says "run near 100% early, crank at P3–4". Build
  MAX counts and run at 100% → ⅕ the design rate, every ETA 5× wrong. Wants a
  per-bank clock schedule ("3× now @100% → shard at P3 → sloop at P4" with
  corrected rates/ETAs) — machinery already exists.
- **Power logistics is checkboxes hiding unplanned districts** — coal belts /
  water extractors uncounted; the fuel-gen refinery line is in no district; the
  **entire nuclear rod chain is absent from `T`** (uranium never even appears
  in the raw table because it's derived from bank inputs).
- **Import-side trains uncomputed** — the rail step sizes stations from
  *exports* only; the copper firehose into F (~1,200 ingot/min) and coal into
  E/F, the heaviest rail jobs in the plan, are uncounted. Flows already exist
  in `bk.inputs`.
- Also: buffer sizing ("1–2 containers" regardless of the 1,100-pasta bank),
  per-item drone-vs-train adjudication, nitrogen strategy fork left open,
  drone batteries unplanned, MAM/hard-drive research order, Blueprint-Designer
  stamp sizing, water head-lift arithmetic, per-phase raw demand (table is
  whole-build only despite `solveDemandPhase` existing).

**Trust breakers (would alt-tab to a calculator):**
- **Somersloop budget is impossible.** The budget fills every slot in every
  machine — there are **106 Somersloops in the entire 1.0 world**. The moment
  the printed budget exceeds 106, MAX mode's ⅕-machine premise, footprints and
  power plan are built on a false premise. Wants a sloop/shard *allocator*:
  input what you own, assign by leverage (Particle Accelerators first).
- **MAX power undercounted ~2×.** `machinePower` uses ×2 for the Somersloop;
  slooped power scales with the **square** of the output multiplier (2× output
  = 4× power) — on the exact tab whose job is preventing grid trips.
- **Aluminium chain flagged approx five times** and its water/silica
  byproducts (per VERIFICATION.md's own table) are dropped from `T`, so the
  classic aluminium water-loop headache is invisible and raw Water is
  overstated.
- **Two unreconciled rate systems**: legacy `MODULES` hand-tuned clocks drive
  delivery ETAs (`worksOutputRate` ignores `bpMax`/`bpScale`) alongside the
  solver. The app also *tells* you to go recompute in the planner in five
  module notes.
- `T-EPM`/Quantum Encoder times never source-verified (admitted in
  VERIFICATION.md) yet feed every Phase-5 final; `FINAL_RATES` are unexplained
  design constants nothing checks against node supply.
- Guide prose says Belt Mk.6 at "Tier 8"; code and VERIFICATION.md say Tier 9
  — the code is right, the prose contradicts it.
- **What earns blind trust:** VERIFICATION.md's corrections log — "Phases 1–3
  I'd follow blind."

**Veteran's top asks, by thinking-removed-per-effort:** (1) sloop/shard
allocator capped at reality, (2) per-phase clock schedule + fix the ×2→×4
sloop-power bug, (3) node assignments + phase-aware raw table, (4) nuclear
fuel chain + power districts as first-class solved banks, (5) import-side
train computation, (6) buffer/banking calculator with "start banking pasta at
step N", (7) Blueprint-Designer stamps, (8) alt recipes wired into the solver.

### 2.5 The accessibility + print/mobile reviewer

**Verdict: the intended core loop (read card → tick → read next) is the single
worst keyboard experience in the app, the printed manual half-works, and the
phone Build Map is effectively broken — while several claimed a11y features
(labels, reduced motion, contrast tokens) audit better than expected.**

- **Focus is destroyed on every tick.** `renderInventory()` rebuilds the whole
  list on each interaction; focus drops to `<body>`, so a keyboard user
  re-Tabs ~15 stops per tick, ~130 times per playthrough. One-line fix per
  rebuild: refocus `#doNext` / the same `data-key` row. (Also stops visible
  scroll-jumps.)
- **Anonymous checkboxes:** all ~130 progress checkboxes have no accessible
  name — "checkbox, not checked" ×130. Wrap in `<label>` or set
  `aria-label = "Step N — label"` (also enlarges tap targets).
- **Wrong SR labels from first-`<title>` heuristic:** district panels announce
  as "Build in Phase 1" (the chip's title), floor-plan rows as their first
  input feed. Buttons nested inside buttons (`.bpsect` inside `.bmmod`) are
  invalid ARIA. No `aria-live` anywhere (captions, DO THIS NOW, warnbar); no
  `aria-selected` on tabs (active tab is colour-only, labels lead with emoji).
- **Two keyboard dead ends:** Districts-tab card headers and Blueprints
  step-row highlighting are mouse-only (not covered by `_a11yMark`).
- **Map input handling:** plain wheel over the map scroll-jacks the page on
  desktop (Ctrl+wheel should be required); no `touch-action` CSS so touch pan
  fires `pointercancel`; **no pinch handler despite the hint promising one**;
  the +/− buttons zoom toward a hardcoded (600,380) instead of the viewBox
  centre (1220,780) — a desktop bug too.
- **Contrast (measured):** `--muted #9aa7b4` is *fine* (7.7:1). The failures
  are `#6b7785` (3.8–4.3:1) on 9.5px SVG hints, `#5b6b78` at 8px, `#46525f`
  compass letters (2.4:1). Build Map text renders ~0.49× viewBox units —
  block labels are ~5px until zoomed. Teal-belt vs purple-output is the one
  colour-only encoding pair.
- **Phone:** `.pbtn`/`#doNext` ≈27px tall, checkboxes 23px (below WCAG 2.2's
  24px); the Blueprints fallback pattern doesn't cover the "▦ All districts"
  appendix (full-width SVGs leak to phones) nor the Build Map, which renders
  at ×0.15 with no working zoom. The Do Next tab itself is a good couch
  experience. Save-code copy uses deprecated `execCommand('copy')` (flaky on
  iOS).
- **Print:** the ~10–14 page tickable Do Next manual genuinely works, but
  `.tag`/`.chip` print as empty pills (backgrounds stripped, pale text on
  white), `.tlink` isn't in the print colour overrides, `break-inside:avoid`
  on multi-page phases forces awkward blanks, and any diagram tab prints
  light-on-white garbage at current pan/zoom. Wants: dark-ink tag/chip
  overrides, page-break per phase, hide diagrams in print, per-district KIT +
  "done when" text included.
- **Reduced motion:** the CSS `!important` rule correctly kills even inline
  transitions; the gap is JS `scrollIntoView({behavior:'smooth'})` which
  ignores it. ▶ Play's 1700ms cadence is too fast for its captions and
  invisible to SR.
- **Explicitly not worth chasing** for a personal tool: full tablist
  semantics, roving tabindex in the map SVG, per-machine narration — mark
  decorative SVG text `aria-hidden` and lean on the existing text build-steps
  as the SR surface.

### 2.6 The Satisfactory 1.0 reality-checker

**Verdict: the recipe data and district/phase skeleton are unusually good, and
pacing at the stated rates is sane (~11 h of runtime) — but MAX-everything,
the power model, the missing nuclear/sulfur chain, and the Dune Desert
resource claims do not survive contact with a real save.** (This reviewer ran
the app's own solver headless: at MAX it plans 600 machines / 2,855 at 100%,
1,800 Power Shards, 853 Somersloops, and raw draws of 12,416 iron / 10,006
copper / 7,412 coal / 5,546 crude / 1,223 SAM per minute.)

- **CRITICAL — MAX is mathematically impossible.** 853 sloops needed vs ~106
  in the entire world (sloops also compete with MAM Alien Tech research —
  which needs SAM ore the plan defers to Phase 5, so MAX doesn't even unlock
  early — and Alien Power Augmenters at 10 sloops each). Shards: 1,800 needed
  vs ~730 wild; Synthetic Power Shards are Tier 9, so MAX is at best a
  *Phase-5 end state*, not the build-as-you-go default. Correct sloop play:
  amplify **terminal machines only** — the 2 Nuclear Pasta accelerators first
  (halves the ~3,900 copper-ingot/min powder chain, best ROI in the game),
  then Quantum Encoders, DMC accelerator, Converters, Sculptor Blenders,
  ADS/MFG assemblers — ~50–70 sloops captures most of the benefit.
- **CRITICAL — power model understates MAX ~2× and the totals are fantasy.**
  Somersloop power is ×(multiplier²) = **×4**, not the app's ×2 → real MAX
  ≈ ×13.43/machine. Corrected cumulative: P3 ≈ 72.9 GW, P5 ≈ **175 GW** (≈99
  nuclear plants with headroom) — more than the map can generate; this also
  kills "ramp to MAX later without re-planning". Particle Accelerator power
  is per-recipe and *fluctuates* (pasta/DMC avg ~1,000, peak 1,500 MW —
  ~20 GW peak for one fully-MAX pasta PA), Converter fluctuates 100–400;
  miners/extractors/pumps/stations are absent from the power plan entirely.
  Power Storage needs to be a sized, mandatory bank per accelerator hall.
- **CRITICAL — nuclear chain confirmed absent, and it drags sulfur with it.**
  Sized for a sane 6-plant / 15 GW backbone: 3 Manufacturers of Uranium Fuel
  Rods, ~2.5 Blenders of Encased Cells, ~2 Refineries of Sulfuric Acid
  (**~100 sulfur/min — sulfur appears in no document**), ~120 uranium ore/min,
  and a waste plan (waste can't be sunk: plutonium chain — which needs the
  also-absent Nitric Acid — or 1.0 Ficsonium). All generator fuel (coal,
  crude-for-fuel-gens, water, uranium) is missing from "Raw nodes to claim".
- **HIGH — Dune Desert hand-waves oil, coal, water, and copper scale.** No
  crude exists in the desert; the solver demands ~5,546 crude/min ≈ half the
  map's total oil capacity — district D "a short belt-run away" is fiction
  (Gold Coast rail/pipe in reality). Desert is nearly coal-less (plan needs
  7,412/min + coal power); water is the desert's famous weakness (coal power
  "next to a lake" has no lake); 10k copper/12.4k iron per min exceed the
  basin (~3,900 copper ingot/min is just the pasta powder). Several desert
  quartz nodes are in **caves** (fly mod doesn't help). Bauxite/SAM/nitrogen
  via rail are fine as planned.
- **MEDIUM — FINAL_RATES are 2–6× overbuilt** (ADS 5/min needs 9
  Supercomputers/min; Sculptor 8/min is luxury). Halving most of them halves
  the 600-machine / 175-GW problem and pulls raw demand back inside the
  region — the single knob that makes the plan buildable. Wait times at the
  stated rates are otherwise sane (P5 gated by pasta, ~6.7 h). Two ETA systems
  disagree (`delivInfo` via MODULES vs `phaseDeliverMin` via FINAL_RATES).
- **MEDIUM — tier-label errors:** Belt Mk.6 is Tier 9 (Guide says Tier 8; the
  app contradicts itself), Pipelines Mk.1 is Tier 3 not Tier 5 (coal gens need
  water), Miner Mk.2 is Tier 4 (listed as pre-Phase-1 prep), drones likely
  Tier 8 not 7 (verify). Core phase→tier mapping and `beltCapAtPhase` are
  functionally correct.
- **MEDIUM — recipe spot-checks (~30 entries): mostly excellent** — including
  the approx-flagged aluminium ratios and EPM 200/min, which are *right*.
  Suspects to verify: **MFG 2.5/min should be ~1/min** (bank undersized),
  Ficsite Trigon 90 vs 30/min, Dark Matter Residue 1:10 vs 1:2. **Real trap:
  Aluminum Scrap's 120 m³/min water byproduct is unmodeled** (no `by:` field)
  — unrecycled scrap-water deadlocks the alumina loop, the most common
  late-game stall in real saves, and the ⚠ utilities generator will never
  warn about it. Alumina's silica byproduct also dropped (+50/min, not the
  "+5" in VERIFICATION — a per-craft/per-min slip).
- **LOW — practical friction:** Blueprint Designer Mk.1 is 4×4 foundations —
  the drawn 20–60-machine manifold rows don't fit; cells should be sliced to
  designer-sized stamps. Dimensional Depot never mentioned (biggest QoL system
  in 1.0 for a 600-machine hand-build). Drone battery line needs the absent
  sulfuric acid (1.0 drones can also burn packaged fuel as a bootstrap).
  Standard-recipes-only is genuinely smart — no hard-drive RNG on the
  critical path.

---

## Part 3 — Synthesis & prioritized roadmap

### What all seven reviews converge on

1. **The engine is trusted; the narration isn't wired to it.** Every reviewer
   independently found that the ideal experience already exists in the file,
   unwired: `BM_SEQ` (the chapter story), `bankStepHTML`'s "✅ Done when" (the
   verification/audit script), `phaseDeliverMin` (the ETA), `solveDemandPhase`
   / `bankCountAt` (the growth model), one shared tick keyspace (the single
   source of truth). **Most of the top fixes are wiring jobs, not redesigns.**
2. **MAX-everything is a false premise, stated three independent ways:** the
   newcomer can't follow it (child), the budget exceeds the world's supply ~8×
   (veteran, reality-checker), and the power model hiding another 2× makes the
   end state physically impossible (reality-checker). The honest model is:
   **100% counts as the baseline, sloops allocated to terminal machines, MAX
   as a late-game ramp** — with the toggle persisted and surfaced.
3. **Phases 4–5 are where trust collapses** — exactly where the tool is most
   needed: nuclear/sulfur absent, approx flags cluster, import trains
   uncomputed, oil/copper/coal geography hand-waved, scrap-water trap
   invisible.
4. **The app is amnesiac.** No timestamps, no welcome-back, unpersisted
   MAX/scale, binary ticks, one-mis-click state destruction, positional keys.
5. **The map is a diagram wearing a map costume.** Fine — but it must (a) grow
   with phases/ticks instead of showing the finished base dimmed, and (b) for
   "exactly where", what's missing is a node-assignment table with real
   coordinates, not a prettier picture.

### Roadmap (waves, in implementation order)

> **Status (2026-07-26): Waves 0–4 implemented, hardened by a second adversarial
> review (Part 4), and most of Wave 5 shipped too.**
>
> Wave 5 **done**: the Somersloop **allocator** (enter what you own → it ranks
> banks by machines-saved-per-sloop, because amplifying a bank halves its whole
> upstream tree; 106 real sloops remove ~1,800 machines), **inbound** train
> sizing (district F's ~3,900 copper ingot/min was never counted), per-phase
> **long-pole** scheduling, **Blueprint-Designer** stamp sizing, and **tri-state
> progress** (built / ≈ already have it / ⏭ skipped) for mid-save adopters.
> A separate deep data pass also corrected Ballistic Warp Drive and the Quantum
> Encoder residue byproducts, and added a port-count invariant (see
> VERIFICATION.md).
>
> Also done: the **per-phase clock schedule**, which resolves the plan's central
> contradiction (every count assumed 250%+Somersloop from Phase 1, while the power
> plan said run near 100% early — build ⅕ the machines and run them at 100% and
> you make ⅕ the design rate). Each bank now states the clock it should *actually*
> run at, resolved against the sloops you own: banks the allocator funds are told
> to amplify; banks it doesn't are told "shards only" with the machine count that
> implies. Each phase also prices its overclock bill in Power Shards and flags
> when it exceeds the ~730 obtainable from wild slugs (Phase 5 wants ~1,758).
>
> **Wave 5 is now complete** (2026-07-27), and the owner settled the one open
> design question. Also shipped since: **alt-recipe toggles** wired into the solver
> (tick one you've unlocked and the whole plan re-solves — Recycled Plastic alone
> cuts crude 45%; they ship off by default and flagged, because their rates are
> author-sourced rather than cross-verified), a **Blueprints phase view**
> (Final plan / any phase / 📍 My progress, which finally makes an "Expand …" tick
> visibly change the counts), **byproducts credited inside the solver** (so machine
> counts and the raw-node claim agree with the recycling advice instead of
> contradicting it), and a **guided "Audit my save"** walkthrough that asks
> built / already-covered / not-built / skipped for all 113 district steps.
>
> **FINAL_RATES rebalance — done, on the owner's instruction to minimise
> bottlenecks without going over the top.** Candidates were measured against the
> solver rather than chosen by feel. Each phase's parts are now rated to finish
> together on that phase's own long pole (P2 ~50 min, P3/P4 ~125 min, P5 ~250 min);
> the old rates left Phase 5 waiting **6.7 h** on Nuclear Pasta while its three
> siblings finished in ~2 h. Pasta is deliberately oversized for Phase 4 so it banks
> toward Phase 5. Net: **~23% fewer machines, ~18% less runtime, and lower raw draw
> on every resource** (iron −26%, coal −30%, crude −28%, SAM −48%). Phase 5 is not
> pushed below ~250 min because that needs more copper than the map can feed — that
> is where "over the top" begins. The legacy `MODULES` const was deleted in the same
> pass: it was unused and still quoted the pre-rebalance rates.
>
> **Still open — one item, and it needs the owner:** the **node-coordinate table**
> (the owner will supply coordinates later). Real map coordinates could not be
> verified from this environment, and inventing them would be worse than leaving
> the gap visible.

**Wave 0 — data honesty & small correctness (low risk, high trust):**
sloop power ×2→×4 + updated prose; sloop/shard reality warning + terminal-
machine priority list in the budget; unify the two ETA systems; model the
scrap-water + silica byproducts; verify & fix MFG / Trigon / DMR rates (log in
VERIFICATION.md); tier-label fixes (Belt Mk.6 → T9, Pipes Mk.1 → T3, Miner
Mk.2); 6-vs-7 district doc sweep; add generator fuel to the raw-nodes table
(or an explicit "+ power" note); document the nuclear+sulfur block in power.md
and the F-district steps; dead code (`tickKey` MODULES branch, `exportall
s.works`), `resetinv` re-render, `bp:util` into `masterSteps`; map zoom-centre
bug (600,380 → viewBox centre).

**Wave 1 — orientation (the "what's next" ask):** chapter spine — `BM_SEQ`
becomes the tier-1 narrative wired to ticks; DO THIS NOW card gains phase ▸
chapter k/13 ▸ task m/n, a *why* line, and a proximity meter ("N steps until
▲ Coal Power"); tickable TECH milestones; one step-language (map slider
relabelled as preview).

**Wave 2 — the living map (the "expandable maps" ask):** derive map build-out
from ticks on load with a "📍 Now" snap-back; built blocks read *built* (green
tick styling, not faded); phase-aware contents — final silhouette as ghost
outline, banks/belts fill in per `bankCountAt(tid, p)` with phase-correct belt
Mk labels; same phase view in Blueprints; "Expand" ticks move the shown
counts (effective-phase concept → Final plan · Phase p · My progress).

**Wave 3 — memory & state safety:** timestamped ticks (`Date.now()`, stays
truthy) + welcome-back strip with last-tick context and "verify these first";
persist `bpMax`/`bpScale` in state + surface a pill on Do Next + first-run
question; migrate keys `bp:A:3` → `bp:A:T-SCREW` (one-time index remap);
backup ring on save + backup/undo on Reset & Load-code + export nudge.

**Wave 4 — ergonomics quick wins:** focus preservation across re-renders;
`aria-label` on all checkboxes; print fixes (tag/chip ink, `.tlink`, page
break per phase, hide diagrams); ≥40px targets on coarse pointers; map input
(Ctrl+wheel on desktop, `touch-action:none`, honest hint text); `aria-live`
on caption/card/warnbar; district-card keyboard access.

**Wave 5 — bigger bets (separate efforts, some owner decisions):**
node-assignment table with real coordinates + interactive-map links (the
"exactly where" promise kept); nuclear + power districts as first-class solved
banks; import-side train computation; sloop *allocator* (input owned count →
per-bank clocks); per-phase clock schedule resolving the build-MAX/run-100%
contradiction; buffer/banking calculator; Blueprint-Designer-sized stamps;
alt-recipe toggles in the solver; audit-vs-save mode; tri-state ticks
(equivalent ≈ / skip); **FINAL_RATES rebalance (~halving) — flagged as an
owner decision since it changes the plan's intent, but it is the single knob
that brings the whole build inside the map's actual resources.**


---

## Part 4 — Adversarial review *of the implementation* (round 2)

Waves 0–4 were then reviewed again, as code rather than as a plan: five
independent dimensions (new logic · persisted state & migration · map/SVG
rendering · game-data accuracy · whether the ergonomics/a11y claims are real),
every reviewer able to drive the app in a real browser, followed by a skeptical
pass that tried to **refute** each finding before it was acted on.

**15 defects found, 7 adversarially verified, 0 refuted.** All 15 are fixed.
The pattern worth remembering: *the features worked; their interactions with
existing state and with each other did not.*

### The three that mattered most

1. **A returning player was thrown back to Phase 1.** Tech-unlock and utility
   steps are new, so any pre-existing save had them unticked; since the guided
   card is "first unticked step", a save that had finished Phase 3 opened on
   *"Unlock: finish HUB Tiers 0–2"* while the panel directly below said four
   districts were online. Now any phase whose deliveries are all ticked
   back-fills its new prerequisite steps.
2. **Old progress codes restored as blank progress.** The key migration ran only
   at boot, but Load-code replaces state wholesale — so a code exported by an
   older build (or an older device) arrived in the old scheme and read as
   "nothing built". Migration now runs on every state replacement.
3. **Chapter numbers ran backwards.** "Expand …" steps have no chapter of their
   own and fell back to their phase's *first* chapter, so the guided card and
   the map pin regressed four times, a fully-built district was redrawn as
   dashed reserved land, and phase sections grew duplicate dividers. Chapters
   are now a running max over the step list — immune to future step kinds.

### Also confirmed and fixed

- **Pinch-zoom silently wrecked the saved map layout**: district panels
  `stopPropagation()` on pointerdown, hiding the second finger, so a pinch
  became a panel drag that persisted. Fingers are now registered in the capture
  phase; a panel yields to a second finger; an aborted drag restores position.
- **Ghost blocks lied twice**: they showed "×0" at the very chapter whose
  checklist says "build 1× now" (two functions disagreed on what "now" means),
  and the "dashed = not built" outline never painted at all (a dash pattern on a
  stroke-less rect draws nothing).
- **Byproducts are advisory only** — the solver still ignores them, so the
  raw-node table and machine counts don't yet credit the recycled water/silica
  the new advice tells you to route. Now stated honestly rather than implied.
- **`SLOOP_SLOTS` gave the Foundry 1 amplification slot; it has 2** — the
  Somersloop budget was under-counting.
- **The coarse-pointer CSS block silently reversed the phone layout** (it sat
  after the phone block at equal specificity), pushing "✓ Done — next" below the
  fold on the exact device the couch workflow targets.
- Three Blueprints checkboxes (pad / rail / utilities) had no accessible name;
  ★ PA's utilities step existed in one tab but not the other.

### Method note

Both review rounds were run as multi-agent workflows with an adversarial verify
stage, and every finding above was reproduced in a headless browser before being
fixed — including two claims that turned out to be *test* artifacts rather than
product defects (a selector that also matched the guided card's own chapter line,
and a hand-seeded "old save" that omitted expansion ticks a real old save would
have). Checking those two saved two unnecessary code changes.


---

## Part 5 — "Can I just follow it?" review (round 3, 2026-09-23)

**Brief from the owner:** review the whole plan for how easy it is to follow
step by step to reach the **minimum completed factory** (Project Assembly
launched).

**Method:** six independent reviewers ran at once, each driving the real app in
headless Chromium:

1. A first-time player on Phases 0–2.
2. The same, on Phases 3–5 through launch.
3. An 800-hour veteran asking "is this the minimum?"
4. A mechanical dependency audit of `masterSteps()`.
5. A technical-writing and second-screen editor.
6. A Satisfactory 1.0 reality-checker.

Findings were cross-checked against each other and against the code before
anything was changed. A seventh reviewer then tried to break the fixes.

### Headline

**The item order is sound. Unlocks, power and "done" were not.** The dependency
audit found **0 forward item dependencies** across 67 bank steps: nothing is
used before the step that makes it. But a player following the list word for
word stalled at four places:

- **Step 34:** Caterium needs MAM research, and no step mentioned the MAM.
- **Step 62:** Quartz needs MAM research, with the same gap.
- **Steps 83 and 93:** nuclear fuel and nitrogen had no steps at all.

Two more things would have misled them the whole way:

- **Power was 15–35× too high.** It charged the final size of every bank to the
  phase it was built in, so Phase 1 asked for ~90 generators to run ~300 MW.
- **"✅ Done when" could never pass.** It quoted the finished rate: "8 smelters →
  steadily outputs 5,695/min".

### Fixed in this round

| # | Finding (who found it) | Fix |
|---|---|---|
| 1 | Power 15–35× high; no generator counts; `GEN[1]` said 75 MW coal in a phase with no coal (1, 2, 4, 6) | `standingCount`/`phaseStandingMW` count what is actually standing per phase. The live readout counts ticked banks plus ticked Expand steps. Every ⚡ step now says "by the end of Phase p you draw ~X MW → have ~N× generators". Phase 1 is Biomass at 30 MW. Phase 5 has its own ⚡ step. |
| 2 | MAM research never mentioned (1, 4, 6) | Tickable unlocks: Caterium (Phase 2), Quartz (Phase 3), Alien Technology / SAM Fluctuators (Phase 5). |
| 3 | Tier 7–8 gates and nitrogen missing (2, 4, 6) | Control System Development and Advanced Aluminum Production unlock lines. A 💨 Nitrogen step with the m³/min to plan for. |
| 4 | Done-when and Collect used the final rate (1, 5, 6) | Both show the rate for the machines you place now, plus "grows to X when all N are built". |
| 5 | Expansions came *after* the new consumers they feed (2, 4) | Per phase the order is now: unlocks → pre-power → **Expand** → new districts → post-power → ★ → deliveries. |
| 6 | Fuel Generators came before the oil district; nuclear came before E's EM Control Rods (2, 4) | PWR3 and PWR4 now come after the phase's districts. |
| 7 | ★ utilities (water, Dark Matter Residue) were a Phase-1 step (1, 4) | Emitted in the first phase a ★ bank needs them (Phase 5). |
| 8 | Steps 1–4 repeated as 8–12; "Unlock: Miner Mk.1s" (1, 4, 5) | Phase-1 duplicates removed. The Somersloop hunt shows only in MAX mode. |
| 9 | First-run "100%" left other tabs showing MAX until a reload; MAX was the default (1, 5) | `setPlanMax` re-renders every tab. New saves default to 100%; old saves with progress keep MAX. |
| 10 | Rail imports labelled "belt"; outputs routed to "§next here" (2) | Rail if either end is a rail district. Destinations list the real consumers, or ▲ Space Elevator for finals. |
| 11 | Delivery notes quoted the deleted M1–M12 modules (1, 2, 5) | "Assembled at ★ — load it into the Space Elevator and press Send". Dead module rows deleted. |
| 12 | Docs described the old plan (5, 6) | `inventory.csv` deleted (⬇️ Steps CSV replaces it). power.md budget table now uses the app's numbers (it was 3–5× low). Drones corrected to Tier 8. M-numbers removed from train-network.md. architecture.md matches the build order. |

**Verified by the seventh reviewer:**
- 0 consumer-before-supplier cases, down from 45 in the old order at 100% and
  39 in MAX.
- Old saves from five points in the game migrate correctly, both at boot and
  through Load code.
- The power table totals match the standing count in every phase.
- 0 JS errors in any tab, in both modes.

It also caught five real bugs in the first pass of these fixes, all fixed
before merge:
- Expand steps parked the chapter card on ★ while you built D–G.
- Reset dropped `_mig`, which flipped a 100% player to MAX on the next reload.
- Finals hid their other consumers (Smart Plating also feeds Modular Engine).
- The Pasta delivery notes said ★, but Pasta is made in F.
- Power steps sized for the whole load while telling you to "stack". They now
  say how many to *add*.

**Save safety:** new steps would have thrown a returning player back into an
old phase, which was the round-2 bug. `migrateState` step 4 (`_mig=2`) runs
once and ticks the new steps in any phase whose deliveries are all done.
`TECH_V1` freezes the old lists so positional-key migration still maps
correctly. Verified with a synthetic save finished through Phase 3: it opens on
the first Phase-4 unlock.

### Open — the "minimum factory" decisions (need the owner) — *all done in Part 6*

These are the biggest wins for *minimum*, but they change what the plan is, so
they are not applied yet. Numbers are from the solver at 100%.

1. **Size banks per phase, not all phases at once.** `solveDemand` keeps every
   earlier final's rate alive (Smart Plating at 10/min all the way to Phase 5).
   Sizing each bank to its busiest single phase: **2,136 → 1,477 machines
   (−31%)**, 32.6 → 26.1 GW, iron ore −43%. **Phase times stay the same.**
2. **A "🐢 Minimum finish" preset.** A target time per phase instead of
   hard-coded `FINAL_RATES`. At ~8 h per phase (AFK time while you build the
   next district) the whole factory is **~540 machines and ~13 GW**. ×scale today
   only offers 0.5–2, and it is hidden in Blueprints.
3. **Nuclear Pasta at 4/min sets the size of Phase 4** (4,800 copper ingot/min).
   Turning it down is the single biggest shrink.
4. **Make nuclear optional.** No production recipe uses uranium. At minimum
   scale, coal plus fuel covers the power. F could then sit by copper and coal
   instead of uranium. That removes a rail line and the fuel-rod and waste chain.
5. **Banks with zero demand still get "1× now"** (`bankNowCount` floors at 1).
   Example: Phase-1 Modular Frame, which steals Reinforced Iron Plate from
   Smart Plating. It should be "reserve floor space, build it in Expand for
   Phase N".

### Open — correctness, still to do — *all done in Part 6 except the node-coordinate table*

- **Nuclear fuel chain as real steps.** Sulfur → acid → cells → rods, plus
  waste, sized to the ⚡ step's plant count. It needs EM Control Rod and Encased
  Beam demand in the solver (today E §11 is sized only for the Magnetic Field
  Generator).
- **Phase-5 fluids at ★:** Excited Photonic Matter and Dark Matter Residue
  can't be packaged, so they can't come from G by rail. Put an EPM Converter at
  ★, and handle the residue there (a local Dark-Matter-Crystal accelerator or
  fluid buffers).
- **Building and milestone costs aren't in demand.** 8 Converters need 800 SAM
  Fluctuators. 14 Particle Accelerators need 140 Supercomputers. Milestones need
  hundreds of Fused Modular Frames and Radio Control Units. Add "bank N× X
  before step Y" steps.
- **MAX mode:** step titles show the funded count, while the detail says to
  build ~2× when the bank isn't in your sloop plan. Feeds aren't halved for
  slooped banks. Sloops are assumed from Phase 1 but unlock in Phase 4. (100%
  is now the default, so this only bites if you choose MAX.)
- **Presentation:** each step is one ~90-word paragraph. Split it into
  Place / Feed / Collect / Done-when lines. The print header should state the
  mode. Hide screen-only buttons in print. "PA" is used for both Project
  Assembly and Particle Accelerator.
- **"Where":** the node-coordinate table is still owner-supplied, from round 2.
  Miner Mk and count per ore feed is computable now.


---

## Part 6 — Building the minimum factory (rounds 4–7, 2026-09-23)

**Brief from the owner:** *"Continue until you think you have a perfect plan."*

**Method:** a build-then-review loop. Each round ended with 3–5 independent reviewers
driving the real app in headless Chromium:

- a literal first-timer clicking through every step
- a Satisfactory veteran judging buildability
- a game-data auditor
- an adversarial code and migration hunter
- a docs editor

Game facts came from the game's own data exports (SatisfactoryTools 1.0 and a 2026
live export, which agree), not from memory. See VERIFICATION.md.

### What the plan is now

| | 🐢 Minimum (default) | ⚖ Balanced | 🚀 Fast |
|---|---|---|---|
| Each phase's deliveries | up to ~8 h | up to ~4 h | original design rates |
| Machines (100% clock) | ~720 | ~1,470 | ~2,180 |
| Power at the end | ~26 GW | ~43 GW | ~54 GW |
| Nuclear plants (P4 / P5) | 5 / 11 | 8 / 17 | 11 / 18 |
| Steps | 262 | 318 | 376 |

The Minimum-pace power figure includes every miner and extractor, plus datamined
per-recipe draw for the variable buildings.

### The big changes

1. **Pace, not fixed rates.** Each phase's finals run at `quantity ÷ pace`, and every
   bank is sized to its busiest single phase. Banks are built in the first phase that
   needs them. Nuclear Pasta banks evenly across Phases 4–5.
2. **Real milestones.** Every HUB milestone and MAM node the finish needs is a step,
   with its datamined cost and unlocks. Every bank is gated on its recipe's milestone
   and its building's milestone. Each phase is topologically sorted, so each milestone
   is followed by the banks it unlocks, then by the banks that make the next
   milestone's parts.
3. **One-off costs are planned.** Milestone costs and the build cost of every
   machine, generator, extractor, pressurizer and train are charged to the phase
   before they are needed (solved to a fixed point). A 🧺 Stockpile step lists them.
4. **Power never outruns generation.** Each phase's power chain is scheduled first.
   D's Fuel bank feeds the fuel generators. Automatic ⚡ top-ups use the best
   generator unlocked by then. Nuclear is sized with the fuel chain F builds. At every
   step, draw stays under ~90% of capacity at every pace and clock setting.
5. **Logistics fixes.**
   - Nuclear Pasta moved next to the copper (B).
   - Diamonds moved next to the coal (C).
   - F makes only nuclear fuel.
   - The AI Expansion Server is made in G, because Excited Photonic Matter can't
     travel.
   - SAM Fluctuators stockpile from Phase 4 via MAM research.
   - Belts are capped at Mk.5 and pipes at Mk.1 (the upgrades are optional
     milestones).
6. **Readable steps.** Each step card shows:
   - Place / Feed / Output / Done-when lines.
   - Miner and extractor counts, using only the belts and miners unlocked at that
     point.
   - Byproduct routing.
   - A site check that lists the nodes the district needs.
7. **Data corrections**, all datamined:
   - Phase 2 is 1,000 / 1,000 / 100.
   - Supercomputer is Tier 7.
   - Magnetic Field Generator is Tier 8.
   - The Hazmat Suit needs MAM Gas Mask research.
   - Recycled Plastic uses Fuel.
   - Coated Iron Plate is 37.5 + 7.5.
   - MAX is now 250% overclock with Power Shards only.
8. **Save safety.** A `PLAN_VERSION` re-runs the backfill whenever steps land in
   phases a save has already finished. The current phase is judged by district pads
   and deliveries only. Moved templates keep their ticks. This is verified with saves
   from three older builds at dozens of progress points, both at boot and through
   Load code.

### Still open

- **Real node coordinates.** This needs the owner. Each pad step's site check now
  lists the nodes it needs, which covers the rest.
- **Map realism.** Copper (~2,860 ore/min) and coal (~1,780/min) at Minimum pace are
  more than one desert region supplies. Each district sits by its own ore, the site
  check says what to look for. The plan-wide alternates (Fused Wire, Solid Steel,
  Oil-Based Diamonds) cut coal by ~55% and copper by ~20%. Pure Copper and Pure Iron
  Ingot need a Refinery, which arrives after those banks are first built, so they're
  offered as hand-rebuilds from Phase 3, not as switches. Each alternate needs its
  hard drive.

---

## Part 7 — The opening, fuel order and solver determinism (round 8, 2026-09-23)

A first-timer walkthrough found two structural problems, and an adversarial code pass
found one more:

1. **The opening was hand-crafted.** Tiers 1–2 were Phase-0 one-liners ("do Part
   Assembly"), so you had to hand-craft ~1,100 plates, 950 rods, 1,100 wire and 800
   screws. Now they are six real 🔓 milestones in Phase 1, with their datamined costs:
   Base Building, Logistics, Field Research (the MAM), Part Assembly, Logistics Mk.2 and
   the Resource Sink.
   - A **small Copperworks** (copper, wire, cable) now opens in Phase 1, straight after
     the Ironworks basics, because those milestones cost wire and cable.
   - The Assembler banks (RIP, Rotor, Frame, Smart Plating) wait for Part Assembly.
   - Belts are Mk.1 (60/min) until Logistics Mk.2.
   - The pads say foundations come with Base Building.
   - Phase 1's own costs are paid within about an hour (`OPENING_WINDOW`), not over the
     8-hour pace window.
   - The MAM research nodes all come after Field Research. Caterium research waits for
     Phase 2, its first real use.
2. **A fuel top-up came before the fuel to run it.** D's Fuel refinery expansions now go
   first in their phase, ahead of any ⚡ top-up of Fuel Generators.
3. **The ledger depended on who called it first.** `computeExtras()` now always runs
   with the solver's recursion guards off, so the same settings always give the same
   plan. That adds about 35% to solve time.

Smaller fixes:
- The coke line's picture and card name the residue source (D §1 + §4), and its output
  goes to a Sink.
- Final-bank pictures show the delivery rate, matching the card.
- Top-up cards give their instruction first and end on "Done when". Coal top-ups count
  their coal miners and water extractors.
- Power Storage is marked optional. The coal step says to let the burners run down.
- Every milestone says whether its parts are in the stockpile or still being made, and
  how long to allow.
- Pads and rail links have a "Done when".
- The check-in recap refreshes after "I'm further ahead".

Save migration (plan v14):
- The old Phase-0 ticks map onto the new milestones.
- A save past Phase 1 that never built Copperworks is sent back to build it.
- Every other save lands where it was.


### Rounds 9–10 (same day)

The first-timer, veteran and code reviewers each ran twice more.

What the veteran confirmed from game data: every unlock is in order, all 32 milestone
costs and every Space Elevator count match, the generator and recipe rates match, and
draw never exceeds capacity.

Fixed:
- **The opening can be followed as written.**
  - Tier 1 Logistics is hand-crafted first, so every early line can split and merge.
  - The mall step lists exactly what to hand-craft for the first machines. It only
    lists what Tier 0 can craft; Rotors are asked for once Part Assembly unlocks them.
  - The Space Elevator (1,500 Wire) waits for the A and B lines.
  - Burners are described honestly: they need refilling while you play, and Obstacle
    Clearing (Solid Biofuel) makes the fuel last longer.
- **Nothing you need goes into a Sink.** Fuel goes to its generators, fuel rods to the
  plants, and SAM Fluctuators to the ★ stockpile. The Sink milestone now comes before
  the oil byproducts that use it.
- **Power:** the Ballistic Warp Drive draws its real 1,000 MW average.
- **Cards:**
  - Bank cards show their build cost.
  - Lightly used banks get an underclock hint, correct under MAX too.
  - Every step has a "Done when" you can check the moment you've built it.
  - Deliveries say to press Send when the elevator is full.
- **State:**
  - Migration holds Copperworks back only when it really is missing.
  - Reset keeps the plan version.
  - Undo walks a stack of ≈ and ⏭ marks.
  - A whole jump can be undone in one tap, and that button clears on Reset and Load code.
  - `PLAN_VERSION` is now 15.
- **Speed:** the extras ledger stops when it flip-flops between two answers, so boot
  time is back to ~1.1 s.

Still open: district E's cards disagree slightly on how its fresh and recycled water is
split.

Resolved since: district E's water now adds up (see rounds 11–13).

### Rounds 11–13 (same day)

- **No more underclock advice.** Lightly used banks sit at the far end of their input
  manifold and pause when their output fills up. The old advice was an underclock that
  no later step ever reversed.
- **Byproducts feed sections in order.** A district's recycled byproduct goes to its
  earliest consumer first. District E's water now adds up: 520 + 58 = 578 m³/min fresh.
  Pad site checks count fresh intake only, and water comes off one district water main.
- **The visual views show your real progress.**
  - 📍 My progress and the Build Map at 📍 Now count machines from your ticks.
  - The map outlines the district you're in and marks the next bank ▶. Its caption says
    the next step and how much of that district stands.
  - Blueprints marks the next bank, including in the phone build list ("k of n built").
  - Step pictures collapse built machines into one "N built" chip.
  - Phones get 40 px buttons, and the map appears on the first screen.
- **Trains and fluids.**
  - Each end of a rail link has a Load and an Unload platform, with a car per platform.
    The Blueprints rail row now shows the same kit.
  - New steps: Smart Splitter (MAM research) before the first rail link, Railway
    Signalling (only needed when trains share track), and Pipeline Mk.2 (pipes run
    600 m³/min from Phase 3).
  - Goods between two far districts travel via the core.
- **Mid-game.**
  - Dark Matter loop: the encoders' residue is used first, and excess crystal overflows
    to a Sink.
  - Every delivery has a "Done when", and Pasta keeps banking after Phase 4.
  - The Hazmat Suit's cost is shown.
  - With MAX on, the Power Shard count reads "now" and "at full size".
- **`PLAN_VERSION` is 16.** Round 13 migrated saves from the previous build at 22 points
  each: nothing was lost, and boot takes ~1.1 s.

Both items left open here are now resolved (round 14, below).

### Round 14 — real node locations, Phase-3 fuel count

- **Real resource nodes.** The app embeds every ore, oil and nitrogen node on the 1.0 map
  (the satisfactory-calculator/SCIM export, via github.com/Tjark-Kuehl/satisfactorymap).
  ★ sits in the middle of the Dune Desert's seven pure iron nodes (x 2918, y −1639 m).
  `nodePlan()` assigns nodes live for your pace and clock: A–D take the nodes nearest ★,
  and E–G take the best cluster anywhere. Each pad step lists its nodes with distance,
  direction and coordinates, 📋 Items → 📍 Where has the table, and the Build Map places
  each district in its real direction (spread ≥40° so panels don't overlap). `nodes.md`
  is the Minimum-pace snapshot.
- **What the real map showed:** crude oil is the scarcest resource. Minimum pace uses 20 of
  the world's 30 oil nodes, ~2–3 km west of ★. Balanced also needs the oil-well satellites
  (Phase 4). Fast exceeds the map at 100%, and the app says so: overclock the extractors.
  Residual Fuel would ease this, but it comes from a Hard Drive, not a milestone.
- **Phase 3 Fuel Generators** now count the coal generators already standing, including
  coal top-ups: 5 instead of 8 at Minimum, which hits the intended ~40% headroom.

