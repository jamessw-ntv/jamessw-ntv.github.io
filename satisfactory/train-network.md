# End-game transport network (trains + drones)

You'll run **belts for everything local** (the core districts A/B/C/D + ★ Project
Assembly sit a short belt-run from each other in the **top-right desert**) and
bring in **trains for the far districts** that own resources you don't have
nearby: **Aluminium (bauxite), Nuclear (uranium), and Quantum & SAM**. Trains
come online at **Tier 6 (Railway)**, unlocked by finishing Space-Elevator
Phase 2 — so the rail build-out is a **Phase 4 job**, exactly when aluminium /
nuclear become mandatory. **Drones** (Tier 8) carry the small, high-value parcels
on top of the rail backbone — see the drone section below.

---

## The one rule that prevents spaghetti: ship ingots, not ore or parts

Same logic as the belts. **Refine at the source, rail the dense intermediate,
finish at home.**

- **Bauxite outpost →** make **Aluminum Ingots** (and Casing/Sheet) on-site →
  rail the ingots home. (Don't rail wet bauxite or alumina slurry.)
- **Uranium outpost →** either run the **nuclear power plant on-site** next to
  water and rail nothing back but power-via-… (you can't rail power) — so instead
  process uranium to the cell/rod you need and rail that, OR site your whole
  nuclear setup out there and only rail the **Nuclear Pasta feedstock** you need.
- **Oil (if far) →** refine to **Plastic / Rubber / packaged Fuel** at the source
  and rail the solids; or just **pipe** oil home if it's within pipe range.
- **Nitrogen →** it's a gas from a Resource Well; **package it** (Packager →
  Pressurized Nitrogen Canister) and rail the canisters, **or** (cleaner) build
  the nitrogen-consuming sub-factory (Cooling Systems) at the well and rail the
  finished Cooling Systems home.

This keeps every train line to **one or two cargo types**, and the Central Hub
to a manageable number of unload platforms.

---

## Topology: hub-and-spoke (simplest that scales)

```
        Bauxite/Aluminium ─────┐
                               │
        Uranium/Nuclear ───────┤
                               ▼
                      ┌──────────────────┐         belts
        Nitrogen ─────►   CENTRAL HUB     ├───────────────► core districts
                      │  rail receiving   │  (A–D + ★)
        Oil/Ore ──────►   yard (N plats)  │
                      └──────────────────┘
```

- **One receiving yard at the Central Hub** with **one platform per incoming
  line**. Each platform unloads its cargo into a buffer of Storage/Industrial
  Containers, which belt into whichever module needs it.
- **Each far resource is a spoke**: a small station out there that **loads** the
  refined intermediate. One train shuttles each spoke ↔ the hub.
- Start with **point-to-point single-track** lines (one train each — no junction
  conflicts). Only when you have **3+ lines** sharing track do you need real
  signalling (below).

---

## Station + train recipe (repeat per line)

**At the source (load station):**
1. Freight Platform(s) set to **Load**, fed by the on-site refinery's output
   containers.
2. A **Train Station** + Locomotive + as many Freight Cars as platforms.
3. Name the station for its cargo (e.g. `ALU-LOAD`).

**At the hub (unload station):**
1. Freight Platform(s) set to **Unload** into container buffers.
2. Belt buffers out to the consuming module.
3. Name it (e.g. `ALU-UNLOAD`).

**The train:** 1 Locomotive + 1–2 Freight Cars is plenty per spoke early.
Set its **time table**: `ALU-LOAD → ALU-UNLOAD → (repeat)`. Tick **"wait until
fully loaded/unloaded"** so it self-paces.

---

## Drones — the small-parcel layer (Tier 8+)

Trains move **bulk** down a fixed track; **drones** move **small, high-value,
low-throughput** parts point-to-point with no track to lay. Use them for exactly
the cargo that's wasteful to dedicate a whole train to.

**A Drone Port needs:** a port at each end (a home + a destination), **Batteries**
fed to the home port (the drone burns batteries per trip), and the cargo belted
into the home port's input. One drone shuttles between a paired set of ports.

**When to use a drone instead of a belt or train:**
- **Low rate, long distance, high value** — e.g. **Supercomputers, Radio Control
  Units, AI Limiters, Crystal Oscillators, Cooling Systems**, or a few **finished
  elevator parts** trickling to ★. A single drone (~tens/min depending on stack
  size) easily covers these.
- **Bridging a far district's *finished* output to ★/core** when it's only a
  handful per minute — cheaper than a freight train, no track.
- **NOT for bulk** — ore, ingots, plastic, copper-powder, concrete: that's belts
  (local) or trains (far). Drones choke on high throughput.

**Practical drone lines for this plan (Phase 4–5):**
| Drone line | Cargo (small/high-value) | From → To |
|------------|--------------------------|-----------|
| Quantum parcels | Neural-Quantum Processors, Superposition Oscillators | G · Quantum → ★ |
| Aluminium electronics | Radio Control Units, Cooling Systems (if low rate) | E · Aluminium → ★ / D |
| Nuclear delivery | Nuclear Pasta (small/min) | F · Nuclear → ★ |
| Finals top-up | spare AI Expansion Servers / Warp Drives | producing district → ★ |

**Battery budget:** keep a small Battery line (or a drone-port battery buffer)
running once you have aluminium + oil — a drone eats batteries continuously, so
buffer a few hundred so a hiccup doesn't ground the fleet.

> Rule of thumb: **belts for local bulk, trains for far bulk, drones for far
> dribbles of expensive parts.**

---

## Signalling (only once lines share track)

Keep it trivial with two signal types:

- **Block Signals** along open mainline track — they chop the line into blocks so
  trains keep a safe distance. Place one every so often on long straights.
- **Path Signals** at **every junction and every station throat** — they reserve
  a full path through the intersection, preventing deadlocks.

**Rule of thumb:** *Block signals on the open road, Path signals at intersections
and stations.* If you ever get a train stuck nose-to-nose, you used a Block
signal where a Path signal belonged.

For 3+ lines, build a **two-track mainline** (one direction each) so trains never
meet head-on; spokes join it via path-signalled junctions.

---

## Which lines you actually build (Phase 4 → 5)

| Line | Cargo (refined at source) | Feeds |
|------|---------------------------|---------------|
| **Aluminium** | Aluminum Ingot, Casing, Alclad Sheet | ★ Thermal Propulsion Rocket (Cooling Systems / Turbo Motors), Heat Sinks, radio units |
| **Nuclear / Uranium** | Encased cells / processed uranium (or site nuclear out there) | nuclear power; F (Nuclear Pasta) support |
| **Nitrogen** | Packaged Nitrogen *or* finished Cooling Systems | E's Cooling Systems / Fused Frames → ★ Thermal Propulsion Rocket |
| **Oil (if far)** | Plastic, Rubber, packaged Fuel | D, ★ Modular Engine / ACU, plastics everywhere |
| **Bulk ore (optional)** | Extra Iron / Copper ingots if local nodes thin out | ★ Versatile Framework, F's Copper Powder (the copper-powder monster) |

The **copper-powder monster (F, Nuclear Pasta)** is the heaviest single
consumer late (~4,700 copper ingot/min into F at 100%) — if Copperworks (B) can't keep up, a **copper ingot train**
is the cleanest fix (rail ingots in, no module rebuild).

---

## How this shows up in the map

In **`factory-network.html`** Build Map, cross-district links are drawn by
carrier: **teal belts** between the core districts, **dashed orange 🚆 trains**
to/from the far districts (Aluminium / Nuclear / Quantum), and **purple** for
finished parts heading to ★ Project Assembly; raw ore/fluid feeds show as
⛏ belts / 🛢 pipes into each district panel. Use the phase slider to watch the
rail spokes light up in Phase 4–5. Drone lines are a small-parcel layer you add
on top (Tier 8) per the table above.
