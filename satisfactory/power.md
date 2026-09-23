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

## When to switch

The app does the maths for you. Every ⚡ step in ✅ Do Next says how many generators
to **add**, and the steps are ordered so **power always comes before the load**: each
phase builds its power chain first. Wherever the next builds would pass ~90% of what
you generate, a **⚡ Top up power** step appears using the best generator you've
unlocked by then. The readout under the orange card shows *draw vs. capacity* at your
point in the plan.

- **Biomass → Coal:** Phase 2, as soon as Tier 3 *Coal Power* is done. Put coal
  generators by water, on a coal node of their own (Steelworks needs its coal).
- **Coal → Fuel:** Phase 3. D's **Fuel refinery bank** (60 crude → 40 Fuel, plus
  30 Polymer Resin to sink) is sized for exactly the fuel generators the plan builds,
  including any top-ups. Heavy Oil Residue from plastic/rubber can also become fuel
  (Residual Fuel), but that's a bonus, not relied on.
- **Fuel → Nuclear:** Phase 4. The nuclear chain comes first in the phase:
  aluminium → Control System Development → Supercomputers → Nuclear Power
  milestone → EM rods, uranium cells, fuel rods → plants. A few fuel generators
  bridge the gap. Phase 5 adds more plants at the start of the phase.

> Don't *replace* old generators. Leave coal and fuel running as base load and
> **stack the new type on top**.

---

## The nuclear fuel chain (built by the app in F · Nuclear Fuel)

F §1–3 are these three banks, sized from the plant count (0.2 rods/min per plant):

| Step | Building | Per-minute recipe (1.0) |
|------|----------|-------------------|
| **Sulfuric Acid** | Refinery | 50 Sulfur + 50 Water → 50 Acid |
| **Encased Uranium Cell** | Blender | 50 Uranium + 15 Concrete + 40 Acid → 25 Cells (+10 Acid back) |
| **Uranium Fuel Rod** | Manufacturer | 20 Cells + 1.2 Encased Beam + 2 EM Control Rod → 0.4 Rods |
| **Nuclear Power Plant** | — | 0.2 Rod + 240 Water → 2,500 MW + 10 Uranium Waste |

At 🐢 Minimum pace that's **7 plants by the end of Phase 4 and 13 by the end of Phase 5**
(2.6 rods/min). At 🚀 Fast it's 18 and 25. Uranium and sulfur are in the raw-node
table.

**Waste:** each plant makes **10 Uranium Waste/min**, and waste **cannot be sunk**.
Pick where it goes before you switch the plants on:

1. **Store it** in a wall of Industrial Storage Containers (48 slots × 500 = 24,000
   each). At 13 plants that's about one container every 3 hours. Fine for a
   one-launch save.
2. **Plutonium chain.** Non-fissile Uranium → Plutonium Pellet → Encased Plutonium
   Cell → Plutonium Fuel Rod, then sink the rods. Needs Nitric Acid.
3. **Ficsonium** (Tier 9, Peak Efficiency): turns waste into clean fuel.

Wear a **Hazmat Suit** with Iodine-Infused Filters around uranium. The Tier 7
milestone needs 50 Gas Filters, which come from MAM Mycelia → Fabric → Gas Mask.
The plan lists those research steps.

*Not in the raw-node table: coal and water for the coal generators (15 coal + 45
water each). Crude for the fuel refineries **is** counted, and so is nuclear fuel.*

---

## Power budget per phase (🐢 Minimum pace, 100% clock)

| Phase | Draw at the end of the phase | Generators the ⚡ steps add |
|-------|---------------|--------------------------|
| 1 | ~100 MW | ~5 Biomass Burners |
| 2 | ~520 MW | 10 **Coal Generators** (+1 burner top-up early on) |
| 3 | ~1.9 GW | 5 Coal (top-up) + 7 **Fuel Generators** |
| 4 | ~14.2 GW | 10 Fuel (bridge until nuclear) + 7 **Nuclear plants** |
| 5 | ~24.3 GW | 6 more **Nuclear plants** (13 total) |

These are the app's own figures, **including every miner and extractor** and the real
per-recipe draw of accelerators, converters and encoders (Nuclear Pasta, Dark Matter
Crystal, Biochemical Sculptor and the encoders average ~1,000 MW each). Each ⚡ step
includes 40% headroom. Other paces and MAX: see the ⚡ power plan in 📋 Items
We Need.

---

## Build-block advice

- Build power as a **repeatable block** (e.g. "8 coal gens + water pumps" or
  "4 fuel gens + a fuel buffer") on its own pad, and **stamp another block** when
  the bar gets tight — exactly like the production works.
- Keep a **fuel/coal buffer** (a few Industrial Storage Containers) feeding the
  generators so a brief miner hiccup doesn't trip the grid.
- At end-game, a row of **Power Storage** batteries smooths the Particle-
  Accelerator spikes and buys you seconds to react before a trip.
- In **✅ Do Next**, each ⚡ step says how many generators to add, and the readout
  under the orange card shows draw vs. capacity at your point in the plan.

---

*Power figures verified against the official Satisfactory Wiki
(Coal-/Fuel-Powered Generator, Nuclear Power Plant) and the community power
calculator. Tiers are for v1.0.*
