/* Neptune's Pride II: Triton — the rule numbers the sandbox runs on.

   confirmed: true  → checked against the Triton Codex / official wiki.
   confirmed: false → a placeholder. Replace `value` (and flip `confirmed`)
                      once we have the real number. Nothing else needs to change.

   Every value can also be tweaked live from the Rules tab; that only affects
   the current game. Edit this file to change the defaults for new games. */
const NP_RULES = [
  // ---- time ----
  { key:"productionTicks", value:24, group:"Time", label:"Ticks per production cycle", confirmed:true,
    note:"Default cycle is 24 ticks (1 tick = 1 hour in a real-time game)." },
  { key:"ticksPerTurn", value:6, group:"Time", label:"Ticks per turn", confirmed:true,
    note:"Turn-based games jump forward 6, 8, 12 or 24 ticks." },

  // ---- economy ----
  { key:"econCredits", value:10, group:"Economy", label:"$ per Economy per cycle", confirmed:true },
  { key:"bankingCredits", value:75, group:"Economy", label:"$ per Banking level per cycle", confirmed:true },
  { key:"manufacturingBase", value:5, group:"Economy", label:"Ship formula constant", confirmed:true,
    note:"Ships per cycle at a star = Industry × (Manufacturing + this)." },
  { key:"terraformBonus", value:5, group:"Economy", label:"Resources per Terraforming level", confirmed:true },
  { key:"econBaseCost", value:500, group:"Economy", label:"Economy base cost", confirmed:false,
    note:"Cost = floor((level+1) × base ÷ (resources+5)). Formula found is from the original NP." },
  { key:"industryBaseCost", value:500, group:"Economy", label:"Industry base cost", confirmed:false },
  { key:"scienceBaseCost", value:5000, group:"Economy", label:"Science base cost", confirmed:false },
  { key:"captureCashPerEcon", value:10, group:"Economy", label:"$ per Economy destroyed on capture", confirmed:true,
    note:"Capturing a star destroys its Economy; the attacker is paid per point." },

  // ---- research ----
  { key:"sciencePerTick", value:1, group:"Research", label:"Research points per Science per tick", confirmed:false },
  { key:"researchCostBase", value:144, group:"Research", label:"Research cost per level", confirmed:false,
    note:"Cost of next level = this × current level." },
  { key:"experimentationRP", value:72, group:"Research", label:"Experimentation RP per level", confirmed:true,
    note:"Each production, level × this goes into a random tech." },

  // ---- carriers ----
  { key:"rangeBase", value:3, group:"Carriers", label:"Range = Hyperspace level + this (ly)", confirmed:true },
  { key:"carrierSpeed", value:0.3333, group:"Carriers", label:"Carrier speed (ly per tick)", confirmed:false },
  { key:"carrierCost", value:25, group:"Carriers", label:"Carrier cost ($)", confirmed:false,
    note:"$25 in the original NP." },

  // ---- combat ----
  { key:"defenderWeaponBonus", value:1, group:"Combat", label:"Defender weapons bonus", confirmed:true,
    note:"Defender also shoots first, so ties go to the defender." },

  // ---- diplomacy ----
  { key:"allianceFee", value:50, group:"Diplomacy", label:"Alliance request fee ($)", confirmed:false },
  { key:"allianceBreakTicks", value:24, group:"Diplomacy", label:"Ticks from declaring war to war", confirmed:true,
    note:"Alliances are secret when made, revealed to everyone when broken." },

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
