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
- **Play an empire**: pick a seat under *You play* in New game, or take over any empire
  mid-game with `🎮 Play as…` in the header (or Admin → Bots). The others stay bots. Your orders
  are the real game's: buy Economy / Industry / Science at a star (or bulk-buy at your cheapest
  stars), choose research, build carriers and send ships to any star in jump range (pick it from
  the list or click it on the map), and accept, decline or propose alliances or declare war on
  an ally. Orders are given between turns; `◀ Back` undoes them with the turn.
- **⚙ Game menu** (top bar, key `G`), usable in Player view: restart from turn 0 on the same
  galaxy, start a new galaxy (type, size, empire count, your seat), switch seats, tick speed and
  ticks per turn, pause rules, house rules (unbreakable alliances, no notice, coalition wins,
  shared scanning, betrayal), export, and a list of every key. It reveals nothing Player view hides.
- **Player / Admin view** (header switch, key `V`): *Player* shows only what your empire can
  scan, hides the bots' personalities, feelings, cash, research and other empires' secret
  alliances, and drops the Admin and Alliances tabs (Rules become read-only). *Admin* shows
  everything with all the god powers, while you keep playing.
- **See as (fog of war)**: chips above the map show the galaxy through one or more empires'
  scanning. Outside it you see who owns a star but not its ships, infrastructure or carriers,
  and other empires' alliances stay secret. Allies share scanning (toggle in Admin).
- **Galaxy types** (New game): *Hex grid* (the real default: homes on a hex lattice ~12 ly apart, open frontier around it), *Blob* (a real type: one round cloud), and two sandbox shapes, *Islands* (clusters joined by single lanes) and *Scattered*. Every map is checked at starting range: all homes can reach each other, and isolated stars get a thin lane of stars across the narrowest gap, so some places have only one hyperspace route in. The log's first line counts the chokepoint lanes and the stars you can't reach until Range 3.
- **Galaxy**: zoomable map at real Triton scale (~2 ly between stars, 5-ly grid, scale bar). Labels appear as you zoom (ships below, E·I·S above). Click a star (infrastructure, defence, incoming fleets with predicted outcome, who can reach it), a carrier (route, ETA, predicted battle) or an empire (economy, research, tech, allies, feelings).
- **Routes & supply lines**: select a carrier (arrows on the map, or the carrier links in a
  star's Defence list) and *Plan a route*: tap stars on the map to add stops, each with the
  real game's 8 waypoint orders (Do nothing, Collect all, Drop all, Collect X, Drop X, Collect
  all but X, Drop all but X, Garrison X) and a wait in ticks. Tick *Loop* (or tap stop 1 / the
  starting star again) for a patrol that repeats forever. Actions only happen at the carrier
  owner's own stars and a carrier always keeps 1 ship, as in the real game. Every bot also runs one looping
  supply line (the Economist two): collect all at one or two interior stars, drop all at a
  threatened frontier star; lines wind down when a stop is lost or the frontier goes quiet.
- **Ship transfers**: a star's inspector has the real game's transfer screen under *Ships here*:
  type a number in a carrier's box, or use −10 / −5 / −1 / +1 / +5 / +10 / *Take all* / *Leave 1*,
  to move ships between the garrison and each of your carriers in orbit. *⚖ Split evenly* shares
  every ship there evenly between the star and your carriers (the real game's even split, no new
  carrier); *New carrier* buys one with 1 ship; *Merge idle* folds idle carriers into one. At
  someone else's star only carrier-to-carrier moves work; a carrier keeps 1 ship.
- **Routes**: *Route…* on a carrier row (or *➜ Route from here*, or `A`) goes straight to tapping
  stops on the map; tap the start again to loop, and Done saves it. Every stop then shows the 8
  real orders as buttons (Nothing, Collect all, Drop all, Leave X on star, Collect X, Drop X,
  Collect all but X, Drop all but X) with the X amount and a wait, saved as you tap, plus a line
  saying roughly what it will pick up or drop. New stops at your own stars default to Collect all
  and the last new one to Drop all. A loop that starts at a stop runs that stop's order straight
  away. Keys: `A` add stops, `L` loop, `Backspace` undo last stop, `Enter` save, `Esc` stop picking
  / cancel, `[` `]` step through the carriers at a star. Buttons are 40 px on touch screens.
- **Alliances**: alliance web, opinion matrix (what each bot thinks of each other),
  alliance history (formed, ended, who betrayed whom), treachery stats.
- **Trade** (Overview → *Trade*, when you play an empire): share a tech you lead in, one level at a
  time for their new level × $25 (the real game's share_tech), or send any amount of cash. Gifts warm
  the receiver's opinion of you. Bots now and then share a tech with a smaller ally they like
  (house rule *Bots share techs with allies* in ⚙ Game).
- **Inbox: talking with the bots** (✉ on the map, key `I`, or ✉ Message on an empire's card), when you
  play an empire. No free text and no AI service: you pick a request (a truce for 1–4 days, leave one of
  your stars alone, attack a third empire with me, trade a tech for a tech and/or cash, what do you think
  of X or of me, an alliance) and the bot answers at once in its persona's voice, from what it really
  thinks of you, your relative strength, its allies and your record. Bots write first too: alliance
  offers, warnings when they see your carriers coming, threats or truce pleas after you attack, asks to
  join a war on an empire they hate, asks for a tech you lead in, thanks for gifts, and how a joint war
  went. Ask cards have Yes / No buttons and lapse after a day. Promises bind the bot's war plans (no
  attacking a truce partner or a spared star; a joint-war target is fair game), and each turn a bot may
  break one by its treachery: honest ones say so, treacherous ones break it quietly and you find out when
  they attack (Admin view shows it at once). Break a truce yourself and that bot trusts your next one less.
- **Turn history** (🕘 on the map, key `H`): look back at any earlier turn this session with a
  slider; ← → step. Look-only: *Play from here* (or editing anything) throws the later turns away.
- **Battles** flash sparks and float each side's losses (−N ⚔ −M) during playback.
- **Keyboard shortcuts**: `?` or ☰ → Keyboard shortcuts.
- **Empires**: leaderboard with tech levels, and charts over time.
- **Log**: filterable events (diplomacy, combat, expansion, orders, research).
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

Warp gates: buy one at any of your stars; a jump between two gated stars (whoever owns
them) flies at carrier speed × √(Hyperspace + 3), as in NP4. The gate price (20000 ÷
resources) is a guess; bots buy gates once rich, Economists and Expansionists most.

Battle forecasts (star and carrier panels, and before you launch) play the ticks forward on
a copy of the game, so every other arrival and production on the way counts, like NPA's.
They can't know orders given on later turns. In Player view the copy holds only carriers
you can see.

## Simplifications (for now)
- Bots see everything (no dark galaxy), so Scanning does nothing yet.
- Tech trade cost per level ($25) and "trade only in scanning" (off) are guesses at the real defaults.
- Terraforming and a separate Scanning tech are off, like a default real game (`terraformOn`
  and `scanShared` in the Rules tab turn them back on). Players (and bots) can queue a
  "research next" tech, which takes over when the current level completes.
- Allied carriers parked at an ally's star stay there as guards.
- Up to 6 empires (one per hub colour).
- Messages are structured requests, not free text, and only between you and the bots (bots don't
  message each other; their bot-to-bot diplomacy is the existing alliance logic). The acceptance
  formulas and promise lengths are sandbox inventions, not the real game's.

## Personalities
Warlord, Turtle, Diplomat, Opportunist, Economist, Expansionist. Each has
aggression, treachery, how much it needs to like you before allying, how many
allies it wants, how it spends, and what it researches (`PERSONAS` in `sim.js`).
**Personalities off:** untick *Bot personalities* in ⚙ Game → New game (or press
*Personalities off* in Admin) and every bot plays **Standard**, one balanced all-rounder.
With the box ticked you can also choose which of the six may appear.

**Fairness.** In every galaxy type the homes sit evenly round a ring, so no seat starts in
the middle or on an edge (Blob and Scattered used to hand the first seat the centre).
`node neptunes-sandbox/tools/balance.js` plays ~1,400 bot games on all CPU cores and prints
win share by seat, personality, empire count and galaxy (×1.00 = a fair share). On
2026-09-27, 1,440 games (3/4/6 empires × 4 galaxies, personalities rotated and shuffled):
every seat ×0.91–1.12, every personality ×0.95–1.10. Galaxy types still have flavour:
Islands favours Economist and Turtle, open maps favour Warlord.
Opinions drift each production: shared borders breed tension, shared enemies and
alliances breed trust, and everyone turns on a runaway leader.
