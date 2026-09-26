# Neptune's Pride — Bot Sandbox

Bots play a faithful-as-possible copy of *Neptune's Pride II: Triton* (Iron Helmet
Games). You step through it a turn at a time, rewind, and study the diplomacy.

## What's in it
- **Turns**: `Next turn` runs every bot's orders, then plays the turn's ticks back one at a
  time: carriers glide between ticks, stars change hands as they land, battles flash, and a
  "This turn" feed lists what happened (click a row to jump to the star). `Skip` finishes the
  turn instantly; tick speed is Slow / Normal / Fast / Instant. Playback can pause itself on a
  capture, betrayal, new alliance or elimination (Admin). `◀ Back` rewinds a whole turn.
  Keys: `N`/→ next, `B`/← back, `Space` auto-play (or Continue after a pause).
- **See as (fog of war)**: chips above the map show the galaxy through one or more empires'
  scanning. Outside it you see who owns a star but not its ships, infrastructure or carriers,
  and other empires' alliances stay secret. Allies share scanning (toggle in Admin).
- **Galaxy types** (New game): *Hex grid* (the real default: homes on a hex lattice ~12 ly apart, open frontier around it), *Blob* (a real type: one round cloud), and two sandbox shapes, *Islands* (clusters joined by single lanes) and *Scattered*. Every map is checked at starting range: all homes can reach each other, and isolated stars get a thin lane of stars across the narrowest gap, so some places have only one hyperspace route in. The log's first line counts the chokepoint lanes and the stars you can't reach until Range 3.
- **Galaxy**: zoomable map at real Triton scale (~2 ly between stars, 5-ly grid, scale bar). Labels appear as you zoom (ships below, E·I·S above). Click a star (infrastructure, defence, incoming fleets with predicted outcome, who can reach it), a carrier (route, ETA, predicted battle) or an empire (economy, research, tech, allies, feelings).
- **Alliances**: alliance web, opinion matrix (what each bot thinks of each other),
  alliance history (formed, ended, who betrayed whom), treachery stats.
- **Empires**: leaderboard with tech levels, and charts over time.
- **Log**: filterable events (diplomacy, combat, expansion, research).
- **Admin**: force / lock / unlock / break / ban alliances, "every alliance is
  unbreakable", betrayal slider, change bot personalities, give cash or ships,
  new game (seed, seats), export/import.
- **Rules**: every number, flagged confirmed or placeholder, editable live.

## Rules — what's confirmed
Checked against the Triton Codex (np.ironhelmet.com/help — the current "NP4"
server) and real game data from the open-source Neptune's Pride Agent:
- 24-tick production; income = total Economy × (10 + 2 × Banking)
- ships per cycle = Industry × (Manufacturing + 4); 1 research point per Science per tick
- research costs 144 × current level; Experimentation gives 72 × level each production
- range = Hyperspace + 4 ly; carriers move 1/3 ly per tick
- combat: defender team (owner + formal allies) gets +1 weapons and shoots first;
  everyone else attacks as one team with its best weapons; the biggest attacker takes the star
- capture destroys Economy ($10 salvage each); Industry and Science survive
- alliances: secret until broken, announced when broken, **no notice by default** (24/48 optional)
- win at 50% of stars; turn jumps of 6/8/12/24 ticks; tick order move → combat → build → research → production

- upgrade cost = floor(base × (level + 1) ÷ resources), base $500 / $1000 / $4000 for
  Economy / Industry / Science; carriers $25; checked to the dollar against a real game's cash
- start: $500, 6 stars with 10 ships each, 1 free carrier, home star 10 / 5 / 2 infrastructure
  and 50 resources, all techs at 1, 24 stars per player, other stars 1–50 resources
  (real NP4 game configs in the NPA test data)

Still a placeholder: the alliance fee (real games log a price on alliance offers; the
amount isn't in any data we have). Galaxy shapes are modelled on real maps' statistics
(nearest-star distances, how much is reachable at start range), not the game's own code.

## Simplifications (for now)
- Bots see everything (no dark galaxy), so Scanning does nothing yet.
- No tech trading or cash gifts between players yet (the real game has both).
- Terraforming is on (it's off by default in current real games); Scanning is merged into Range.
- Allied carriers parked at an ally's star stay there as guards.
- Up to 6 empires (one per hub colour).

## Personalities
Warlord, Turtle, Diplomat, Opportunist, Economist, Expansionist. Each has
aggression, treachery, how much it needs to like you before allying, how many
allies it wants, how it spends, and what it researches (`PERSONAS` in `sim.js`).
Opinions drift each production: shared borders breed tension, shared enemies and
alliances breed trust, and everyone turns on a runaway leader.
