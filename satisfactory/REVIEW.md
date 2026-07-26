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

*(Findings pending — this section is filled in as each reviewer reports.)*
