# Power plan — when to switch, and how much

Power in Satisfactory is **all-or-nothing**: if demand exceeds supply for a moment
the whole grid trips and everything stops until you reset the fuse. So the rule
is **always keep headroom** (build power *ahead* of the works that need it) and
**switch generator type before the old one becomes a chore.** This is the one
"works" you build a little of in every phase.

All figures are standard, 1.0, per generator at 100 % clock.

| Generator | Output | Eats | Build it… | Tier |
|-----------|--------|------|-----------|------|
| **Biomass Burner** | 30 MW | Biomass / leaves / wood (hand- or belt-fed) | At the very start — bootstrapping only | 0 |
| **Coal Generator** | 75 MW | 15 Coal/min **+ 45 m³ Water/min** | The moment you finish Phase 1 (Tier 3) | 3 |
| **Fuel Generator** | 250 MW | 20 Fuel/min (no water) | Once oil is flowing (Phase 3) | 6 |
| **Nuclear Power Plant** | 2500 MW | 0.2 Uranium Fuel Rod/min **+ 240 m³ Water/min** (makes **Nuclear Waste**) | Phase 4, when Particle Accelerators arrive | 8 |
| *Geothermal Generator* | ~150 MW avg (fluctuates) | nothing — sits on a geyser | Free supplement whenever you pass a geyser | 3 |

---

## When to switch (the decision you asked about)

- **Biomass → Coal:** the instant Phase 1 is delivered (unlocks Tier 3 *Coal
  Power*). Stop hand-feeding burners — build a **row of Coal Generators next to a
  lake**, pump water in, belt coal in. One coal node (Mk.2 miner, ~120/min) runs
  **~8 coal generators = 600 MW**. Set-and-forget.
- **Coal → Fuel:** once **Oil & Electronics (D)** is running in Phase 3. Fuel
  Generators give **250 MW each** (3.3× a coal gen) and free your coal up for
  **steel** (which you need a lot of). Refine crude → Fuel, pipe it to a fuel-gen
  bank. This carries you comfortably through Phase 3 and most of Phase 4.
- **Fuel → Nuclear:** in **Phase 4**, when **Particle Accelerators** (Nuclear
  Pasta, Diamonds, Dark Matter) come online — they each draw **250–1500 MW and
  fluctuate hard**, and Phase 5's quantum factories push you into the **multi-GW**
  range. One **Nuclear Power Plant = 2500 MW**; the full 100% plan needs
  **~13 by the end of Phase 4 and ~19 by the end of Phase 5** (the app's ⚡ steps give
  the live count). Site them **by lots of water**, and **deal with the Nuclear Waste**
  (store it in containers, or process it later) — waste that backs up will stall
  the plant and trip the grid.

> You don't have to *replace* the old generators — leave coal/fuel running as a
> base load and **stack the new type on top**. Build-once applies to power too.

---

## The nuclear fuel chain (the part every plan forgets — sized here for 6 plants)

Six plants = **15 GW**. The full 100% plan needs ~19 plants (~3.8 rods/min), so
multiply the right-hand column by ~3.2 — or run a smaller factory (see REVIEW.md
Part 5: sizing banks per phase cuts total draw by ~20%). The rod chain below is
**not in the app's demand solver** (fuel isn't demanded by any elevator part),
so build it from this table; scale linearly for more plants.

| Step | Building | Per-minute recipe | For 6 plants (1.2 rods/min) |
|------|----------|-------------------|------------------------------|
| **Sulfuric Acid** | Refinery | 50 Sulfur + 50 Water → 50 Acid | **~2 Refineries** (~100 Sulfur/min — **claim a sulfur node!**) |
| **Encased Uranium Cell** | Blender | 50 Uranium + 15 Concrete + 40 Acid → 25 Cells (+10 Acid back) | **~2.5 Blenders** (~120 Uranium ore/min ≈ one normal node) |
| **Uranium Fuel Rod** | Manufacturer | 20 Cells + 1.2 Encased Beam + 2 EM Control Rod → 0.4 Rods | **3 Manufacturers** |
| **Feed the plants** | — | 0.2 Rod + 240 Water per plant | 1.2 rods + 1,440 water/min |

**Waste (the part that bites):** each plant emits **10 Uranium Waste/min** — 60/min
for six — and waste **cannot be sunk**. Pick one before you switch the plants on:

1. **Store it** — a growing wall of Industrial Storage Containers (fine for a
   one-launch save; ~1 container fills every ~40 min at 6 plants).
2. **Plutonium chain** — Non-fissile Uranium → Plutonium Pellet → Encased
   Plutonium Cell → Plutonium Fuel Rod, then *sink the plutonium rods* (or burn
   them, which makes worse waste). Needs **Nitric Acid** (nitrogen + sulfur).
3. **Ficsonium** (Tier 9) — Particle Accelerator + Quantum Encoder + EPM turns
   waste into clean Ficsonium fuel: the true zero-waste endgame.

*Also missing from the app's raw table by design: generator fuel. Coal power
eats 15 coal + 45 water per generator, fuel power 20 fuel/min per generator
(refine crude → fuel), nuclear the numbers above — claim those nodes on top of
the production totals.*

---

## Rough power budget per phase (plan headroom for ~1.5× this)

| Phase | Ballpark draw | Backbone to have running |
|-------|---------------|--------------------------|
| 1 | ~290 MW | ~14 Biomass Burners (a chore — push through to Tier 3 fast) |
| 2 | ~890 MW | ~17 **Coal Generators** (one bank by water) |
| 3 | ~2.5 GW | Coal **+ ~14 Fuel Generators** |
| 4 | ~21.5 GW (Particle Accelerators spike) | Fuel **+ ~13 Nuclear plants** |
| 5 | ~32.6 GW (quantum + converters) | **~19 Nuclear plants** as the backbone |

These are the app's own figures at 100% clocks (what is actually standing at the
end of each phase, generator counts incl. 40% headroom; miners and pumps add
~10–15%). MAX mode draws far more — see the ⚡ power plan in 📋 Items We Need. The safe move is to **watch the power bar; when you're within ~20 %
of the cap, add the next generator bank before building more production.**

---

## Build-block advice

- Build power as a **repeatable block** (e.g. "8 coal gens + water pumps" or
  "4 fuel gens + a fuel buffer") on its own pad, and **stamp another block** when
  the bar gets tight — exactly like the production works.
- Keep a **fuel/coal buffer** (a few Industrial Storage Containers) feeding the
  generators so a brief miner hiccup doesn't trip the grid.
- At end-game, a row of **Power Storage** batteries smooths the Particle-
  Accelerator spikes and buys you seconds to react before a trip.
- In **✅ Do Next**, each ⚡ Power step says how many generators to have by the
  end of that phase, and the live readout tracks what you've ticked.

---

*Power figures verified against the official Satisfactory Wiki
(Coal-/Fuel-Powered Generator, Nuclear Power Plant) and the community power
calculator. Tiers are for v1.0.*
