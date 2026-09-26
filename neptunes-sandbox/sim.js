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
                  spend:{ econ:.35, industry:.50, science:.15 }, research:["weapons","manufacturing","range"],
                  blurb:"Builds ships, attacks early, allies only for convenience." },
  turtle:       { label:"Turtle",       aggr:.25, treach:.05, allyAt:15, maxAllies:2, keep:.50,
                  spend:{ econ:.45, industry:.35, science:.20 }, research:["weapons","banking","terraforming"],
                  blurb:"Defends what it has, rarely strikes first, very loyal." },
  diplomat:     { label:"Diplomat",     aggr:.50, treach:.02, allyAt:5,  maxAllies:3, keep:.30,
                  spend:{ econ:.40, industry:.35, science:.25 }, research:["range","banking","weapons"],
                  blurb:"Collects allies and keeps its word." },
  opportunist:  { label:"Opportunist",  aggr:.65, treach:.45, allyAt:10, maxAllies:2, keep:.25,
                  spend:{ econ:.35, industry:.45, science:.20 }, research:["weapons","range","manufacturing"],
                  blurb:"Friendly until you look weak." },
  economist:    { label:"Economist",    aggr:.45, treach:.15, allyAt:10, maxAllies:2, keep:.35,
                  spend:{ econ:.45, industry:.40, science:.15 }, research:["banking","terraforming","experimentation","manufacturing"],
                  blurb:"Grows the economy first, fights later." },
  expansionist: { label:"Expansionist", aggr:.55, treach:.25, allyAt:20, maxAllies:1, keep:.20,
                  spend:{ econ:.30, industry:.50, science:.20 }, research:["range","manufacturing","terraforming"],
                  blurb:"Grabs empty stars as fast as range allows." },
};
const DEFAULT_LINEUP = ["warlord", "diplomat", "opportunist", "turtle", "economist", "expansionist"];

const DEFAULT_SETTINGS = {
  lockAll: false,        // every new alliance is born locked (unbreakable)
  betrayal: 1,           // multiplier on every bot's treachery (0 = nobody ever betrays)
  instantBreak: false,   // skip the 24-tick notice when an alliance is broken
  coalitionWin: true,    // a locked bloc holding the win % of stars wins together
  maxTurns: 400,         // hard stop; most stars wins
  banned: [],            // "a-b" pairs the bots may never ally
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

function log(S, type, text, players) {
  S.events.push({ tick:S.tick, turn:S.turn, type, text, players:players || [] });
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
    winner:null, nextId:1,
  };
  S.settings.banned = (S.settings.banned || []).slice();

  // players
  lineup.forEach((persona, i) => {
    const tech = {};
    TECHS.forEach(t => tech[t] = { level:rules.startTech, rp:0 });
    S.players.push({ id:i, name:SEATS[i].name, color:SEATS[i].color, persona,
      credits:rules.startCredits, tech, researching:PERSONAS[persona].research[0],
      alive:true, outTurn:null });
  });
  const n = S.players.length;
  S.rel = S.players.map(a => S.players.map(b => a === b ? 0 :
    Math.round((rand(S) - .5) * 10 + (a.persona === "diplomat" ? 10 : 0) + (a.persona === "warlord" ? -5 : 0))));

  // stars: rejection-sampled so none sit on top of each other
  const perPlayer = clamp(opts.starsPerPlayer || 12, 4, 40);
  const total = n * perPlayer;
  const side = Math.sqrt(total * 1.9);
  const names = new Set();
  let guard = 0;
  while (S.stars.length < total && guard++ < total * 400) {
    const p = { x:rand(S) * side, y:rand(S) * side };
    if (S.stars.some(s => dist(s, p) < .85)) continue;
    let name; do { name = pick(S, STAR_A) + pick(S, STAR_B); } while (names.has(name));
    names.add(name);
    S.stars.push({ id:S.stars.length, name, x:+p.x.toFixed(2), y:+p.y.toFixed(2),
      res: 5 + Math.floor(rand(S) * rand(S) * 45),
      owner:-1, econ:0, industry:0, science:0, ships:0, frac:0 });
  }
  S.width = side; S.height = side;

  // homes evenly spaced on a ring, so no seat starts boxed in the middle
  const homes = [], spin = rand(S) * Math.PI * 2, c = side / 2;
  for (let i = 0; i < n; i++) {
    const ang = spin + i * Math.PI * 2 / n, target = { x:c + Math.cos(ang) * side * .36, y:c + Math.sin(ang) * side * .36 };
    homes.push(S.stars.filter(s => !homes.includes(s)).sort((a, b) => dist(a, target) - dist(b, target))[0]);
  }
  homes.forEach((h, i) => {
    Object.assign(h, { owner:i, res:rules.homeResources, econ:rules.startEcon,
      industry:rules.startIndustry, science:rules.startScience, ships:rules.startShips });
    S.players[i].home = h.id;
    const near = S.stars.filter(s => s.owner < 0).sort((a, b) => dist(a, h) - dist(b, h));
    near.slice(0, Math.max(0, rules.startStars - 1)).forEach(s => { s.owner = i; s.ships = rules.startShips; });
  });

  log(S, "system", `New galaxy: ${S.stars.length} stars, ${n} empires, seed ${seed}.`);
  recordStats(S);
  return S;
}

/* ---------------- derived values ---------------- */
const P = (S, id) => S.players[id];
const lvl = (S, id, t) => S.players[id].tech[t].level;
function range(S, id) { return lvl(S, id, "range") + S.rules.rangeBase; }
function resources(S, star) {
  return star.res + (star.owner >= 0 ? lvl(S, star.owner, "terraforming") * S.rules.terraformBonus : 0);
}
const BASE_KEY = { econ:"econBaseCost", industry:"industryBaseCost", science:"scienceBaseCost" };
function infraCost(S, star, kind) {
  return Math.floor((star[kind] + 1) * S.rules[BASE_KEY[kind]] / (resources(S, star) + 5));
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
      log(S, "expansion", `${P(S, claimer).name} claimed ${star.name}.`, [claimer]);
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
    S.carriers = S.carriers.filter(c => c.ships > 0 || c.at == null);
    const aName = sides.map(id => P(S, id).name).join(" + "), dName = P(S, owner).name;
    sides.forEach(id => S.rel[owner][id] = clamp(S.rel[owner][id] - (r.def <= 0 ? 12 : 4), -100, 100));
    if (r.def <= 0) {
      const inOrbit = {};
      S.carriers.forEach(c => { if (c.at === star.id && c.ships > 0) inOrbit[c.owner] = (inOrbit[c.owner] || 0) + c.ships; });
      const winner = +Object.keys(inOrbit).sort((a, b) => inOrbit[b] - inOrbit[a])[0];
      const cash = star.econ * S.rules.captureCashPerEcon;
      P(S, winner).credits += cash;
      log(S, "combat", `${P(S, winner).name} captured ${star.name} from ${dName} (${attShips} vs ${defShips} ships${sides.length > 1 ? `, attackers ${aName}` : ""}, ${r.att} left${cash ? `, +$${cash}` : ""}).`, [...sides, owner]);
      star.owner = winner; star.econ = 0; star.ships = 0; star.frac = 0;
    } else {
      log(S, "combat", `${dName} held ${star.name} against ${aName} (${attShips} vs ${defShips} ships, ${r.def} left).`, [...sides, owner]);
    }
  }
}

/* ---------------- carriers ---------------- */
/* Pull `n` ships from a star (garrison first, then own parked carriers) into one carrier heading to `to`. */
function launch(S, pid, from, to, n) {
  const parked = S.carriers.filter(c => c.at === from.id && c.owner === pid);
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
  S.carriers = S.carriers.filter(c => c === carrier || c.ships > 0);
  carrier.ships = n;
  carrier.at = null; carrier.from = from.id; carrier.to = to.id;
  carrier.len = dist(from, to); carrier.done = 0;
  return carrier;
}
function carrierPos(S, c) {
  if (c.at != null) return S.stars[c.at];
  const a = S.stars[c.from], b = S.stars[c.to], f = c.len ? c.done / c.len : 1;
  return { x:a.x + (b.x - a.x) * f, y:a.y + (b.y - a.y) * f };
}
function eta(S, c) { return c.at != null ? 0 : Math.ceil((c.len - c.done) / S.rules.carrierSpeed); }

/* ---------------- the tick ---------------- */
function tick(S) {
  if (S.winner) return;
  S.tick++;
  const R = S.rules;

  // 1. movement
  const landed = new Set();
  for (const c of S.carriers) if (c.at == null) {
    c.step = Math.min(R.carrierSpeed, c.len - c.done); c.done += R.carrierSpeed;
    if (c.done >= c.len - 1e-9) { c.at = c.to; landed.add(c.to); }
  }
  landed.forEach(id => resolveStar(S, S.stars[id]));

  // 2. ship production (fractional, every tick)
  for (const s of S.stars) if (s.owner >= 0) {
    s.frac += shipsPerCycle(S, s) / R.productionTicks;
    const whole = Math.floor(s.frac);
    if (whole > 0) { s.ships += whole; s.frac -= whole; }
  }

  // 3. research (every tick)
  for (const p of S.players) if (p.alive) {
    const sci = S.stars.reduce((t, s) => t + (s.owner === p.id ? s.science : 0), 0);
    addResearch(S, p, p.researching, sci * R.sciencePerTick);
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

function addResearch(S, p, t, rp) {
  const tech = p.tech[t];
  tech.rp += rp;
  let cost;
  while (tech.rp >= (cost = researchCost(S, p.id, t))) {
    tech.rp -= cost; tech.level++;
    log(S, "research", `${p.name} reached ${TECH_LABEL[t]} ${tech.level}.`, [p.id]);
  }
}

function production(S) {
  const R = S.rules;
  for (const p of S.players) if (p.alive) {
    const econ = S.stars.reduce((t, s) => t + (s.owner === p.id ? s.econ : 0), 0);
    p.credits += econ * (R.econCredits + p.tech.banking.level * R.bankingPerEcon) + p.tech.banking.level * R.bankingFlat;
    const x = p.tech.experimentation.level;
    if (x > 0) addResearch(S, p, pick(S, TECHS), x * R.experimentationRP);
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
  botMilitary(S, p, persona);
  botSpend(S, p, persona);
}

function botResearch(S, p, persona) {
  const order = persona.research;
  let best = order[0];
  order.forEach((t, i) => { if (p.tech[t].level + i * .5 < p.tech[best].level + order.indexOf(best) * .5) best = t; });
  p.researching = best;
}

function botSpend(S, p, persona) {
  const reserve = S.rules.carrierCost * 2 + (alliesOf(S, p.id).length < persona.maxAllies ? S.rules.allianceFee : 0);
  const mine = starsOf(S, p.id);
  if (!mine.length) return;
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
    const parked = S.carriers.filter(c => c.at === s.id && c.owner === p.id).reduce((t, c) => t + c.ships, 0);
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
      const ticks = Math.ceil(d / R.carrierSpeed);
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

/* ---------------- turns & stats ---------------- */
function nextTurn(S) {
  if (S.winner) return;
  const order = S.players.filter(p => p.alive).map(p => p.id);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand(S) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  order.forEach(id => botTurn(S, P(S, id)));
  S.turn++;
  for (let i = 0; i < S.rules.ticksPerTurn && !S.winner; i++) tick(S);
  recordStats(S);
  checkVictory(S);
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
  setPersona(S, id, persona) { if (PERSONAS[persona]) P(S, id).persona = persona; },
  setOpinion(S, a, b, v) { S.rel[a][b] = clamp(v, -100, 100); },
};

const API = { RULE_LIST, checkVictory, TECHS, TECH_LABEL, SEATS, PERSONAS, DEFAULT_LINEUP, DEFAULT_SETTINGS,
  defaultRules, newGame, nextTurn, tick, admin,
  range, resources, infraCost, researchCost, shipsPerCycle, totals, starsOf, winTarget,
  alliance, allied, alliesOf, carrierPos, eta, fight, shipsToWin, pairKey, dist };
if (typeof module !== "undefined") module.exports = API; else root.NPSim = API;
})(typeof window !== "undefined" ? window : globalThis);
