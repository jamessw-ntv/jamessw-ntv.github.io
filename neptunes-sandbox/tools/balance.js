#!/usr/bin/env node
/* Headless balance sweep: plays many bot-only games and reports win share by
   seat, by personality and by galaxy type. Runs on every CPU core.

     node neptunes-sandbox/tools/balance.js                 # default sweep
     node neptunes-sandbox/tools/balance.js --seeds 20 --sizes 6 --galaxies hexgrid
     node neptunes-sandbox/tools/balance.js --mirror standard   # every seat the same bot: seat fairness only
     node neptunes-sandbox/tools/balance.js --tweak '{"turtle":{"keep":0.4}}'   # try a persona change first
     node neptunes-sandbox/tools/balance.js --settings '{"botTrade":false}'  # house-rule settings for every game
   Other flags: --pool warlord,turtle,...  --base <first seed>  --detail (galaxy × seat)  --cores N

   Lineups are rotated (a Latin square) so every personality sits in every seat
   equally often; for smaller games every personality subset is rotated too.
   A shared (coalition) win counts as 1/k of a win for each of the k winners.
   "Fair share" is 1 ÷ empires, so every rate is shown as a multiple of it (1.00 = fair). */
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const path = require("path");
const sim = require(path.join(__dirname, "..", "sim.js"));

/* --tweak '{"turtle":{"keep":0.4}}' tries persona changes without editing sim.js */
const tweak = t => { for (const k in t) Object.assign(sim.PERSONAS[k] = sim.PERSONAS[k] || {}, t[k]); };
if (!isMainThread) {
  tweak(workerData.tweak);
  for (const job of workerData.jobs) {
    const S = sim.newGame(job.opts);
    Object.assign(S.settings, workerData.settings);
    while (!S.winner) sim.nextTurn(S);
    const cx = S.stars.reduce((t, s) => t + s.x, 0) / S.stars.length, cy = S.stars.reduce((t, s) => t + s.y, 0) / S.stars.length;
    parentPort.postMessage({ job, ids:S.winner.ids, how:S.winner.how, turn:S.winner.turn,
      homes:S.players.map(p => { const h = S.stars[p.home]; return Math.hypot(h.x - cx, h.y - cy); }) });
  }
  return;
}

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const seeds = +arg("seeds", 10);
const sizes = arg("sizes", "3,4,6").split(",").map(Number);
const galaxies = arg("galaxies", Object.keys(sim.GALAXY_TYPES).join(",")).split(",");
const mirror = arg("mirror", null);
const pool = arg("pool", sim.DEFAULT_LINEUP.join(",")).split(",");
const cores = +arg("cores", require("os").cpus().length);

// every k-subset of the pool; each game batch shuffles the subset (so neighbours vary) and then
// rotates it through all k seats (so every personality sits in every seat equally often)
function subsets(arr, k) { if (!k) return [[]]; if (arr.length < k) return [];
  return subsets(arr.slice(1), k - 1).map(s => [arr[0], ...s]).concat(subsets(arr.slice(1), k)); }
function shuffled(arr, seed) { const a = arr.slice(); let x = seed;
  for (let i = a.length - 1; i > 0; i--) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const jobs = [], base = +arg("base", 1000);
for (const galaxy of galaxies) for (const k of sizes) {
  const groups = mirror ? [Array(k).fill(mirror)] : subsets(pool, k);
  // keep the game count per size similar: 6 of 6 is one group, 3 of 6 is twenty
  const per = Math.max(1, Math.round(seeds * 6 / (groups.length * k)));
  groups.forEach((sub, gi) => { for (let s = 0; s < per; s++) {
    const perm = shuffled(sub, base + gi * 131 + s * 17 + k);
    for (let r = 0; r < k; r++) { const lineup = perm.map((_, i) => perm[(i + r) % k]);
      jobs.push({ galaxy, k, lineup, opts:{ seed:base + gi * 97 + s * 7919 + r * 613 + k, lineup, galaxy } }); } } });
}

const t0 = Date.now(), results = [];
let done = 0;
const chunks = Array.from({ length:cores }, (_, i) => jobs.filter((_, j) => j % cores === i));
Promise.all(chunks.map(c => new Promise((res, rej) => {
  const w = new Worker(__filename, { workerData:{ jobs:c, tweak:JSON.parse(arg("tweak", "{}")), settings:JSON.parse(arg("settings", "{}")) } });
  w.on("message", m => { results.push(m); if (++done % 200 === 0) process.stderr.write(`${done}/${jobs.length} games\n`); });
  w.on("error", rej); w.on("exit", res);
}))).then(report);

function report() {
  const tally = () => ({ games:0, wins:0, fair:0 });
  const bySeat = {}, byPersona = {}, bySize = {}, byGalaxy = {}, byGalaxySeat = {}, byCentre = {}, how = {}, turns = [];
  const add = (m, key, n, won) => { const t = m[key] = m[key] || tally(); t.games++; t.wins += won; t.fair += 1 / n; };
  for (const r of results) {
    const { k, lineup, galaxy } = r.job;
    how[r.how] = (how[r.how] || 0) + 1; turns.push(r.turn);
    const rank = r.homes.map((d, i) => i).sort((a, b) => r.homes[a] - r.homes[b]);   // 0 = nearest the centre
    for (let i = 0; i < k; i++) {
      const won = r.ids.includes(i) ? 1 / r.ids.length : 0;
      add(bySeat, `${k}p seat ${i}`, k, won);
      add(byPersona, lineup[i], k, won);
      add(bySize, `${k}p ${lineup[i]}`, k, won);
      add(byGalaxy, `${galaxy} ${lineup[i]}`, k, won);
      add(byGalaxySeat, `${galaxy} ${k}p seat ${i}`, k, won);
      add(byCentre, `${k}p ${["inner", "middle", "outer"][Math.min(2, Math.floor(rank.indexOf(i) * 3 / k))]}`, k, won);
    }
  }
  const table = (title, m) => {
    console.log(`\n${title}`);
    Object.keys(m).sort().forEach(key => { const t = m[key];
      console.log(`  ${key.padEnd(26)} ${String(t.games).padStart(5)} games  ${(100 * t.wins / t.games).toFixed(1).padStart(5)}% wins  ×${(t.wins / t.fair).toFixed(2)} fair`); });
  };
  console.log(`${results.length} games in ${((Date.now() - t0) / 1000).toFixed(0)}s; ${JSON.stringify(how)}; median length ${turns.sort((a, b) => a - b)[turns.length >> 1]} turns`);
  table("By seat", bySeat);
  table("By home position (distance from galaxy centre)", byCentre);
  table("By personality", byPersona);
  if (sizes.length > 1 && !mirror) table("By empires × personality", bySize);
  if (galaxies.length > 1 && !mirror) table("By galaxy × personality", byGalaxy);
  if (process.argv.includes("--detail")) table("By galaxy × seat", byGalaxySeat);
}
