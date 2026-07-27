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
| **B** | Copperworks | copper + caterium | wire, cable, copper sheet, quickwire, AI limiter |
| **C** | Steelworks | iron + coal | steel, beam, pipe, encased beam, stator, motor |
| **D** | Oil & Electronics | crude oil | plastic, rubber, circuit board, computer, heavy frame, supercomputer |
| **E** | Aluminium & Cooling | bauxite 🚆 | aluminium chain, heat sink, cooling system, turbo motor |
| **F** | Nuclear & Particle | uranium 🚆 | copper powder, diamonds, nuclear pasta |
| **G** | Quantum & SAM | SAM 🚆 | ficsite, time crystals, dark matter, EPM, NQP, oscillators, singularity cells |
| **★** | Project Assembly | by the Space Elevator | **the 12 final elevator parts only** |

Each base material is made **once**, in the district that owns it, sized to total
demand, and shared. Only the **12 finals** are single-use and they live together
by the elevator. Cross-district flows are few and one-directional (belts between
the core districts; **trains** to/from the far ones; **drones** for small dribbles
of expensive parts).

You're in the **top-right Dune Desert plateau** (flat &amp; open), building everything
**above ground** (fly mod). The ⚡ **MAX** toggle plans at 250% + Somersloop (≈5× per
machine, so ~⅕ the machines); ⚡ **100%** plans the honest full counts. Note the world
only contains **~106 Somersloops**, nowhere near enough to amplify everything — so the
app's **🎯 allocator** takes the number you actually own and tells you which banks are
worth it (the deep terminal chains, whose whole upstream tree halves), and each build
step then says whether *that* bank should be amplified or just overclocked with shards.

### Why the design rates are what they are

The 12 final parts have design rates chosen to **minimise waiting**, not to maximise
throughput: within each phase every part is rated to finish at about the same time, on
that phase's unavoidable long pole — **P2 ~50 min, P3 ~125 min** (Versatile Framework's
2,500 sets that floor), **P4 ~125 min, P5 ~250 min** (Nuclear Pasta's 1,100 sets that
one). Nuclear Pasta is deliberately oversized for Phase 4 so it banks toward Phase 5
while you build. Going faster than that in Phase 5 needs a copper operation bigger than
the map can feed, so the plan stops there rather than going over the top.

---

## How to use the app (`factory-network.html`)

| Tab | What it does |
|-----|--------------|
| **✅ Do Next** | The numbered **step-by-step encyclopaedia** (HUB → launch). The orange card shows the single next thing; tick it and it advances. Per-phase tech-unlock gating, live power, pre-flight 🎒 kit, ⚠ utilities, and **Expand …** steps that grow each district as you go. Tick anything you've already built. |
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

| File | What it is |
|------|------------|
| **factory-network.html** | The interactive app (above). Open this. |
| **README.md** (this) | The overview — read first. |
| **architecture.md** | Why districts, the build/expand order, and the per-district build procedure. |
| **templates.md** | What a reusable cell/template is (exact specs live in the app + VERIFICATION.md). |
| **train-network.md** | Rail plan + **drones** + signalling. |
| **power.md** | When to switch biomass → coal → fuel → nuclear, and how much. |
| **VERIFICATION.md** | Every recipe cross-checked vs the wiki/SCIM, with corrections logged. |
| **inventory.csv** | The deliveries/milestones checklist (spreadsheet-friendly). |

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
lanes** (e.g. "2× Mk.6") and feeds the manifold **from both sides**. Fluids go on
**pipes**, never belts.

---

## Master timeline (what gates what)

| Complete… | Unlocks | Key tools |
|-----------|---------|-----------|
| **Tier 0** | Tiers 1–2 | Smelter, Constructor, Miner Mk.1, **Space Elevator**, belts Mk.1 |
| **Tiers 1–2** | — | Assembler, belts Mk.2, splitters/mergers |
| **SE Phase 1** (50 Smart Plating) | Tiers 3–4 | Foundry/Steel, **Coal Power**, belt Mk.3, Modular Frames |
| **Phase 2** (500 SP, 500 Versatile Framework, 100 Automated Wiring) | Tiers 5–6 | Manufacturer, **Oil/Refinery**, plastic/rubber, computers, belt Mk.4, **Trains** |
| **Phase 3** (2500 VF, 500 Modular Engine, 100 ACU) | Tiers 7–8 | Blender, **Aluminium**, **Particle Accelerator**, **Nuclear**, belt Mk.5, **Drones** |
| **Phase 4** (500 ADS, 500 MFG, 250 TPR, 100 Nuclear Pasta) | Tier 9 | **Quantum Encoder**, **Converter**, belt Mk.6, ficsite, dark matter |
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
