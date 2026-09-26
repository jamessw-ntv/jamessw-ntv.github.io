/* Neptune's Pride II: Triton (current "NP4" server, 2024+) — the rule numbers the sandbox runs on.

   confirmed: true  → checked against the Triton Codex (np.ironhelmet.com/help)
                      or real game data (via the open-source Neptune's Pride Agent).
   confirmed: false → a placeholder. Replace `value` (and flip `confirmed`)
                      once we have the real number. Nothing else needs to change.

   Every value can also be tweaked live from the Rules tab; that only affects
   the current game. Edit this file to change the defaults for new games. */
var NP_RULES = [   // `var` so the browser exposes it as window.NP_RULES for sim.js
  // ---- time ----
  { key:"productionTicks", value:24, group:"Time", label:"Ticks per production cycle", confirmed:true,
    note:"Default cycle is 24 ticks (1 tick = 1 hour in a real-time game)." },
  { key:"ticksPerTurn", value:6, group:"Time", label:"Ticks per turn", confirmed:true,
    note:"Turn-based games jump forward 6, 8, 12 or 24 ticks." },

  // ---- economy ----
  { key:"econCredits", value:10, group:"Economy", label:"$ per Economy per cycle", confirmed:true },
  { key:"bankingPerEcon", value:2, group:"Economy", label:"Extra $ per Economy per Banking level", confirmed:true,
    note:"Codex: income = total Economy × (10 + 2 × Banking)." },
  { key:"bankingFlat", value:0, group:"Economy", label:"Classic banking: $ per Banking level", confirmed:true,
    note:"0 in current games. Set 75 (and the line above to 0) for classic banking." },
  { key:"manufacturingBase", value:4, group:"Economy", label:"Ship formula constant", confirmed:true,
    note:"Codex: ships per cycle at a star = Industry × (Manufacturing + 4)." },
  { key:"terraformBonus", value:5, group:"Economy", label:"Resources per Terraforming level", confirmed:true,
    note:"Codex: resources become 5 × level + natural. Terraforming is off by default in current games." },
  { key:"econBaseCost", value:500, group:"Economy", label:"Economy base cost", confirmed:true,
    note:"Next level costs floor(base × (level+1) ÷ resources). Game code: 2.5 × devCost × 100, with devCost 2 (standard). Checked exactly against a real NP4 game (NPA test data, 2024): 19 stars of upgrades + 8 carriers at $25 + $12 per Economy of income reproduce the player's cash to the dollar." },
  { key:"industryBaseCost", value:1000, group:"Economy", label:"Industry base cost", confirmed:true,
    note:"5 × devCost × 100; same formula and check as Economy." },
  { key:"scienceBaseCost", value:4000, group:"Economy", label:"Science base cost", confirmed:true,
    note:"20 × devCost × 100; same formula and check as Economy." },
  { key:"captureCashPerEcon", value:10, group:"Economy", label:"$ per Economy destroyed on capture", confirmed:true,
    note:"Capture destroys Economy ($10 salvage each); Industry and Science survive." },

  // ---- research ----
  { key:"sciencePerTick", value:1, group:"Research", label:"Research points per Science per tick", confirmed:true,
    note:"Codex: one point per science facility each hour." },
  { key:"researchCostBase", value:144, group:"Research", label:"Research cost per level", confirmed:true,
    note:"Next level costs this × current level. 144 in real game data; alien-race traits shift some techs to 128/160." },
  { key:"experimentationRP", value:72, group:"Research", label:"Experimentation RP per level", confirmed:true,
    note:"Each production, level × this goes into a random tech." },

  // ---- carriers ----
  { key:"rangeBase", value:4, group:"Carriers", label:"Range = Hyperspace level + this (ly)", confirmed:true,
    note:"Codex: jumps up to level + 4 ly. Scanning and Range are one tech by default now." },
  { key:"carrierSpeed", value:0.3333, group:"Carriers", label:"Carrier speed (ly per tick)", confirmed:true,
    note:"Game data: 1/24 map unit per tick, and 1 ly = 0.125 map units." },
  { key:"carrierCost", value:25, group:"Carriers", label:"Carrier cost ($)", confirmed:true,
    note:"Real game config: fleetCost 25 (default), no increase per carrier (fleetInc 0)." },

  // ---- scanning ----
  { key:"scanBase", value:3, group:"Scanning", label:"Scanning range = Scanning level + this (ly)", confirmed:false,
    note:"Placeholder until checked against the Codex." },
  { key:"scanShared", value:0, group:"Scanning", label:"Scanning uses the Hyperspace level (1 = yes)", confirmed:false,
    note:"Some current games merge Scanning and Range into one tech." },
  { key:"carriersScan", value:0, group:"Scanning", label:"Carriers scan too (1 = yes)", confirmed:false },

  // ---- combat ----
  { key:"defenderWeaponBonus", value:1, group:"Combat", label:"Defender weapons bonus", confirmed:true,
    note:"Defender shoots first. Everyone not allied with the owner attacks as one team, using the team's best weapons." },

  // ---- diplomacy ----
  { key:"allianceFee", value:0, group:"Diplomacy", label:"Alliance request fee ($)", confirmed:false,
    note:"Real games do log a price on alliance offers (NPA reads it from peace events), but the amount isn't in any data we have." },
  { key:"allianceBreakTicks", value:0, group:"Diplomacy", label:"Ticks from declaring war to war", confirmed:true,
    note:"Codex: default is no warning; games can be set to 24 or 48. Alliances are secret until broken." },

  // ---- victory ----
  { key:"winPercent", value:50, group:"Victory", label:"% of stars to win", confirmed:true },

  // ---- starting position ----
  // Real NP4 game configs (NPA test data). Defaults are the settings a game did NOT list as changed.
  { key:"startCredits", value:500, group:"Start", label:"Starting $", confirmed:true, note:"Config startCash 500 (default)." },
  { key:"startStars", value:6, group:"Start", label:"Starting stars per player", confirmed:true,
    note:"Config startStars 6 (default in 2024; a 2025 game set 4 as a custom value)." },
  { key:"starsPerPlayer", value:24, group:"Start", label:"Stars per player in the galaxy", confirmed:true,
    note:"Config starsPerPlayer 24 (default). Used when a new game doesn't pick its own." },
  { key:"startShips", value:10, group:"Start", label:"Starting ships per star", confirmed:true,
    note:"Config startShips 10, on every starting star (checked against a player's fleet at tick 27)." },
  { key:"startCarriers", value:1, group:"Start", label:"Free starting carriers", confirmed:true,
    note:"Inferred from real game cash: a player owned 9 carriers but had paid for 8." },
  { key:"startEcon", value:10, group:"Start", label:"Home Economy", confirmed:true, note:"Config startInfEco 10; home star only." },
  { key:"startIndustry", value:5, group:"Start", label:"Home Industry", confirmed:true, note:"Config startInfInd 5; home star only." },
  { key:"startScience", value:2, group:"Start", label:"Home Science", confirmed:true, note:"Config startInfSci 2; home star only." },
  { key:"startTech", value:1, group:"Start", label:"Starting level of every tech", confirmed:true, note:"Config startTech* 1." },
  { key:"homeResources", value:50, group:"Start", label:"Home star natural resources", confirmed:true, note:"Every home star in real data has 50." },
  { key:"minResources", value:1, group:"Start", label:"Lowest natural resources", confirmed:true,
    note:"Real galaxies spread evenly from 1 to 50 (quartiles 1 / 15 / 25 / 37 / 50 over 186 stars)." },
  { key:"maxResources", value:50, group:"Start", label:"Highest natural resources", confirmed:true },
];
if (typeof module !== "undefined") module.exports = NP_RULES;
