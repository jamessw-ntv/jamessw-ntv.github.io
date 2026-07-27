# Factory structure — modular "districts" (not a mega-base, not 1000 huts)

**The model:** a handful of **self-contained mini-bases ("districts"), each grouped
around one material family** — the iron place, the copper place, the steel place,
the oil place — that pass a few parts back and forth, plus **one dedicated
Project Assembly area by the Space Elevator** where the final elevator parts (and
*only* those) are put together.

Why this and not the two extremes:
- **Not a mega-base** (one giant homogeneous zone): too hard to lay out, one
  fuse-trip kills everything, and it's a spaghetti nightmare.
- **Not 12 fully self-contained per-part factories**: every one would re-smelt its
  own iron and re-make its own screws — huge duplication.
- **Districts hit the middle:** each base material is made **once**, in the place
  that owns it, sized to total demand, and shared. Only the **final 12 parts** are
  "single-use," and they live together by the elevator.

---

## The districts (my recommended grouping)

Each district is a tidy mini-base you build on its own raised pad near the right
ore. Arrows show the few parts that cross between districts (the "back and forth").

| # | District | Near | Makes (shared outputs) | Imports |
|---|----------|------|------------------------|---------|
| **A** | **Ironworks** | iron + limestone (+coal) | Iron Ingot, **Iron Plate, Iron Rod, Screw, Reinforced Iron Plate, Rotor, Modular Frame**, Concrete | — |
| **B** | **Copperworks** | copper + caterium | Copper Ingot, **Wire, Cable, Copper Sheet, Quickwire**, AI Limiter | — |
| **C** | **Steelworks** | iron + coal (big pair) | Steel Ingot, **Steel Beam, Steel Pipe, Encased Beam, Stator, Motor** | Wire ← B, Rotor ← A |
| **D** | **Oil & Electronics** | crude oil | **Plastic, Rubber, Circuit Board, Computer, Heavy Modular Frame**, Supercomputer, Silica, Quartz Crystal, Crystal Oscillator | Copper Sheet ← B, Frames ← A/C |
| **E** | **Aluminium & Cooling** | bauxite + water + nitrogen *(train)* | Aluminium Ingot/Casing/Sheet, Heat Sink, **Cooling System**, Fused Modular Frame, **Radio Control Unit**, Turbo Motor, EM Control Rod | Heavy Frame ← D, Rubber ← D, Crystal Osc ← D |
| **F** | **Nuclear & Particle** | uranium + water + lots of copper *(train)* | Nuclear **power**, Copper Powder, Diamonds, **Nuclear Pasta**, Pressure Conversion Cube | Copper Ingot ← B |
| **G** | **Quantum & SAM** | SAM + quartz *(train/endgame)* | Reanimated SAM, Ficsite, Time Crystal, **Dark Matter** (residue→crystal), Excited Photonic Matter, Neural-Quantum Processor, Superposition Oscillator, Singularity Cell | Diamonds ← F, Aluminium ← E |
| **★** | **PROJECT ASSEMBLY** | **at the Space Elevator** | The **12 final elevator parts only** (Smart Plating, Versatile Framework, Automated Wiring, Modular Engine, ACU, ADS, MFG, TPR, Nuclear Pasta delivery, Biochemical Sculptor, AI Expansion Server, Ballistic Warp Drive) | everything, on belts/trains |

So **7 production districts + 1 assembly zone** — mini-bases, not a monolith, not
hundreds of huts.

---

## How it "evolves on top of itself" (build/expand order)

You never tear a district down — you **add machines to it** as new consumers come
online. Each phase bolts onto the last:

- **Phase 1** — Stand up **Ironworks (A)** (smelting → plate/rod/screw → RIP +
  Rotor). Build the **Project Assembly ★** pad by the elevator with one station:
  **Smart Plating** (RIP + Rotor). Deliver 50.
- **Phase 2** — Add **Steelworks (C)** and **Copperworks (B)**. Expand A
  (Modular Frame). ★ gains **Versatile Framework** (Frame ← A + Beam ← C) and
  **Automated Wiring** (Stator ← C + Cable ← B). Deliver. Power: **coal**.
- **Phase 3** — Add **Oil & Electronics (D)**. Expand C (Motor). ★ gains
  **Modular Engine** (Motor ← C + Rubber ← D + Smart Plating) and **Adaptive
  Control Unit** (Auto-Wiring + Circuit Board ← D + Heavy Frame ← D + Computer ←
  D). Deliver. Power: **fuel**.
- **Phase 4** — Train out to **Aluminium (E)** and **Nuclear (F)**. ★ gains
  **ADS, Magnetic Field Generator, Thermal Propulsion Rocket, Nuclear Pasta**.
  Power: **nuclear**.
- **Phase 5** — Add **Quantum & SAM (G)**. ★ gains **Biochemical Sculptor, AI
  Expansion Server, Ballistic Warp Drive**. Deliver → launch. 🚀

---

## Building one district (the procedure)

The **✅ Do Next** tab in the app is the live, numbered version of this; the
steps below are the shape of it:

1. **Lay the platform** above ground near the right ore, sized with room to grow —
   you don't build the whole district at once.
2. **Build it area-by-area** in the order the app lists (raw/ingot end first,
   finished end last), each area only once its inputs are flowing.
3. **Manifold each bank** — feed and collect from both sides; split a trunk into
   parallel belts when its rate tops one belt (the **exact-placement** drill-down
   shows every splitter, merger, belt and buffer). Fluids on pipes.
4. **Expand it each phase** as later consumers come online (the app's *Expand …*
   steps say how many machines to add).
5. **MAX** — overclock every machine to 250% (3 Power Shards) + a Somersloop (2×),
   ~⅕ the machines. Toggle ⚡ MAX off in Blueprints for a 100% plan.

Don't forget the silent build-breakers: **power** (ramp biomass → coal → fuel →
nuclear *ahead* of demand — see `power.md`), **utilities** (water; Heavy Oil
Residue → Residual Fuel or sink; store/process Nuclear Waste), and **transport**
(belts local, trains to E/F/G, drones for small high-value parcels — see
`train-network.md`). The app flags these per district.

---

## Placement (top-right Dune Desert plateau)

Build the whole thing in the **top-right Dune Desert plateau** — flat, open, and
above ground. Core ores (iron, copper, coal, limestone, quartz) are close; the
far resources (bauxite, uranium, nitrogen, SAM) are railed in.

- **A, B, C** are your core local districts — cluster them a short belt-run from
  each other and from the **★ Project Assembly** pad (which sits next to the
  Space Elevator/HUB). Belts carry parts between them; nothing crosses the whole
  map.
- **D** goes by your oil; **E/F/G** are out by the far resources and **railed in**
  (you ship the refined ingots/parts, not the ore).
- The **★ Project Assembly** pad is deliberately compact — only the final-part
  assemblers + a buffer of each part + the elevator. That's your "dedicated
  space," and it's the only place that ever changes between phases.

---

## Why this is the efficient choice

- **Each base material made once** (Ironworks makes *all* the iron parts everyone
  needs), so no duplicated smelting/screw farms — that's the "reuse where
  possible" you asked for.
- **Districts are independent mini-bases** — a problem in Copperworks doesn't trip
  Ironworks; you can read, expand or re-clock one without touching the rest.
- **Only the 12 finals are single-use**, and they're consolidated by the elevator
  so "parts come together at the end" is literally true.
- **Cross-flows are few and one-directional** (B→C for wire, A→C for rotors,
  D→★ for electronics…), so it never becomes spaghetti.

---

*Built: the interactive **Build Map** (in `factory-network.html`) is now the
districts on a compass ring around the central **★ Project Assembly**, with
auto-drawn cross-district part feeds (teal), resource feeds (faded), and
finished-part deliveries to ★ (purple). Click any district to see what it makes.
The guided **build sequence** walks district-by-district, phase by phase
("① build Ironworks → add Smart Plating to ★ → ② build Steelworks + Copperworks
→ …"). The per-works **Blueprints** remain as the detailed machine-by-machine
floor plans for each part, and the **Do Next** checklist drives the granular
tick-off. The map's ▶ Play animates the whole build-out.*
