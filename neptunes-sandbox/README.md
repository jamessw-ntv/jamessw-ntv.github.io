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
Confirmed from the Triton Codex / wiki: 24-tick production, $10 per Economy,
$75 × Banking, ships = Industry × (Manufacturing + 5) per cycle, range =
Hyperspace + 3 ly, Terraforming +5 resources/level, Experimentation 72 RP × level,
defender +1 weapons and shoots first, capture destroys Economy for $10 each,
alliances secret until broken and a 24-tick notice to break, win at 50% of stars,
turn jumps of 6/8/12/24 ticks.

Placeholders (to fill in): research costs, science output, carrier speed and
cost, infrastructure cost formula (from the original NP), alliance fee, starting
position.

## Simplifications (for now)
- Bots see everything (no dark galaxy), so Scanning does nothing yet.
- No tech trading or cash gifts between players yet.
- Allied carriers parked at an ally's star stay there as guards.
- Up to 6 empires (one per hub colour).

## Personalities
Warlord, Turtle, Diplomat, Opportunist, Economist, Expansionist. Each has
aggression, treachery, how much it needs to like you before allying, how many
allies it wants, how it spends, and what it researches (`PERSONAS` in `sim.js`).
Opinions drift each production: shared borders breed tension, shared enemies and
alliances breed trust, and everyone turns on a runaway leader.
