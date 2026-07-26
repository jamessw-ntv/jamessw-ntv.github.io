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

### 2.5 The reality-checker · 2.6 The accessibility reviewer

*(Findings pending — filled in as each reviewer reports.)*
