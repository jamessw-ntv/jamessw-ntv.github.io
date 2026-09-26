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
  { key:"econBaseCost", value:500, group:"Economy", label:"Economy base cost", confirmed:false,
    note:"Cost = floor((level+1) × base ÷ (resources+5)). Formula found is from the original NP." },
  { key:"industryBaseCost", value:500, group:"Economy", label:"Industry base cost", confirmed:false },
  { key:"scienceBaseCost", value:5000, group:"Economy", label:"Science base cost", confirmed:false },
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
  { key:"carrierCost", value:25, group:"Carriers", label:"Carrier cost ($)", confirmed:false,
    note:"$25 in the original NP." },

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
    note:"The Codex describes request + accept and mentions no fee." },
  { key:"allianceBreakTicks", value:0, group:"Diplomacy", label:"Ticks from declaring war to war", confirmed:true,
    note:"Codex: default is no warning; games can be set to 24 or 48. Alliances are secret until broken." },

  // ---- victory ----
  { key:"winPercent", value:50, group:"Victory", label:"% of stars to win", confirmed:true },

  // ---- starting position ----
  { key:"startCredits", value:500, group:"Start", label:"Starting $", confirmed:false },
  { key:"startStars", value:3, group:"Start", label:"Starting stars per player", confirmed:false },
  { key:"startShips", value:10, group:"Start", label:"Starting ships per star", confirmed:false },
  { key:"startEcon", value:5, group:"Start", label:"Home Economy", confirmed:false },
  { key:"startIndustry", value:5, group:"Start", label:"Home Industry", confirmed:false },
  { key:"startScience", value:1, group:"Start", label:"Home Science", confirmed:false },
  { key:"startTech", value:1, group:"Start", label:"Starting level of every tech", confirmed:false },
  { key:"homeResources", value:50, group:"Start", label:"Home star natural resources", confirmed:false },
];
if (typeof module !== "undefined") module.exports = NP_RULES;
