# Satisfactory 1.0 — District Factory Master Plan

A start-to-finish, **build-once** plan to take a single save from the HUB to a
completed Project Assembly (Space Elevator Phase 5) — no spaghetti, no rebuilds.

Written for a player who wants to be told **exactly what to build, in what order,
roughly where, and how it connects** — so the planning anxiety goes away and you
just tick tasks off.

> **Open `factory-network.html` in a browser** (also published to GitHub Pages).
> It's the live, interactive version of everything below and works fully offline.

---

## The model: material *districts*, not a mega-base or 1000 huts

The factory is **7 production districts + 1 Project Assembly**, each a tidy
mini-base grouped around one material family:

| | District | Near | Makes (shared) |
|---|----------|------|----------------|
| **A** | Ironworks | iron + limestone | iron ingot/plate/rod/screw, RIP, rotor, modular frame, concrete |
| **B** | Copperworks | copper + caterium | wire, cable, copper sheet, quickwire, AI limiter — and from Phase 4 **copper powder → Nuclear Pasta** (so ~3,000 ingots/min never ride a train) |
| **C** | Steelworks | iron + coal | steel, beam, pipe, encased beam, stator, motor, and **diamonds** in Phase 5 (they eat coal) |
| **D** | Oil & Electronics | crude oil | plastic, rubber, **fuel** (for the fuel generators), quartz, silica, circuit board, computer, heavy frame, crystal oscillator, supercomputer |
| **E** | Aluminium & Cooling | bauxite 🚆 | aluminium chain, heat sink, cooling system, turbo motor |
| **F** | Nuclear Fuel | uranium 🚆 | sulfuric acid → uranium cells → fuel rods, and the Nuclear Power Plants |
| **G** | Quantum & SAM | SAM 🚆 | SAM fluctuators, ficsite, time crystals, dark matter, EPM, NQP, oscillators, singularity cells, **AI Expansion Server** (its EPM can't travel) |
| **★** | Project Assembly | by the Space Elevator | **the final elevator parts** (all but the AI Expansion Server, which G makes and rails in) |

Each base material is made **once**, in the district that owns it, sized to total
demand, and shared. Only the **finals** are single-use and they live together
by the elevator. Cross-district flows are few and one-directional (belts between
the core districts; **trains** to/from the far ones; **drones** for small dribbles
of expensive parts).

You're in the **top-right Dune Desert plateau** (flat &amp; open), building everything
**above ground** (fly mod). Counts are at **100% clock** by default; the ⚡ pill switches
to **250% overclock** (3 Power Shards per machine, ~40% of the machines). Somersloops are
never assumed — only ~106 exist — so the app's **🎯 allocator** takes the number you own
and each build step says whether *that* bank is worth slotting them into.

### Pace: how big the factory is

The first question the app asks is **how patient you are**. Once a phase's lines are
built, its deliveries just *run* while you build the next district, so waiting longer
costs little real time and shrinks every bank:

| Pace | Each phase's deliveries | Machines (100%) | Power at the end |
|---|---|---|---|
| 🐢 **Minimum** (default) | up to ~8 h of running | ~690 | ~16 GW |
| ⚖ Balanced | up to ~4 h | ~1,400 | ~28 GW |
| 🚀 Fast | the original design rates (P5 ~4 h) | ~2,070 | ~35 GW |

Every bank is sized to its **busiest single phase** (finished deliveries stop drawing),
and the counts include the one-off parts the finish really costs: every **HUB milestone
and MAM research** on the way (real 1.0 costs), and the **build cost of every machine,
generator, extractor and train** you place. The app charges those to the phase *before*
you need them — a 🧺 **Stockpile** step tells you what to bank while the deliveries run.

---

## How to use the app (`factory-network.html`)

| Tab | What it does |
|-----|--------------|
| **✅ Do Next** | The numbered **step-by-step list** (HUB → launch). The orange card shows the single next thing; tick it and it advances. Every step comes after what it needs: the 🔓 milestone or MAM research that unlocks it (with its real cost), the district pad, its suppliers, the ⚡ generators to add, ⚠ utilities, **Expand …** steps and 🧺 stockpiles. Tick anything you've already built. |
| **🗺️ Build Map** | A zoomable **nested atlas**: districts in place → their area blocks → (zoom in) the machines. Real **belt vs 🚆 train** links, raw feeds, phase slider that darkens unbuilt. Click an area → its belt web. |
| **📐 Blueprints** | Per-district **Flow** (connections) / **Grid** (exact foundation footprints) layouts; click an area for its **belt web** (double-sided manifold, multi-lane belts). A **show:** control switches between the *Final plan*, any single phase, and **📍 My progress** — the factory as your ticks say it stands. |
| **📋 Items We Need** | Whole-build shopping: raw nodes to claim (recycled byproducts already netted off), total buildings bill, the **power plan**, and the **🎯 Somersloop allocator** — enter how many you actually own and it tells you which banks to amplify. |
| **🏭 Districts** | Each district: what it makes, what it imports, raw feed, machine count. |
| **🧩 Templates** | Every recipe with a visual; **search** an item to see where it's made/used and jump there. |
| **📖 Guide** | This overview + **alt-recipe toggles**: tick one you've unlocked and the whole plan re-solves around it. |

Progress saves in your browser; **🔑 Save code / 📥 Load code** moves it between
devices; **🖨️ Print manual** prints the numbered checklist. Each step can be marked
**built**, **≈ already covered by my existing factory**, or **⏭ skipped**, and
**🔁 Audit my save** walks the whole plan asking which — that's how you adopt this
plan onto a save that's already running.

---

## The files in this folder

**To just follow the plan you only need the app:** open it, answer the one question,
and do what the orange card says. Everything below is reference.

| File | What it is |
|------|------------|
| **factory-network.html** | The interactive app (above). Open this. |
| **README.md** (this) | The overview — read first. |
| **architecture.md** | Why districts, the build/expand order, and the per-district build procedure. |
| **templates.md** | What a reusable cell/template is (exact specs live in the app + VERIFICATION.md). |
| **train-network.md** | Rail plan + **drones** + signalling. |
| **power.md** | When to switch biomass → coal → fuel → nuclear, and how much. |
| **VERIFICATION.md** | *(maintainers)* every recipe, milestone and building cost checked against game data, with corrections logged. |
| **REVIEW.md** | *(maintainers)* the review history and what's still open. |

---

## Belt & pipe reference (drives *how much* you build)

| Belt | Items/min | Tier | Pipe | m³/min | Tier |
|------|-----------|------|------|--------|------|
| Mk.1 | 60 | 0 | Mk.1 | 300 | 3 |
| Mk.2 | 120 | 2 | Mk.2 | 600 | 6 |
| Mk.3 | 270 | 4 |
| Mk.4 | 480 | 5 |
| Mk.5 | 780 | 7 |
| Mk.6 | 1200 | 9 |

When a trunk's rate tops the belt it's on, the belt web **splits it into parallel
lanes** (e.g. "2× Mk.5" — the plan stops at Mk.5; Mk.6 needs the optional Peak Efficiency milestone) and feeds the manifold **from both sides**. Fluids go on
**pipes**, never belts.

---

## Master timeline (what gates what)

| Complete… | Unlocks | Key tools |
|-----------|---------|-----------|
| **Tier 0** | Tiers 1–2 | Smelter, Constructor, Miner Mk.1, **Space Elevator**, belts Mk.1 |
| **Tiers 1–2** | — | Assembler, belts Mk.2, splitters/mergers |
| **SE Phase 1** (50 Smart Plating) | Tiers 3–4 | Foundry/Steel, **Coal Power**, belt Mk.3, Modular Frames |
| **Phase 2** (1000 SP, 1000 Versatile Framework, 100 Automated Wiring) | Tiers 5–6 | Manufacturer, **Oil/Refinery**, plastic/rubber, computers, belt Mk.4, **Trains** |
| **Phase 3** (2500 VF, 500 Modular Engine, 100 ACU) | Tiers 7–8 | Blender, **Aluminium**, **Particle Accelerator**, **Nuclear**, belt Mk.5, **Drones** |
| **Phase 4** (500 ADS, 500 MFG, 250 TPR, 100 Nuclear Pasta) | Tier 9 | **Quantum Encoder**, **Converter**, ficsite, dark matter |
| **Phase 5** (1000 Nuclear Pasta, 1000 Biochemical Sculptor, 256 AI Expansion Server, 200 Ballistic Warp Drive) | **Game complete** 🚀 | — |

---

## Don't-forget utilities (the silent build-breakers)

- **Heavy Oil Residue** — Plastic/Rubber produce it; route to Residual Fuel (→ free
  power) or the AWESOME Sink, or run the Recycled Plastic/Rubber loop, or refineries clog.
- **Nuclear Waste** — store in containers / process; backed-up waste stalls the plant.
- **Water** — pump from a lake for coal power, aluminium, cooling, nuclear (mind head-lift).

---

*All numbers are for game **version 1.0**, cross-checked against the official wiki
and SCIM. See **VERIFICATION.md** for the full reference and the corrections log.*
