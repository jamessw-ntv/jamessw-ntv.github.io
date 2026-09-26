/* Neptune's Pride sandbox — the game engine and the bots.

   Pure logic, no DOM: the whole game is one plain JSON-able object `S`, so a
   turn can be snapshotted (rewind), saved, exported, and run under Node for
   testing. Rule numbers live in rules.js; everything here reads `S.rules`. */
(function (root) {
"use strict";

const RULE_LIST = root.NP_RULES || (typeof require !== "undefined" ? require("./rules.js") : []);
if (!RULE_LIST.length) throw new Error("rules.js must load before sim.js");

const TECHS = ["scanning", "range", "terraforming", "experimentation", "weapons", "banking", "manufacturing"];
const TECH_LABEL = { scanning:"Scanning", range:"Hyperspace range", terraforming:"Terraforming",
  experimentation:"Experimentation", weapons:"Weapons", banking:"Banking", manufacturing:"Manufacturing" };

/* Player seats. Colours are hub.css tokens, in an order checked for colour-blind
   separation; names start with a distinct letter so identity is never colour-only. */
const SEATS = [
  { name:"Azure",   color:"--blue"   },
  { name:"Blaze",   color:"--orange" },
  { name:"Violet",  color:"--purple" },
  { name:"Grove",   color:"--green"  },
  { name:"Crimson", color:"--red"    },
  { name:"Sol",     color:"--yellow" },
];

/* Bot personalities.
   aggr      how keen to attack other players (0–1)
   treach    base chance of betraying an ally
   allyAt    opinion needed before proposing / accepting an alliance
   maxAllies how many alliances it wants
   keep      share of ships held back at home stars
   spend     how credits are split between economy / industry / science
   research  tech priorities, first = favourite */
const PERSONAS = {
  warlord:      { label:"Warlord",      aggr:.90, treach:.50, allyAt:35, maxAllies:1, keep:.15,
                  spend:{ econ:.30, industry:.55, science:.15 }, research:["weapons","manufacturing","range"],
                  blurb:"Builds ships, attacks early, allies only for convenience." },
  turtle:       { label:"Turtle",       aggr:.20, treach:.05, allyAt:15, maxAllies:2, keep:.55,
                  spend:{ econ:.45, industry:.35, science:.20 }, research:["weapons","banking","terraforming"],
                  blurb:"Defends what it has, rarely strikes first, very loyal." },
  diplomat:     { label:"Diplomat",     aggr:.55, treach:.02, allyAt:5,  maxAllies:3, keep:.30,
                  spend:{ econ:.40, industry:.40, science:.20 }, research:["weapons","range","banking"],
                  blurb:"Collects allies and keeps its word." },
  opportunist:  { label:"Opportunist",  aggr:.65, treach:.45, allyAt:10, maxAllies:2, keep:.25,
                  spend:{ econ:.35, industry:.45, science:.20 }, research:["weapons","range","manufacturing"],
                  blurb:"Friendly until you look weak." },
  economist:    { label:"Economist",    aggr:.45, treach:.15, allyAt:10, maxAllies:2, keep:.35,
                  spend:{ econ:.45, industry:.40, science:.15 }, research:["banking","terraforming","experimentation","manufacturing"], gates:.35,
                  blurb:"Grows the economy first, fights later." },
  expansionist: { label:"Expansionist", aggr:.60, treach:.25, allyAt:15, maxAllies:2, keep:.20,
                  spend:{ econ:.40, industry:.45, science:.15 }, research:["range","weapons","manufacturing","terraforming"], gates:.3,
                  blurb:"Grabs empty stars as fast as range allows." },
};
/* How many looping supply lines (interior stars → frontier) each persona runs. */
const SUPPLY_LINES = { warlord:1, turtle:1, diplomat:1, opportunist:1, economist:2, expansionist:1 };
const DEFAULT_LINEUP = ["warlord", "diplomat", "opportunist", "turtle", "economist", "expansionist"];

const DEFAULT_SETTINGS = {
  lockAll: false,        // every new alliance is born locked (unbreakable)
  betrayal: 1,           // multiplier on every bot's treachery (0 = nobody ever betrays)
  instantBreak: false,   // skip the 24-tick notice when an alliance is broken
  coalitionWin: true,    // a locked bloc holding the win % of stars wins together
  maxTurns: 400,         // hard stop; most stars wins
  banned: [],            // "a-b" pairs the bots may never ally
  allyVision: true,      // formal allies share scanning (fog of war)
};

const STAR_A = ["Al","Be","Ca","De","Ep","Fo","Ga","He","Io","Ka","Le","Mi","No","Or","Pa","Qu","Ri","Sa","Te","Ul","Ve","Wo","Xe","Ya","Ze"];
const STAR_B = ["cor","dra","lis","mar","nox","phi","ria","sol","tan","vex","rin","gol","dus","lyn","ter","bos","kai","mon"];

/* ---------------- basics ---------------- */
function defaultRules() { const r = {}; RULE_LIST.forEach(x => r[x.key] = x.value); return r; }
function rand(S) {                      // mulberry32; state lives in S so rewinds replay exactly
  let t = S.rs = (S.rs + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (S, arr) => arr[Math.floor(rand(S) * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pairKey = (a, b) => a < b ? a + "-" + b : b + "-" + a;
const turnOf = S => S.turn;

function log(S, type, text, players, star) {
  const e = { tick:S.tick, turn:S.turn, type, text, players:players || [] };
  if (star != null) e.star = star;                    // where it happened, for map effects
  S.events.push(e);
  if (S.events.length > 3000) S.events.splice(0, S.events.length - 3000);
}

/* ---------------- game creation ---------------- */
function newGame(opts) {
  opts = opts || {};
  const rules = Object.assign(defaultRules(), opts.rules || {});
  const lineup = (opts.lineup || DEFAULT_LINEUP).slice(0, SEATS.length);
  const seed = (opts.seed >>> 0) || 1;
  const S = {
    v:1, seed, rs:seed, tick:0, turn:0, rules,
    settings: Object.assign({}, DEFAULT_SETTINGS, opts.settings || {}),
    players:[], stars:[], carriers:[], alliances:[], events:[], stats:[], rel:[],
    winner:null, nextId:1, offers:[],
  };
  S.settings.banned = (S.settings.banned || []).slice();

  // players
  lineup.forEach((persona, i) => {
    const tech = {};
    TECHS.forEach(t => tech[t] = { level:rules.startTech, rp:0 });
    S.players.push({ id:i, name:SEATS[i].name, color:SEATS[i].color, persona,
      credits:rules.startCredits, tech, researching:PERSONAS[persona].research[0],
      alive:true, outTurn:null, human:i === opts.human });
  });
  const n = S.players.length;
  S.rel = S.players.map(a => S.players.map(b => a === b ? 0 :
    Math.round((rand(S) - .5) * 10 + (a.persona === "diplomat" ? 10 : 0) + (a.persona === "warlord" ? -5 : 0))));

  // stars, homes and starting empires (see "galaxy generation" below)
  const perPlayer = clamp(Math.round(opts.starsPerPlayer || rules.starsPerPlayer), 4, 40);
  const homes = buildGalaxy(S, n, perPlayer, GALAXY_TYPES[opts.galaxy] ? opts.galaxy : DEFAULT_GALAXY);
  homes.forEach((h, i) => {
    Object.assign(h, { owner:i, res:rules.homeResources, econ:rules.startEcon,
      industry:rules.startIndustry, science:rules.startScience, ships:rules.startShips });
    S.players[i].home = h.id;
    const near = S.stars.filter(s => s.owner < 0).sort((a, b) => dist(a, h) - dist(b, h));
    near.slice(0, Math.max(0, rules.startStars - 1)).forEach(s => { s.owner = i; s.ships = rules.startShips; });
    for (let k = 0; k < rules.startCarriers; k++) S.carriers.push({ id:S.nextId++, owner:i, ships:0, at:h.id });
  });

  const G = S.galaxy, pl = (k, w) => `${k} ${w}${k === 1 ? "" : "s"}`;
  log(S, "system", `New ${GALAXY_TYPES[G.type].label.toLowerCase()} galaxy: ${S.stars.length} stars, ${n} empires, seed ${seed}. ` +
    `${pl(G.chokepoints, "chokepoint lane")}` + (G.pocketStars ? `, ${pl(G.pocketStars, "star")} out of reach until Range ${G.pocketRange}.` : "."));
  recordStats(S);
  return S;
}

/* ---------------- galaxy generation ----------------
   Real NP4 games pick a "starfield". Two are seen in real game data (NPA test fixtures):
   `hexgrid` (the default: homes on a hex lattice ~12 ly apart, stars scattered around them,
   thinning into a sparse frontier) and `mega_blob` (one big disc). `islands` and `scattered`
   are sandbox inventions. Whatever the shape, the map is then checked at starting range:
   every home must reach every other home, and far-off stars are joined by thin lanes,
   so there are still places where one hyperspace jump is the only way in. */
const DEFAULT_GALAXY = "hexgrid";
const GALAXY_TYPES = {
  hexgrid:   { label:"Hex grid",  real:true,  blurb:"Real default. Homes on a hex lattice ~12 ly apart; open frontier around the edge." },
  mega_blob: { label:"Blob",      real:true,  blurb:"Real type. One round cloud of stars, homes spread through it." },
  islands:   { label:"Islands",   real:false, blurb:"Sandbox. Star clusters joined by single hyperspace lanes: lots of chokepoints." },
  scattered: { label:"Scattered", real:false, blurb:"Sandbox. Stars dropped evenly in a square (the old sandbox map)." },
};
const MIN_GAP = 1;            // ly; closest pair of stars (real games: ~0.6)
const HOME_SPACING = 12;      // ly between neighbouring homes (hexgrid, homeStarDistance 3)

function buildGalaxy(S, n, perPlayer, type) {
  const total = n * perPlayer, R = S.rules;
  const startRange = R.rangeBase + R.startTech;
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rand(S); return (u - 2) / .577; };
  const pts = [];
  const tryAdd = (x, y) => {
    if (!isFinite(x) || pts.some(p => Math.abs(p.x - x) < MIN_GAP && dist(p, { x, y }) < MIN_GAP)) return null;
    const p = { x, y }; pts.push(p); return p;
  };
  const fill = (count, sampler) => { let g = 0; while (pts.length < count && g++ < count * 300) { const q = sampler(); tryAdd(q.x, q.y); } };
  let homePts = [];

  if (type === "hexgrid") {
    // the n lattice points closest to the centre, then stars scattered around random homes
    const lat = [];
    for (let r = -4; r <= 4; r++) for (let q = -4; q <= 4; q++)
      lat.push({ x:(q + r / 2) * HOME_SPACING, y:r * HOME_SPACING * Math.sqrt(3) / 2 });
    const off = { x:(rand(S) - .5) * .1, y:(rand(S) - .5) * .1 };   // break ties differently per seed
    lat.sort((a, b) => dist(a, off) - dist(b, off));
    // 3–6 empires sit evenly round the first ring: whoever got the centre point was surrounded and almost never won
    let chosen = lat.slice(0, n);
    if (n >= 3 && n <= 6) {
      const ring = lat.slice(1, 7).sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
      chosen = Array.from({ length:n }, (_, i) => ring[Math.round(i * 6 / n) % 6]);
    }
    homePts = chosen.map(p => tryAdd(p.x + gauss() * .8, p.y + gauss() * .8));
    const spread = Math.sqrt(perPlayer * 22 / Math.PI) * .58;
    fill(total, () => { const h = pick(S, homePts); return { x:h.x + gauss() * spread, y:h.y + gauss() * spread }; });
  } else if (type === "mega_blob") {
    const rad = Math.sqrt(total * 20 / Math.PI);
    fill(total, () => { const a = rand(S) * Math.PI * 2, r = rad * Math.pow(rand(S), .6); return { x:Math.cos(a) * r, y:Math.sin(a) * r }; });
    homePts = spreadOut(S, pts.filter(p => Math.hypot(p.x, p.y) < rad * .75), n);
  } else if (type === "islands") {
    // one island per empire on a ring, one neutral island in the middle, 7+ ly of empty space between
    const isl = Math.max(3.2, Math.sqrt(perPlayer * 6 / Math.PI));
    const ringR = Math.max((2 * isl + 7) / (2 * Math.sin(Math.PI / n)), 2 * isl + 7);
    const spin = rand(S) * Math.PI * 2;
    const centres = [];
    for (let i = 0; i < n; i++) centres.push({ x:Math.cos(spin + i * 2 * Math.PI / n) * ringR, y:Math.sin(spin + i * 2 * Math.PI / n) * ringR });
    homePts = centres.map(c => tryAdd(c.x, c.y));
    const each = Math.floor(total * .82 / n);
    centres.forEach((c, i) => fill(n + (i + 1) * each, () => { const a = rand(S) * Math.PI * 2, r = isl * Math.sqrt(rand(S)); return { x:c.x + Math.cos(a) * r, y:c.y + Math.sin(a) * r }; }));
    const hub = isl * 1.2;
    fill(total, () => { const a = rand(S) * Math.PI * 2, r = hub * Math.sqrt(rand(S)); return { x:Math.cos(a) * r, y:Math.sin(a) * r }; });
    // no lanes drawn here: the connectivity pass below bridges each gap once, at its narrowest point
  } else {                                                          // scattered
    const side = Math.sqrt(total * 22);
    fill(total, () => ({ x:rand(S) * side, y:rand(S) * side }));
    homePts = spreadOut(S, pts.filter(p => p.x > side * .12 && p.x < side * .88 && p.y > side * .12 && p.y < side * .88), n);
  }

  // a chain of stars from a to b, each hop within `hop` ly: the "one hyperspace line"
  function lane(a, b, hop) {
    const d = dist(a, b), steps = Math.ceil(d / (hop * .85));
    for (let k = 1; k < steps; k++) {
      const f = k / steps, j = hop * .12;
      tryAdd(a.x + (b.x - a.x) * f + (rand(S) - .5) * j, a.y + (b.y - a.y) * f + (rand(S) - .5) * j);
    }
  }

  // every home needs room to grow: at least startStars - 1 stars within start range
  homePts.forEach(h => {
    let g = 0;
    while (pts.filter(p => p !== h && dist(p, h) <= startRange).length < R.startStars + 1 && g++ < 200) {
      const a = rand(S) * Math.PI * 2, r = 1.5 + rand(S) * (startRange - 1.8);
      tryAdd(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r);
    }
  });

  // connectivity: every home must reach the others at starting range, and nothing may be
  // further than Range 3 from the rest. Gaps get a lane of stars across the narrowest point.
  // everything joins the component at the middle of the map, so no seat becomes the crossroads
  const cx = pts.reduce((t, p) => t + p.x, 0) / pts.length, cy = pts.reduce((t, p) => t + p.y, 0) / pts.length;
  const centre = pts.reduce((b, p) => Math.hypot(p.x - cx, p.y - cy) < Math.hypot(b.x - cx, b.y - cy) ? p : b);
  const joinAt = (hop, mustJoin) => {
    for (let guard = 0; guard < 40; guard++) {
      const comp = components(pts, hop);
      const main = comp[pts.indexOf(centre)];
      const cut = pts.map((p, i) => i).filter(i => comp[i] !== main && mustJoin(i, comp));
      if (!cut.length) return;
      const target = comp[cut[0]];
      let best = null, bd = Infinity;
      pts.forEach((p, i) => { if (comp[i] !== target) return;
        pts.forEach((q, j) => { if (comp[j] === main) { const d = dist(p, q); if (d < bd) { bd = d; best = [p, q]; } } }); });
      lane(best[0], best[1], hop);
    }
  };
  joinAt(startRange, (i, comp) => homePts.some(h => comp[pts.indexOf(h)] === comp[i]));
  const pocketRange = R.startTech + 2;
  joinAt(R.rangeBase + pocketRange, () => true);

  // shift onto the map canvas, name the stars, give them resources
  const pad = 3, minX = Math.min(...pts.map(p => p.x)), minY = Math.min(...pts.map(p => p.y));
  const names = new Set();
  pts.forEach((p, i) => {
    let name; do { name = pick(S, STAR_A) + pick(S, STAR_B); } while (names.has(name) && names.size < STAR_A.length * STAR_B.length);
    names.add(name);
    S.stars.push({ id:i, name, x:+(p.x - minX + pad).toFixed(2), y:+(p.y - minY + pad).toFixed(2),
      res: R.minResources + Math.floor(rand(S) * (R.maxResources - R.minResources + 1)),
      owner:-1, econ:0, industry:0, science:0, ships:0, frac:0 });
  });
  S.width = Math.max(...S.stars.map(s => s.x)) + pad;
  S.height = Math.max(...S.stars.map(s => s.y)) + pad;

  // stats the log and the map can use: chokepoints = start-range hops whose loss cuts off 3+ stars
  const chokes = chokeLanes(S.stars, startRange, 3);
  const startComp = components(S.stars, startRange), mainC = startComp[pts.indexOf(homePts[0])];
  S.galaxy = { type, chokepoints:chokes.length, chokeLanes:chokes,
    pocketStars:startComp.filter(c => c !== mainC).length, pocketRange };
  return homePts.map(h => S.stars[pts.indexOf(h)]);
}

/* farthest-point picks: n points from `cands` as far from each other as possible */
function spreadOut(S, cands, n) {
  const out = [pick(S, cands)];
  while (out.length < n) {
    let best = null, bd = -1;
    for (const c of cands) { const d = Math.min(...out.map(o => dist(o, c))); if (d > bd) { bd = d; best = c; } }
    out.push(best);
  }
  return out;
}
function neighbours(pts, hop) {
  const adj = pts.map(() => []);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
    if (dist(pts[i], pts[j]) <= hop) { adj[i].push(j); adj[j].push(i); }
  return adj;
}
function components(pts, hop) {
  const adj = neighbours(pts, hop), comp = pts.map(() => -1);
  let c = 0;
  for (let i = 0; i < pts.length; i++) if (comp[i] < 0) {
    const stack = [i]; comp[i] = c;
    while (stack.length) { const u = stack.pop(); for (const v of adj[u]) if (comp[v] < 0) { comp[v] = c; stack.push(v); } }
    c++;
  }
  return comp;
}
/* bridges in the hop graph (Tarjan) whose smaller side holds at least `minSide` stars */
function chokeLanes(stars, hop, minSide) {
  const adj = neighbours(stars, hop), n = stars.length;
  const disc = Array(n).fill(-1), low = Array(n).fill(0), size = Array(n).fill(1), out = [];
  const compSize = {}; const comp = components(stars, hop); comp.forEach(c => compSize[c] = (compSize[c] || 0) + 1);
  let t = 0;
  for (let r = 0; r < n; r++) if (disc[r] < 0) {
    const stack = [[r, -1, 0]]; disc[r] = low[r] = t++;
    while (stack.length) {
      const top = stack[stack.length - 1], [u, parent] = top;
      if (top[2] < adj[u].length) {
        const v = adj[u][top[2]++];
        if (v === parent) continue;
        if (disc[v] < 0) { disc[v] = low[v] = t++; stack.push([v, u, 0]); }
        else low[u] = Math.min(low[u], disc[v]);
      } else {
        stack.pop();
        if (parent >= 0) {
          low[parent] = Math.min(low[parent], low[u]); size[parent] += size[u];
          const side = Math.min(size[u], compSize[comp[u]] - size[u]);
          if (low[u] > disc[parent] && side >= minSide) out.push([stars[parent].id, stars[u].id]);
        }
      }
    }
  }
  return out;
}

/* ---------------- derived values ---------------- */
const P = (S, id) => S.players[id];
const lvl = (S, id, t) => S.players[id].tech[t].level;
function range(S, id) { return lvl(S, id, "range") + S.rules.rangeBase; }
function resources(S, star) {
  return star.res + (star.owner >= 0 && S.rules.terraformOn ? lvl(S, star.owner, "terraforming") * S.rules.terraformBonus : 0);
}
/* the techs this game has: real games default to no Terraforming (noTer) and no separate Scanning (noScn) */
function techsOn(S) {
  return TECHS.filter(t => !(t === "terraforming" && !S.rules.terraformOn) && !(t === "scanning" && S.rules.scanShared));
}
const BASE_KEY = { econ:"econBaseCost", industry:"industryBaseCost", science:"scienceBaseCost" };
function infraCost(S, star, kind) {       // NP4: floor(base × (level+1) ÷ resources)
  if (kind === "gate") return Math.floor(S.rules.gateBaseCost / Math.max(1, resources(S, star)));   // one per star
  return Math.floor((star[kind] + 1) * S.rules[BASE_KEY[kind]] / Math.max(1, resources(S, star)));
}
function researchCost(S, id, t) { return S.rules.researchCostBase * lvl(S, id, t); }
function shipsPerCycle(S, star) {
  return star.owner < 0 ? 0 : star.industry * (lvl(S, star.owner, "manufacturing") + S.rules.manufacturingBase);
}
function starsOf(S, id) { return S.stars.filter(s => s.owner === id); }
function totals(S, id) {
  const t = { stars:0, ships:0, econ:0, industry:0, science:0, carriers:0 };
  for (const s of S.stars) if (s.owner === id) {
    t.stars++; t.ships += s.ships; t.econ += s.econ; t.industry += s.industry; t.science += s.science;
  }
  for (const c of S.carriers) if (c.owner === id) { t.ships += c.ships; t.carriers++; }
  return t;
}
function winTarget(S) { return Math.ceil(S.stars.length * S.rules.winPercent / 100); }

/* ---------------- alliances ---------------- */
function alliance(S, a, b) {
  return S.alliances.find(x => x.ended == null && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
}
function allied(S, a, b) { return a === b || !!alliance(S, a, b); }
function alliesOf(S, id) {
  return S.alliances.filter(x => x.ended == null && (x.a === id || x.b === id)).map(x => x.a === id ? x.b : x.a);
}
function isBanned(S, a, b) { return S.settings.banned.includes(pairKey(a, b)); }

function formAlliance(S, a, b, how) {
  if (a === b || alliance(S, a, b) || !P(S, a).alive || !P(S, b).alive) return null;
  const al = { id:S.nextId++, a, b, formedTick:S.tick, formedTurn:S.turn,
    locked: !!(how && how.locked) || S.settings.lockAll, secret:true, by:(how && how.by) || "bots",
    warBy:null, warAt:null, endsAt:null, ended:null, endedTurn:null, endReason:null };
  S.alliances.push(al);
  const who = `${P(S, a).name} and ${P(S, b).name}`;
  log(S, "diplomacy", al.by === "admin"
    ? `Admin forced an alliance: ${who}${al.locked ? " (locked)" : ""}.`
    : `${who} secretly formed an alliance${al.locked ? " — locked, it can never be broken" : ""}.`, [a, b]);
  return al;
}

/* Declaring war starts the notice timer; the alliance holds until it runs out.
   Breaking is public: everyone learns the pair were allied, and who broke it. */
function declareWar(S, by, other, opts) {
  const al = alliance(S, by, other);
  if (!al || al.locked || al.warBy != null) return false;
  const admin = opts && opts.admin;
  const notice = (opts && opts.instant) || S.settings.instantBreak ? 0 : S.rules.allianceBreakTicks;
  al.warBy = by; al.warAt = S.tick; al.warAdmin = !!admin; al.endsAt = S.tick + notice; al.secret = false;
  if (!admin) {
    S.rel[other][by] = clamp(S.rel[other][by] - 60, -100, 100);
    S.players.forEach(c => { if (c.id !== by && c.id !== other) S.rel[c.id][by] = clamp(S.rel[c.id][by] - 10, -100, 100); });
  }
  log(S, "diplomacy", admin
    ? `Admin broke the alliance between ${P(S, by).name} and ${P(S, other).name}${notice ? ` — war in ${notice} ticks` : ""}.`
    : `${P(S, by).name} declared war on ally ${P(S, other).name}!${notice ? ` The alliance ends in ${notice} ticks.` : ""}`, [by, other]);
  if (notice === 0) endAlliance(S, al, admin ? "admin" : "betrayal");
  return true;
}
function endAlliance(S, al, reason) {
  al.ended = S.tick; al.endedTurn = S.turn; al.endReason = reason;
  if (reason === "betrayal" && al.endsAt > al.warAt) log(S, "diplomacy", `The alliance of ${P(S, al.a).name} and ${P(S, al.b).name} is over — they are at war.`, [al.a, al.b]);
  // carriers parked at the other's stars now fight
  S.stars.forEach(s => resolveStar(S, s));
}

/* ---------------- combat ---------------- */
/* Rounds alternate, defender first; each shot kills ships equal to weapons. */
function fight(att, def, wa, wd) {
  if (def <= 0) return { att, def:0 };                 // an empty star can't shoot back
  while (true) {
    att -= wd; if (att <= 0) return { att:0, def };
    def -= wa; if (def <= 0) return { att, def:0 };
  }
}
/* Smallest attacking force that beats `def` ships. */
function shipsToWin(def, wa, wd) {
  if (def <= 0) return 1;
  return Math.ceil(def / wa) * wd + 1;
}
/* Spread `n` losses roughly evenly (by size) across a list of {ships} objects. */
function takeLosses(list, n) {
  const total = list.reduce((t, o) => t + o.ships, 0);
  if (n >= total) { list.forEach(o => o.ships = 0); return; }
  let left = n;
  for (const o of list) { const k = Math.min(o.ships, Math.floor(n * o.ships / total)); o.ships -= k; left -= k; }
  for (const o of list) { if (left <= 0) break; if (o.ships > 0) { o.ships--; left--; } }
}

/* Codex rules: the defenders are the owner and everyone in a formal alliance with
   the owner (+1 weapons, shoot first). Every other player in orbit attacks as one
   team, using the team's best weapons. If the attackers win, the star goes to the
   player with the most ships in orbit, and any fighting left over starts again. */
function resolveStar(S, star) {
  let guard = 0;
  while (guard++ < 12) {
    const here = S.carriers.filter(c => c.at === star.id && c.ships > 0);
    if (star.owner < 0) {                              // unclaimed: the shortest final hop claims it
      if (!here.length) return;
      const claimer = here.slice().sort((a, b) => (a.step || 0) - (b.step || 0) || b.ships - a.ships)[0].owner;
      star.owner = claimer; star.ships = 0; star.frac = 0;
      log(S, "expansion", `${P(S, claimer).name} claimed ${star.name}.`, [claimer], star.id);
      continue;
    }
    const owner = star.owner;
    const attackers = here.filter(c => !allied(S, c.owner, owner));
    if (!attackers.length) return;
    const defenders = here.filter(c => allied(S, c.owner, owner));
    const defList = [star, ...defenders];
    const attShips = attackers.reduce((t, c) => t + c.ships, 0);
    const defShips = defList.reduce((t, o) => t + o.ships, 0);
    const wa = Math.max(...attackers.map(c => lvl(S, c.owner, "weapons")));
    const wd = Math.max(lvl(S, owner, "weapons"), ...defenders.map(c => lvl(S, c.owner, "weapons"))) + S.rules.defenderWeaponBonus;
    const sides = [...new Set(attackers.map(c => c.owner))];
    const r = fight(attShips, defShips, wa, wd);
    takeLosses(attackers, attShips - r.att);
    takeLosses(defList, defShips - r.def);
    S.carriers = S.carriers.filter(c => c.ships > 0 || c.at !== star.id);
    const aName = sides.map(id => P(S, id).name).join(" + "), dName = P(S, owner).name;
    sides.forEach(id => S.rel[owner][id] = clamp(S.rel[owner][id] - (r.def <= 0 ? 12 : 4), -100, 100));
    if (r.def <= 0) {
      const inOrbit = {};
      S.carriers.forEach(c => { if (c.at === star.id && c.ships > 0) inOrbit[c.owner] = (inOrbit[c.owner] || 0) + c.ships; });
      const winner = +Object.keys(inOrbit).sort((a, b) => inOrbit[b] - inOrbit[a])[0];
      const cash = star.econ * S.rules.captureCashPerEcon;
      P(S, winner).credits += cash;
      log(S, "combat", `${P(S, winner).name} captured ${star.name} from ${dName} (${attShips} vs ${defShips} ships${sides.length > 1 ? `, attackers ${aName}` : ""}, ${r.att} left${cash ? `, +$${cash}` : ""}).`, [...sides, owner], star.id);
      star.owner = winner; star.econ = 0; star.ships = 0; star.frac = 0;
    } else {
      log(S, "combat", `${dName} held ${star.name} against ${aName} (${attShips} vs ${defShips} ships, ${r.def} left).`, [...sides, owner], star.id);
    }
  }
}

/* ---------------- carriers ---------------- */
/* A carrier with orders is busy: bots don't merge it into other fleets or send it elsewhere. */
const busy = c => !!(c.route && c.route.length);

/* Pull `n` ships from a star (garrison first, then own parked carriers) into one carrier heading to `to`. */
function launch(S, pid, from, to, n) {
  const parked = S.carriers.filter(c => c.at === from.id && c.owner === pid && !busy(c));
  let carrier = parked[0];
  if (!carrier) {
    if (P(S, pid).credits < S.rules.carrierCost) return null;
    P(S, pid).credits -= S.rules.carrierCost;
    carrier = { id:S.nextId++, owner:pid, ships:0, at:from.id };
    S.carriers.push(carrier);
  }
  // gather ships onto the carrier
  let pool = parked.slice(1).reduce((t, c) => t + c.ships, 0) + carrier.ships + (from.owner === pid ? from.ships : 0);
  n = Math.min(n, pool);
  if (n < 1) return null;
  let need = n - carrier.ships;
  if (need < 0) { if (from.owner === pid) from.ships += -need; else return null; need = 0; }
  if (from.owner === pid) { const k = Math.min(from.ships, need); from.ships -= k; need -= k; }
  for (const c of parked.slice(1)) { if (need <= 0) break; const k = Math.min(c.ships, need); c.ships -= k; need -= k; }
  S.carriers = S.carriers.filter(c => c === carrier || c.ships > 0 || !parked.includes(c));
  carrier.ships = n;
  carrier.at = null; carrier.from = from.id; carrier.to = to.id;
  carrier.len = dist(from, to); carrier.done = 0; carrier.speed = speedBetween(S, from, to, pid);
  return carrier;
}
function carrierPos(S, c) {
  if (c.at != null) return S.stars[c.at];
  const a = S.stars[c.from], b = S.stars[c.to], f = c.len ? c.done / c.len : 1;
  return { x:a.x + (b.x - a.x) * f, y:a.y + (b.y - a.y) * f };
}
function eta(S, c) { return c.at != null ? 0 : Math.ceil((c.len - c.done) / (c.speed || S.rules.carrierSpeed)); }
/* Warp gates (NPA timetravel.ts calcSpeedBetweenStars, NP4): a jump between two gated stars,
   whoever owns them, flies at speed × √(Hyperspace + 3). Speed is fixed when the carrier leaves. */
function speedBetween(S, a, b, pid) {
  const v = S.rules.carrierSpeed;
  return S.rules.gatesOn && a && b && a.gate && b.gate ? v * Math.sqrt(lvl(S, pid, "range") + 3) : v;
}
function ticksBetween(S, a, b, pid) { return Math.ceil(dist(a, b) / speedBetween(S, a, b, pid)); }

/* ---------------- waypoint orders (routes & patrols) ----------------
   Same model as the real game (NPA's Fleet.o = [delay, star, action, arg] plus
   fleet.loop): `c.route` is the list of stops still to visit, each
   { star, action, n, delay }. In flight, route[0] is the star it's flying to.
   On arrival at its own star the carrier carries out the action; a carrier
   always keeps at least 1 ship. With `c.loop` the finished stop goes to the back
   of the list, so the route repeats forever (a patrol or supply line). `c.wait`
   counts down the stop's delay before the carrier leaves for the next stop. */
const ACTIONS = {
  "none":            { label:"Do nothing",           n:false },
  "collect-all":     { label:"Collect all",          n:false },
  "drop-all":        { label:"Drop all",             n:false },
  "collect":         { label:"Collect X",            n:true  },
  "drop":            { label:"Drop X",               n:true  },
  "collect-all-but": { label:"Collect all but X",    n:true  },
  "drop-all-but":    { label:"Drop all but X",       n:true  },
  "garrison":        { label:"Garrison X on star",   n:true  },
};
/* Ships moved from carrier to star (negative = picked up). NPA timetravel.ts. */
function transferFor(action, n, carrier, star) {
  let t = 0;
  switch (action) {
    case "collect-all":     t = -star; break;
    case "collect":         t = -n; break;
    case "collect-all-but": t = Math.min(0, -star + n); break;
    case "drop-all":        t = carrier; break;
    case "drop":            t = n; break;
    case "drop-all-but":    t = Math.max(0, carrier - n); break;
    case "garrison":        t = -star + n; break;
  }
  return clamp(t, -star, Math.max(0, carrier - 1));
}
function depart(S, c, to) {
  c.from = c.at; c.to = to; c.at = null;
  c.len = dist(S.stars[c.from], S.stars[to]); c.done = 0; c.speed = speedBetween(S, S.stars[c.from], S.stars[to], c.owner);
}
function arrive(S, c) {
  if (!busy(c) || c.route[0].star !== c.at) return;
  const stop = c.route.shift();
  if (c.loop) c.route.push(stop);
  const star = S.stars[c.at];
  if (star.owner === c.owner && stop.action !== "none") {
    const t = transferFor(stop.action, Math.max(0, Math.floor(stop.n || 0)), c.ships, star.ships);
    c.ships -= t; star.ships += t;
  }
  c.wait = Math.max(0, Math.floor(stop.delay || 0));
  if (!c.route.length) c.loop = false;
}
/* A new route on a carrier sitting at one of its own looped stops: that stop's order
   runs now, as if it had just arrived, so a lane starting at home loads up before the
   first trip instead of only after a full lap. */
function runHere(S, c) {
  if (c.at == null || !c.loop || !busy(c)) return;
  const stop = c.route[c.route.length - 1], star = S.stars[c.at];
  if (stop.star !== c.at || star.owner !== c.owner || stop.action === "none") return;
  const t = transferFor(stop.action, Math.max(0, Math.floor(stop.n || 0)), c.ships, star.ships);
  c.ships -= t; star.ships += t;
}
/* The stars a carrier will visit, in order, starting with the one it's heading to. */
function routePath(S, c) {
  if (busy(c)) return c.route.map(x => x.star);
  return c.at == null ? [c.to] : [];
}
/* Can this carrier fly these stops? Every hop within its owner's jump range, and a
   loop's last stop within range of its first. In flight, the first stop must be
   where it's already going. Returns "" when fine, otherwise the reason. */
function checkRoute(S, c, stops, loop) {
  if (!stops.length) return "";
  const r = range(S, c.owner);
  if (c.at == null && stops[0].star !== c.to) return "A carrier in flight can't change where it's going; edit the stops after it.";
  let prev = c.at != null ? c.at : c.to;
  for (let i = c.at == null ? 1 : 0; i < stops.length; i++) {
    const s = stops[i].star;
    if (!S.stars[s]) return "Unknown star.";
    if (s === prev) return `${S.stars[s].name} twice in a row.`;
    if (dist(S.stars[prev], S.stars[s]) > r + 1e-9) return `${S.stars[prev].name} → ${S.stars[s].name} is ${dist(S.stars[prev], S.stars[s]).toFixed(1)} ly, beyond jump range ${r} ly.`;
    prev = s;
  }
  if (loop) {
    const a = S.stars[stops[stops.length - 1].star], b = S.stars[stops[0].star];
    if (stops.length < 2) return "A loop needs at least two stops.";
    if (a === b) return "A loop can't end where it starts; drop the last stop.";
    if (dist(a, b) > r + 1e-9) return `Can't loop: ${a.name} → ${b.name} is ${dist(a, b).toFixed(1)} ly, beyond jump range ${r} ly.`;
  }
  return "";
}

/* ---------------- ship transfers at a star ----------------
   Like the real game's transfer screen: at your own star ships move freely between
   the garrison and your carriers in orbit; anywhere else only carrier to carrier.
   A carrier holding ships always keeps at least 1 (real carriers are never empty).
   `from` / `to` are "star" or a carrier id. Each returns "" or the reason it can't. */
function shipSide(S, pid, starId, k) {
  if (k === "star") return S.stars[starId].owner === pid ? S.stars[starId] : null;
  return S.carriers.find(c => c.id === +k && c.owner === pid && c.at === starId) || null;
}
function moveShips(S, pid, starId, from, to, n) {
  if (!S.stars[starId]) return "Unknown star.";
  const a = shipSide(S, pid, starId, from), b = shipSide(S, pid, starId, to);
  if (!a || !b) return from === "star" || to === "star" ? "The garrison can only be used at your own star." : "Those carriers aren't both yours and in orbit here.";
  if (a === b) return "";
  const spare = a.ships - (from === "star" ? 0 : Math.min(1, a.ships));
  n = Math.min(Math.floor(n), spare);
  if (!(n >= 1)) return from === "star" ? "No ships left in the garrison." : "A carrier keeps at least 1 ship.";
  a.ships -= n; b.ships += n;
  return "";
}
/* buy a carrier at a star and put n ships on it, from the garrison or from another carrier */
function newCarrier(S, pid, starId, n, from) {
  const src = shipSide(S, pid, starId, from == null ? "star" : from);
  if (!src) return from == null ? "You can only build carriers at your own stars." : "That carrier isn't yours or isn't here.";
  const spare = src.ships - (from == null ? 0 : 1);
  n = Math.floor(n);
  if (!(n >= 1) || spare < 1) return from == null ? "A new carrier needs at least 1 ship from the garrison." : "Nothing to split off: a carrier keeps at least 1 ship.";
  if (P(S, pid).credits < S.rules.carrierCost) return `A new carrier costs $${S.rules.carrierCost}.`;
  P(S, pid).credits -= S.rules.carrierCost;
  n = Math.min(n, spare);
  const c = { id:S.nextId++, owner:pid, ships:n, at:starId };
  src.ships -= n; S.carriers.push(c);
  return c;
}
/* even split, like the real game's: every ship pid has here (garrison, if it's pid's
   star, plus all pid's carriers in orbit) shared out as evenly as possible; carriers
   get the whole shares and the garrison takes the remainder */
function evenSplit(S, pid, starId) {
  const star = S.stars[starId], own = star.owner === pid;
  const cs = S.carriers.filter(c => c.owner === pid && c.at === starId);
  const slots = cs.length + (own ? 1 : 0);
  if (!cs.length || slots < 2) return "Needs at least two places to share between (a carrier and your star, or two carriers).";
  const total = cs.reduce((t, c) => t + c.ships, 0) + (own ? star.ships : 0);
  const each = Math.floor(total / slots);
  if (each < 1) return "Not enough ships to go round.";
  cs.forEach(c => c.ships = each);
  if (own) star.ships = total - each * cs.length;
  else cs[0].ships += total - each * cs.length;
  return "";
}
/* fold every idle carrier of pid here into the biggest one (carriers with orders are left alone) */
function mergeCarriers(S, pid, starId) {
  const here = S.carriers.filter(c => c.owner === pid && c.at === starId && !busy(c)).sort((a, b) => b.ships - a.ships);
  if (here.length < 2) return "Nothing to merge: only one idle carrier here.";
  const keep = here[0];
  here.slice(1).forEach(c => { keep.ships += c.ships; c.ships = 0; });
  S.carriers = S.carriers.filter(c => !here.includes(c) || c === keep);
  return "";
}

/* ---------------- the tick ---------------- */
function tick(S) {
  if (S.winner) return;
  S.tick++;
  const R = S.rules;

  // 1. movement: carriers with orders leave once their stop's delay is up, then everything in flight moves
  for (const c of S.carriers) if (c.at != null && busy(c)) {
    if (c.wait > 0) { c.wait--; continue; }
    if (c.ships < 1) continue;                                  // an empty carrier waits for ships
    if (c.route[0].star === c.at) { arrive(S, c); continue; }   // already there
    depart(S, c, c.route[0].star);
  }
  const landed = new Set(), arrived = [];
  for (const c of S.carriers) if (c.at == null) {
    const v = c.speed || R.carrierSpeed;
    c.step = Math.min(v, c.len - c.done); c.done += v;
    if (c.done >= c.len - 1e-9) { c.at = c.to; landed.add(c.to); arrived.push(c); }
  }
  landed.forEach(id => resolveStar(S, S.stars[id]));
  for (const c of arrived) if (S.carriers.includes(c)) arrive(S, c);   // waypoint actions after any fighting

  // 2. ship production (fractional, every tick)
  for (const s of S.stars) if (s.owner >= 0) {
    s.frac += shipsPerCycle(S, s) / R.productionTicks;
    const whole = Math.floor(s.frac);
    if (whole > 0) { s.ships += whole; s.frac -= whole; }
  }

  // 3. research (every tick)
  for (const p of S.players) if (p.alive) {
    const sci = S.stars.reduce((t, s) => t + (s.owner === p.id ? s.science : 0), 0);
    addResearch(S, p, p.researching, sci * R.sciencePerTick, true);
  }

  // 4. production cycle
  if (S.tick % R.productionTicks === 0) production(S);

  // 5. alliances whose notice has run out
  for (const al of S.alliances) if (al.ended == null && al.endsAt != null && S.tick >= al.endsAt) {
    endAlliance(S, al, al.warAdmin ? "admin" : "betrayal");
  }

  // 6. eliminations & victory
  for (const p of S.players) if (p.alive) {
    if (!S.stars.some(s => s.owner === p.id) && !S.carriers.some(c => c.owner === p.id)) {
      p.alive = false; p.outTurn = S.turn;
      log(S, "combat", `${p.name} has been eliminated.`, [p.id]);
      S.alliances.forEach(al => { if (al.ended == null && (al.a === p.id || al.b === p.id)) {
        al.ended = S.tick; al.endedTurn = S.turn; al.endReason = "eliminated"; } });
    }
  }
  checkVictory(S);
}

/* `main`: the player's own research, which moves on to "research next" when a level completes
   (real game: researching = researchingNext). Experimentation's random points never switch it. */
function addResearch(S, p, t, rp, main) {
  const tech = p.tech[t];
  tech.rp += rp;
  let cost;
  while (tech.rp >= (cost = researchCost(S, p.id, t))) {
    tech.rp -= cost; tech.level++;
    log(S, "research", `${p.name} reached ${TECH_LABEL[t]} ${tech.level}.`, [p.id]);
    if (main && p.researchingNext && p.researchingNext !== t) {
      const left = tech.rp; tech.rp = 0;                 // the overflow carries into the next tech
      p.researching = p.researchingNext;
      addResearch(S, p, p.researching, left, true);
      return;
    }
  }
}

function production(S) {
  const R = S.rules;
  for (const p of S.players) if (p.alive) {
    const econ = S.stars.reduce((t, s) => t + (s.owner === p.id ? s.econ : 0), 0);
    p.credits += econ * (R.econCredits + p.tech.banking.level * R.bankingPerEcon) + p.tech.banking.level * R.bankingFlat;
    const x = p.tech.experimentation.level;
    if (x > 0) addResearch(S, p, pick(S, techsOn(S)), x * R.experimentationRP);
  }
  updateOpinions(S);
  log(S, "system", `Production cycle ${S.tick / R.productionTicks} paid out.`);
}

/* ---------------- opinions (bot feelings) ---------------- */
/* S.rel[a][b] is what a thinks of b, −100…100. Borders breed tension, shared
   enemies and alliances breed trust, and everyone fears the runaway leader. */
function updateOpinions(S) {
  const alive = S.players.filter(p => p.alive);
  const leadLine = winTarget(S) * .6;
  const counts = alive.map(p => starsOf(S, p.id).length);
  for (const a of alive) for (const b of alive) if (a !== b) {
    let d = 0;
    if (borders(S, a.id, b.id)) d -= 2;
    if (allied(S, a.id, b.id)) d += 3;
    if (alive.some(c => c !== a && c !== b && S.rel[a.id][c.id] < -25 && S.rel[b.id][c.id] < -25)) d += 3;
    if (counts[alive.indexOf(b)] > leadLine) d -= 4;
    S.rel[a.id][b.id] = clamp(Math.round(S.rel[a.id][b.id] * .92 + d), -100, 100);
  }
}
function borders(S, a, b) {
  const r = range(S, a);
  const mine = starsOf(S, a), theirs = starsOf(S, b);
  return mine.some(s => theirs.some(t => dist(s, t) <= r));
}

/* ---------------- scanning (fog of war) ---------------- */
function scanRange(S, id) { return lvl(S, id, S.rules.scanShared ? "range" : "scanning") + S.rules.scanBase; }
/* Who a group of viewers can see through: themselves, plus formal allies when
   allies share scanning. Returns [{x, y, r}] scan circles. */
function scanSources(S, viewers) {
  const group = new Set(viewers);
  if (S.settings.allyVision !== false) viewers.forEach(v => alliesOf(S, v).forEach(a => group.add(a)));
  const out = [];
  for (const s of S.stars) if (group.has(s.owner)) out.push({ x:s.x, y:s.y, r:scanRange(S, s.owner), owner:s.owner });
  if (S.rules.carriersScan) for (const c of S.carriers) if (group.has(c.owner)) {
    const p = carrierPos(S, c); out.push({ x:p.x, y:p.y, r:scanRange(S, c.owner), owner:c.owner });
  }
  return { group, sources:out };
}
function inScan(vis, p) { return vis.sources.some(o => (o.x - p.x) ** 2 + (o.y - p.y) ** 2 <= o.r * o.r + 1e-9); }

/* ---------------- victory ---------------- */
function checkVictory(S) {
  if (S.winner) return;
  const target = winTarget(S);
  const alive = S.players.filter(p => p.alive);
  const count = id => S.stars.filter(s => s.owner === id).length;
  for (const p of alive) if (count(p.id) >= target) return declareWinner(S, [p.id], "solo");
  if (alive.length === 1) return declareWinner(S, [alive[0].id], "last");
  if (S.settings.coalitionWin) {
    // locked blocs (connected by locked alliances)
    const seen = new Set();
    for (const p of alive) if (!seen.has(p.id)) {
      const bloc = [], stack = [p.id];
      while (stack.length) {
        const id = stack.pop(); if (seen.has(id)) continue; seen.add(id); bloc.push(id);
        S.alliances.forEach(al => { if (al.ended == null && al.locked && (al.a === id || al.b === id)) stack.push(al.a === id ? al.b : al.a); });
      }
      // a bloc needs more of the galaxy the bigger it is: +15% per extra member, capped at 90%
      const need = Math.ceil(S.stars.length * Math.min(90, S.rules.winPercent + 15 * (bloc.length - 1)) / 100);
      if (bloc.length > 1 && (bloc.length === alive.length || bloc.reduce((t, id) => t + count(id), 0) >= need))
        return declareWinner(S, bloc, "coalition");
    }
  }
  if (S.turn >= S.settings.maxTurns) {
    const best = alive.slice().sort((a, b) => count(b.id) - count(a.id) || totals(S, b.id).ships - totals(S, a.id).ships)[0];
    return declareWinner(S, [best.id], "time");
  }
}
function declareWinner(S, ids, how) {
  S.winner = { ids, how, turn:S.turn, tick:S.tick };
  const names = ids.map(id => P(S, id).name).join(" + ");
  const why = { solo:"holds enough stars to win", last:"is the last empire standing",
    coalition:"win together as a locked alliance", time:"leads when time runs out" }[how];
  log(S, "system", `🏆 ${names} ${why}.`, ids);
}

/* ======================================================================
   BOTS — each alive player takes its turn before the ticks are processed,
   exactly like submitting orders in a turn-based game.
   ====================================================================== */
function botTurn(S, p) {
  if (!p.alive) return;
  const persona = PERSONAS[p.persona];
  botDiplomacy(S, p, persona);
  botResearch(S, p, persona);
  botSupply(S, p);
  botMilitary(S, p, persona);
  botSpend(S, p, persona);
}

function botResearch(S, p, persona) {
  const on = techsOn(S), order = persona.research.filter(t => on.includes(t));
  if (!order.length) order.push("weapons");
  const score = t => p.tech[t].level + order.indexOf(t) * .5;
  const ranked = order.slice().sort((a, b) => score(a) - score(b));
  p.researching = ranked[0];
  p.researchingNext = ranked[1] || ranked[0];
}

function botSpend(S, p, persona) {
  const reserve = S.rules.carrierCost * 2 + (alliesOf(S, p.id).length < persona.maxAllies ? S.rules.allianceFee : 0);
  const mine = starsOf(S, p.id);
  if (!mine.length) return;
  // warp gates, once rich: first the best-producing star, then the ends of supply lines, so ships reach the front fast
  if (S.rules.gatesOn && rand(S) < (persona.gates || .15)) {
    const ends = new Set();
    S.carriers.forEach(c => { if (c.owner === p.id && c.routeBy === "bot" && c.route) c.route.forEach(x => ends.add(x.star)); });
    const want = mine.filter(s => !s.gate).sort((a, b) => (ends.has(b.id) - ends.has(a.id)) || shipsPerCycle(S, b) - shipsPerCycle(S, a))[0];
    if (want) { const c = infraCost(S, want, "gate"); if (p.credits >= c * 2 + reserve) { p.credits -= c; want.gate = 1;
      log(S, "orders", `${p.name} built a warp gate at ${want.name}.`, [p.id]); } }
  }
  for (let n = 0; n < 40; n++) {
    let r = rand(S), kind = "econ";
    for (const k of ["econ", "industry", "science"]) { if (r < persona.spend[k]) { kind = k; break; } r -= persona.spend[k]; }
    let best = null, cost = Infinity;
    for (const s of mine) { const c = infraCost(S, s, kind); if (c < cost) { cost = c; best = s; } }
    if (!best || p.credits - cost < reserve) break;
    p.credits -= cost; best[kind]++;
  }
}

function botDiplomacy(S, p, persona) {
  const alive = S.players.filter(q => q.alive);
  const mult = S.settings.betrayal;

  // --- betrayal ---
  for (const q of alliesOf(S, p.id)) {
    const al = alliance(S, p.id, q);
    if (!al || al.locked || al.warBy != null) continue;
    const opinion = S.rel[p.id][q];
    let pressure = 1;
    if (opinion < 0) pressure += -opinion / 20;
    const mine = totals(S, p.id), theirs = totals(S, q);
    if (mine.ships > theirs.ships * 1.6 && borders(S, p.id, q)) pressure += 1.5;
    if (starsOf(S, q).length > winTarget(S) * .6) pressure += 1;
    if (!hasTargets(S, p.id)) pressure += 3;                       // nothing left to grab but friends
    if (alive.length <= alliesOf(S, p.id).length + 1) pressure += 5; // only allies remain
    if (rand(S) < persona.treach * mult * .03 * pressure || (opinion < -50 && mult > 0 && rand(S) < .5)) {
      declareWar(S, p.id, q);
    }
  }

  // --- new alliances ---
  const have = alliesOf(S, p.id).length;
  if (have >= persona.maxAllies || rand(S) > .4 || p.credits < S.rules.allianceFee) return;
  if (alive.length <= 2) return;                                     // the last two never make peace
  const candidates = alive.filter(q => q.id !== p.id && !allied(S, p.id, q.id) && !isBanned(S, p.id, q.id)
    && appeal(S, p.id, q.id) >= persona.allyAt)
    .sort((a, b) => appeal(S, p.id, b.id) - appeal(S, p.id, a.id));
  const q = candidates[0];
  if (!q) return;
  if (q.human) {                                                    // a person decides; the offer waits for them
    if ((S.offers || []).some(o => o.from === p.id && o.to === q.id)) return;
    p.credits -= S.rules.allianceFee;
    (S.offers = S.offers || []).push({ from:p.id, to:q.id, tick:S.tick, turn:S.turn });
    log(S, "diplomacy", `${p.name} offered ${q.name} an alliance.`, [p.id, q.id]);
    return;
  }
  const qp = PERSONAS[q.persona];
  const accepts = appeal(S, q.id, p.id) >= qp.allyAt - 10 && alliesOf(S, q.id).length < qp.maxAllies;
  p.credits -= S.rules.allianceFee;
  if (accepts) {
    formAlliance(S, p.id, q.id, { by:"bots" });
    S.rel[p.id][q.id] = clamp(S.rel[p.id][q.id] + 10, -100, 100);
    S.rel[q.id][p.id] = clamp(S.rel[q.id][p.id] + 10, -100, 100);
  } else {
    S.rel[p.id][q.id] = clamp(S.rel[p.id][q.id] - 5, -100, 100);   // snubbed
    log(S, "diplomacy", `${q.name} turned down an alliance with ${p.name}.`, [p.id, q.id]);
  }
}

/* How attractive b looks as an ally to a: opinion plus strategy. A shared enemy
   or a common threat pulls players together; a runaway leader repels them. */
function appeal(S, a, b) {
  let v = S.rel[a][b];
  const alive = S.players.filter(p => p.alive && p.id !== a && p.id !== b);
  if (alive.some(c => S.rel[a][c.id] < -20 && S.rel[b][c.id] < -20)) v += 20;
  const lead = winTarget(S) * .6;
  const leader = alive.find(c => starsOf(S, c.id).length > lead);
  if (leader && !allied(S, a, leader.id)) v += 15;                    // band together against the leader
  if (starsOf(S, b).length > lead) v -= 30;
  if (!borders(S, a, b)) v += 8;                                     // distant friends are safe friends
  return v;
}

function hasTargets(S, id) {
  const r = range(S, id);
  const mine = starsOf(S, id);
  return S.stars.some(t => t.owner !== id && !allied(S, id, t.owner) && mine.some(s => dist(s, t) <= r));
}

/* Can `id` attack `owner` on arrival in `ticks`? Allies only once the war notice has run out. */
function canHit(S, id, owner, ticks) {
  if (owner < 0) return true;
  const al = alliance(S, id, owner);
  if (!al) return owner !== id;
  return al.endsAt != null && al.endsAt <= S.tick + ticks;
}

function botMilitary(S, p, persona) {
  const R = S.rules, r = range(S, p.id);
  const mine = starsOf(S, p.id);
  const inbound = {};                       // hostile ships heading for each of my stars
  const targeted = {};                      // my ships already heading for each star
  for (const c of S.carriers) if (c.at == null) {
    if (c.owner === p.id) targeted[c.to] = (targeted[c.to] || 0) + c.ships;
    else if (S.stars[c.to].owner === p.id && !allied(S, c.owner, p.id)) inbound[c.to] = (inbound[c.to] || 0) + c.ships;
  }
  const wa = lvl(S, p.id, "weapons");
  const leadLine = winTarget(S) * .6;

  const sources = mine.map(s => {
    const parked = S.carriers.filter(c => c.at === s.id && c.owner === p.id && !busy(c)).reduce((t, c) => t + c.ships, 0);
    return { s, avail:s.ships + parked };
  }).sort((a, b) => b.avail - a.avail);

  for (const { s, avail } of sources) {
    const frontier = S.stars.some(t => t.owner >= 0 && t.owner !== p.id && !allied(S, p.id, t.owner) && dist(s, t) <= r);
    const keep = Math.ceil((inbound[s.id] || 0) * 1.3) + (frontier ? Math.floor(avail * persona.keep) : 0);
    const free = avail - keep;
    if (free < 2) continue;

    let best = null;
    for (const t of S.stars) {
      if (t.owner === p.id) continue;
      const d = dist(s, t);
      if (d > r) continue;
      const ticks = ticksBetween(S, s, t, p.id);
      if (!canHit(S, p.id, t.owner, ticks)) continue;
      let need, value;
      if (t.owner < 0) {
        if (targeted[t.id]) continue;
        need = 2;
        value = (resources(S, t) + 10) / 10;
      } else {
        const opinion = S.rel[p.id][t.owner];
        if (opinion > 60 - persona.aggr * 40) continue;              // too friendly to attack
        const guard = S.carriers.filter(c => c.at === t.id && allied(S, c.owner, t.owner)).reduce((x, c) => x + c.ships, 0);
        const def = t.ships + guard + Math.ceil(shipsPerCycle(S, t) * ticks / R.productionTicks);
        const wd = lvl(S, t.owner, "weapons") + R.defenderWeaponBonus;
        need = Math.ceil(shipsToWin(def, wa, wd) * 1.25) - (targeted[t.id] || 0);
        let hate = 1 + Math.max(0, -opinion) / 40;
        if (starsOf(S, t.owner).length > leadLine) hate += .8;
        value = (resources(S, t) + t.econ * 2 + t.industry * 4 + 10) / 10 * persona.aggr * hate;
      }
      if (need < 1 || need > free) continue;
      const score = value / (1 + ticks / 12) / (1 + need / 60);
      if (!best || score > best.score) best = { t, need, score, ticks };
    }

    if (best) {
      const send = best.t.owner < 0 ? Math.max(best.need, Math.min(free, 4))
        : Math.min(free, Math.round(best.need + (free - best.need) * persona.aggr * .6));
      if (launch(S, p.id, s, best.t, send)) targeted[best.t.id] = (targeted[best.t.id] || 0) + send;
      continue;
    }
    // nothing to hit from here: push spare ships to the nearest frontier star
    if (!frontier && free >= 8) {
      const front = mine.filter(m => m !== s && dist(m, s) <= r &&
        S.stars.some(t => t.owner !== p.id && !allied(S, p.id, t.owner) && dist(m, t) <= r))
        .sort((a, b) => dist(a, s) - dist(b, s))[0];
      if (front) launch(S, p.id, s, front, free);
    }
  }
}

/* Supply lines: a looping carrier that collects every ship at one or two interior
   stars and drops them all at a frontier star, like players do in the real game.
   Lines whose stars are lost, or whose frontier has gone quiet, are wound up. */
function botSupply(S, p) {
  const want = SUPPLY_LINES[p.persona] || 0;
  const r = range(S, p.id), mine = starsOf(S, p.id);
  const enemyNear = s => S.stars.some(t => t.owner >= 0 && !allied(S, p.id, t.owner) && dist(s, t) <= r);
  const lines = S.carriers.filter(c => c.owner === p.id && c.routeBy === "bot" && busy(c));
  for (const c of lines) {
    const stops = c.route.map(x => S.stars[x.star]);
    const front = stops.find((s, i) => c.route[i].action === "drop-all");
    if (stops.every(s => s.owner === p.id) && front && enemyNear(front)) continue;
    c.route = c.at == null ? [Object.assign({}, c.route[0], { action:"drop-all" })] : [];   // finish the hop, unload, stand down
    c.loop = false; c.routeBy = null;
  }
  let have = S.carriers.filter(c => c.owner === p.id && c.routeBy === "bot" && busy(c)).length;
  if (have >= want || mine.length < 6) return;

  const used = new Set();
  S.carriers.forEach(c => { if (c.owner === p.id && busy(c)) c.route.forEach(x => used.add(x.star)); });
  const threat = f => S.stars.reduce((t, s) => t + (s.owner >= 0 && !allied(S, p.id, s.owner) && dist(s, f) <= r ? s.ships + 5 : 0), 0);
  const inner = mine.filter(s => !enemyNear(s) && !used.has(s.id) && s.industry > 0);
  const fronts = mine.filter(s => enemyNear(s));
  let best = null;
  for (const a of inner) for (const f of fronts) {
    const d = dist(a, f); if (d > r) continue;
    const score = shipsPerCycle(S, a) * (1 + threat(f) / 40) / (1 + d / r);
    if (!best || score > best.score) best = { a, f, score };
  }
  if (!best) return;
  const { a, f } = best;
  // a second pick-up on the way, if one fits inside jump range at every hop
  const b = inner.filter(s => s !== a && s.industry > 0 && dist(a, s) <= r && dist(s, f) <= r)
    .sort((x, y) => shipsPerCycle(S, y) - shipsPerCycle(S, x))[0];
  let c = S.carriers.find(x => x.at === a.id && x.owner === p.id && !busy(x));
  if (!c) {
    if (P(S, p.id).credits < S.rules.carrierCost * 3 || a.ships < 1) return;
    P(S, p.id).credits -= S.rules.carrierCost;
    c = { id:S.nextId++, owner:p.id, ships:0, at:a.id };
    S.carriers.push(c);
  }
  c.ships += a.ships; a.ships = 0;                                 // load up before the first run
  const stop = (s, action) => ({ star:s.id, action, n:0, delay:0 });
  c.route = b ? [stop(b, "collect-all"), stop(f, "drop-all"), stop(a, "collect-all")] : [stop(f, "drop-all"), stop(a, "collect-all")];
  c.loop = true; c.routeBy = "bot"; c.wait = 0;
  log(S, "orders", `${p.name} set up a supply line: ${[a, b, f].filter(Boolean).map(s => s.name).join(" → ")} and back.`, [p.id], f.id);
}

/* ---------------- turns & stats ---------------- */
/* A turn is split in three so the viewer can play the ticks back one at a time:
   beginTurn (every bot submits orders), the ticks, then endTurn. nextTurn runs
   all three at once; the RNG sequence is identical either way. */
function beginTurn(S) {
  if (S.winner) return false;
  const order = S.players.filter(p => p.alive).map(p => p.id);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand(S) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  order.forEach(id => { if (!P(S, id).human) botTurn(S, P(S, id)); });
  // offers to the player lapse after a production cycle, or when either side is gone
  S.offers = (S.offers || []).filter(o => S.tick - o.tick < S.rules.productionTicks && P(S, o.from).alive && P(S, o.to).alive && !allied(S, o.from, o.to));
  S.turn++;
  return true;
}
function endTurn(S) { recordStats(S); checkVictory(S); }
function nextTurn(S) {
  if (!beginTurn(S)) return;
  for (let i = 0; i < S.rules.ticksPerTurn && !S.winner; i++) tick(S);
  endTurn(S);
}
function recordStats(S) {
  S.stats.push({ turn:S.turn, tick:S.tick, p:S.players.map(p => {
    const t = totals(S, p.id);
    return { stars:t.stars, ships:t.ships, econ:t.econ, industry:t.industry, science:t.science, credits:p.credits };
  }) });
}

/* ---------------- admin (god mode) ---------------- */
const admin = {
  forceAlliance(S, a, b, locked) {
    const al = alliance(S, a, b);
    if (al) { al.locked = !!locked || al.locked; al.warBy = null; al.endsAt = null; return al; }
    return formAlliance(S, a, b, { by:"admin", locked });
  },
  setLocked(S, a, b, locked) {
    const al = alliance(S, a, b); if (!al) return false;
    al.locked = locked;
    if (locked) { al.warBy = null; al.endsAt = null; }
    log(S, "diplomacy", `Admin ${locked ? "locked" : "unlocked"} the alliance of ${P(S, a).name} and ${P(S, b).name}.`, [a, b]);
    return true;
  },
  breakAlliance(S, a, b, instant) {
    const al = alliance(S, a, b); if (!al) return false;
    al.locked = false;
    if (al.warBy != null) { if (instant) endAlliance(S, al, "admin"); return !!instant; }  // already counting down
    return declareWar(S, a, b, { admin:true, instant });
  },
  setBanned(S, a, b, on) {
    const k = pairKey(a, b), list = S.settings.banned;
    if (on && !list.includes(k)) list.push(k);
    if (!on) S.settings.banned = list.filter(x => x !== k);
  },
  lockAllNow(S) { S.alliances.forEach(al => { if (al.ended == null) { al.locked = true; al.warBy = null; al.endsAt = null; } }); },
  give(S, id, credits, ships) {
    const p = P(S, id); p.credits += credits || 0;
    const home = starsOf(S, id).sort((a, b) => b.industry - a.industry)[0];
    if (home && ships) home.ships += ships;
    log(S, "system", `Admin gave ${p.name}${credits ? ` $${credits}` : ""}${ships ? ` ${ships} ships` : ""}.`, [id]);
  },
  /* give a carrier waypoint orders; returns "" or the reason it can't */
  setRoute(S, carrierId, stops, loop) {
    const c = S.carriers.find(x => x.id === carrierId); if (!c) return "That carrier no longer exists.";
    stops = stops.map(x => ({ star:+x.star, action:ACTIONS[x.action] ? x.action : "none",
      n:Math.max(0, Math.floor(+x.n || 0)), delay:clamp(Math.floor(+x.delay || 0), 0, 99) }));
    const why = checkRoute(S, c, stops, !!loop); if (why) return why;
    c.route = stops; c.loop = !!loop && stops.length > 1; c.routeBy = stops.length ? "admin" : null;
    runHere(S, c);
    if (c.at != null && !stops.length) c.wait = 0;
    log(S, "orders", stops.length ? `Admin gave ${P(S, c.owner).name}'s carrier ${stops.length} waypoint${stops.length > 1 ? "s" : ""}${c.loop ? " on a loop" : ""}.`
      : `Admin cleared the orders of a ${P(S, c.owner).name} carrier.`, [c.owner]);
    return "";
  },
  /* move ships between a parked carrier and the star it's at: n > 0 loads the carrier */
  transfer(S, carrierId, n) {
    const c = S.carriers.find(x => x.id === carrierId); if (!c || c.at == null) return false;
    const star = S.stars[c.at]; if (star.owner !== c.owner) return false;
    const t = clamp(-n, -star.ships, c.ships);
    c.ships -= t; star.ships += t;
    return true;
  },
  /* buy a carrier at a star for its owner (real cost); returns the carrier or a reason */
  buildCarrier(S, starId) {
    const s = S.stars[starId]; if (!s || s.owner < 0) return "Only an owned star can build a carrier.";
    const p = P(S, s.owner);
    if (p.credits < S.rules.carrierCost) return `${p.name} needs $${S.rules.carrierCost} for a carrier.`;
    p.credits -= S.rules.carrierCost;
    const c = { id:S.nextId++, owner:s.owner, ships:0, at:s.id };
    S.carriers.push(c);
    c.ships = s.ships; s.ships = 0;                               // the garrison boards, like the real game's default
    log(S, "orders", `Admin built a carrier for ${p.name} at ${s.name}.`, [s.owner], s.id);
    return c;
  },
  setPersona(S, id, persona) { if (PERSONAS[persona]) P(S, id).persona = persona; },
  /* who the person plays (null = nobody; every seat is a bot) */
  setHuman(S, id) {
    S.players.forEach(p => p.human = p.id === id);
    if (id == null) S.offers = [];
    log(S, "system", id == null ? "Every empire is a bot again." : `You now play ${P(S, id).name}; the others are bots.`, id == null ? [] : [id]);
  },
  setOpinion(S, a, b, v) { S.rel[a][b] = clamp(v, -100, 100); },
};

/* ---------------- a person's orders ----------------
   The same moves the real game gives a player. Each returns "" on success or a
   plain-English reason it can't be done, so the viewer can show it. */
const act = {
  buy(S, pid, starId, kind) {
    const p = P(S, pid), s = S.stars[starId];
    if (!BASE_KEY[kind] && kind !== "gate") return "Unknown upgrade.";
    if (!s || s.owner !== pid) return "You can only build at your own stars.";
    if (kind === "gate" && !S.rules.gatesOn) return "Warp gates are off in this game.";
    if (kind === "gate" && s.gate) return `${s.name} already has a warp gate.`;
    const cost = infraCost(S, s, kind);
    if (p.credits < cost) return `Needs $${cost}, you have $${p.credits}.`;
    p.credits -= cost;
    if (kind === "gate") { s.gate = 1; log(S, "orders", `${p.name} built a warp gate at ${s.name}.`, [pid]); } else s[kind]++;
    return "";
  },
  /* spend up to `budget` on `kind`, cheapest star first, like the real game's bulk upgrade */
  buyBulk(S, pid, kind, budget) {
    const p = P(S, pid); let spent = 0, n = 0;
    for (let g = 0; g < 500; g++) {
      let best = null, cost = Infinity;
      for (const s of starsOf(S, pid)) { const c = infraCost(S, s, kind); if (c < cost) { cost = c; best = s; } }
      if (!best || spent + cost > budget || p.credits < cost) break;
      p.credits -= cost; best[kind]++; spent += cost; n++;
    }
    return { spent, n };
  },
  research(S, pid, tech) { if (!techsOn(S).includes(tech)) return "Unknown tech."; P(S, pid).researching = tech; return ""; },
  researchNext(S, pid, tech) { if (!techsOn(S).includes(tech)) return "Unknown tech."; P(S, pid).researchingNext = tech; return ""; },
  /* send n ships from a star (garrison + own parked carriers) to a star within jump range;
     builds a carrier there first if none is parked */
  send(S, pid, fromId, toId, n) {
    const from = S.stars[fromId], to = S.stars[toId];
    if (!from || !to || from === to) return "Pick a different destination.";
    const parked = S.carriers.some(c => c.at === fromId && c.owner === pid);
    if (from.owner !== pid && !parked) return "You have nothing at that star.";
    if (dist(from, to) > range(S, pid) + 1e-9) return `Out of range: ${dist(from, to).toFixed(1)} ly, your range is ${range(S, pid)} ly.`;
    if (!parked && P(S, pid).credits < S.rules.carrierCost) return `A new carrier costs $${S.rules.carrierCost}.`;
    n = Math.floor(n);
    if (!(n >= 1)) return "Send at least 1 ship.";
    const c = launch(S, pid, from, to, n);
    return c ? "" : "Not enough ships there.";
  },
  propose(S, pid, other) {
    const p = P(S, pid), q = P(S, other);
    if (!q || !q.alive || pid === other) return "Pick another living empire.";
    if (allied(S, pid, other)) return "Already allies.";
    if (isBanned(S, pid, other)) return "The admin has banned this pair from allying.";
    const offer = (S.offers || []).find(o => o.from === other && o.to === pid);
    if (offer) return act.accept(S, pid, other);
    if (p.credits < S.rules.allianceFee) return `Proposing costs $${S.rules.allianceFee}.`;
    p.credits -= S.rules.allianceFee;
    const qp = PERSONAS[q.persona];
    if (appeal(S, other, pid) >= qp.allyAt - 10 && alliesOf(S, other).length < qp.maxAllies) {
      formAlliance(S, pid, other, { by:"player" });
      S.rel[other][pid] = clamp(S.rel[other][pid] + 10, -100, 100);
      return "";
    }
    S.rel[other][pid] = clamp(S.rel[other][pid] - 2, -100, 100);
    log(S, "diplomacy", `${q.name} turned down an alliance with ${p.name}.`, [pid, other]);
    return `${q.name} said no.`;
  },
  accept(S, pid, other) {
    const i = (S.offers || []).findIndex(o => o.from === other && o.to === pid);
    if (i < 0) return "That offer has lapsed.";
    S.offers.splice(i, 1);
    if (!formAlliance(S, other, pid, { by:"bots" })) return "Couldn't form that alliance.";
    S.rel[other][pid] = clamp(S.rel[other][pid] + 10, -100, 100);
    return "";
  },
  decline(S, pid, other) {
    S.offers = (S.offers || []).filter(o => !(o.from === other && o.to === pid));
    S.rel[other][pid] = clamp(S.rel[other][pid] - 5, -100, 100);
    log(S, "diplomacy", `${P(S, pid).name} turned down an alliance with ${P(S, other).name}.`, [pid, other]);
    return "";
  },
  /* waypoint orders on your own carrier (same rules as the admin route editor) */
  route(S, pid, carrierId, stops, loop) {
    const c = S.carriers.find(x => x.id === carrierId);
    if (!c || c.owner !== pid) return "That isn't your carrier.";
    stops = stops.map(x => ({ star:+x.star, action:ACTIONS[x.action] ? x.action : "none",
      n:Math.max(0, Math.floor(+x.n || 0)), delay:clamp(Math.floor(+x.delay || 0), 0, 99) }));
    const why = checkRoute(S, c, stops, !!loop); if (why) return why;
    c.route = stops; c.loop = !!loop && stops.length > 1; c.routeBy = stops.length ? "player" : null;
    runHere(S, c);
    if (c.at != null && !stops.length) c.wait = 0;
    return "";
  },
  /* the transfer screen: move n ships at a star between "star" (garrison) and carrier ids */
  shift(S, pid, starId, from, to, n) { return moveShips(S, pid, starId, from, to, n); },
  /* buy a carrier with n ships from the garrison; returns the carrier or a reason */
  build(S, pid, starId, n) { return newCarrier(S, pid, starId, n); },
  /* split n ships off a parked carrier onto a new one ($25); returns the carrier or a reason */
  split(S, pid, carrierId, n) {
    const c = S.carriers.find(x => x.id === carrierId && x.owner === pid);
    if (!c || c.at == null) return "Only a carrier in orbit can split.";
    return newCarrier(S, pid, c.at, n, c.id);
  },
  merge(S, pid, starId) { return mergeCarriers(S, pid, starId); },
  even(S, pid, starId) { return evenSplit(S, pid, starId); },
  /* move ships between your parked carrier and your star: n > 0 loads the carrier */
  transfer(S, pid, carrierId, n) {
    const c = S.carriers.find(x => x.id === carrierId);
    if (!c || c.owner !== pid || c.at == null || S.stars[c.at].owner !== pid) return "Only at your own star.";
    const star = S.stars[c.at], t = clamp(-n, -star.ships, c.ships);
    c.ships -= t; star.ships += t;
    return "";
  },
  war(S, pid, other) {
    const al = alliance(S, pid, other);
    if (!al) return "You aren't allied.";
    if (al.locked) return "This alliance is locked by the admin.";
    if (al.warBy != null) return "War is already declared.";
    return declareWar(S, pid, other) ? "" : "Couldn't declare war.";
  },
};

const API = { techsOn, speedBetween, ticksBetween, ACTIONS, transferFor, routePath, checkRoute, SUPPLY_LINES, RULE_LIST, GALAXY_TYPES, DEFAULT_GALAXY, checkVictory, TECHS, TECH_LABEL, SEATS, PERSONAS, DEFAULT_LINEUP, DEFAULT_SETTINGS,
  defaultRules, newGame, nextTurn, beginTurn, endTurn, tick, admin, act,
  range, resources, infraCost, researchCost, shipsPerCycle, totals, starsOf, winTarget,
  alliance, allied, alliesOf, carrierPos, scanRange, scanSources, inScan, eta, fight, shipsToWin, pairKey, dist };
if (typeof module !== "undefined") module.exports = API; else root.NPSim = API;
})(typeof window !== "undefined" ? window : globalThis);
