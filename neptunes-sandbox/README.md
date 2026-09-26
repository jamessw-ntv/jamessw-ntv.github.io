# Neptune's Pride — Bot Sandbox

Bots play a faithful-as-possible copy of *Neptune's Pride II: Triton* (Iron Helmet
Games). You step through it a turn at a time, rewind, and study the diplomacy.

## What's in it
- **Turns**: `Next turn` processes every bot's orders, then N ticks (default 6).
  `◀ Back` rewinds; changing anything after a rewind branches history.
  Keys: `N`/→ next, `B`/← back.
- **Galaxy**: map with ownership, carriers in flight, alliance links; click a star.
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

Still placeholders: infrastructure cost formula (from the original NP), carrier
cost, alliance fee (Codex mentions none), starting position.

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
