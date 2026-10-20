/* Factorio endgame planner — data + solver + layout engine.
   Recipes, machines and modules are datamined from wube/factorio-data (base mod 2.1.21):
   base/prototypes/recipe.lua, item.lua, entity/entities.lua. Don't edit them from memory.
   Runs in the browser and in node (module.exports at the bottom) so it can be tested. */

// ---------- machines (entities.lua) ----------------------------------------------------
const MACHINES = {
  asm:   { name: "Assembling machine 3", speed: 1.25, slots: 4, kw: 375, size: 3 },
  furn:  { name: "Electric furnace",     speed: 2,    slots: 2, kw: 180, size: 3 },
  chem:  { name: "Chemical plant",       speed: 1,    slots: 3, kw: 210, size: 3 },
  ref:   { name: "Oil refinery",         speed: 1,    slots: 3, kw: 420, size: 5 },
  silo:  { name: "Rocket silo",          speed: 1,    slots: 4, kw: 250, size: 9 },
};
const BEACON = { kw: 480, slots: 2, eff: 1.5, // distribution_effectivity
  profile: [1,0.7071,0.5773,0.5,0.4472,0.4082,0.3779,0.3535,0.3333,0.3162,0.3015,0.2886] };
const SPEED3 = { speed: 0.5, cons: 0.7 };
const PROD3 = { prod: 0.1, speed: -0.15, cons: 0.8 };
const DRILL = { rate: 0.5, kw: 90 };       // electric mining drill, mining_speed 0.5
const BELT = 45;                            // express (blue) belt, items/s
const PUMPJACK = 10;                        // crude/s at 100% yield

// ---------- recipes (recipe.lua). t = energy_required (default 0.5), out = result amount --
// p:true = allow_productivity in 2.x base.
const R = {
  "iron-plate":        { m:"furn", t:3.2, out:1, p:true, in:{ "iron-ore":1 } },
  "copper-plate":      { m:"furn", t:3.2, out:1, p:true, in:{ "copper-ore":1 } },
  "stone-brick":       { m:"furn", t:3.2, out:1, p:true, in:{ "stone":2 } },
  "steel-plate":       { m:"furn", t:16,  out:1, p:true, in:{ "iron-plate":5 } },
  "iron-gear-wheel":   { m:"asm", t:0.5, out:1, p:true, in:{ "iron-plate":2 } },
  "copper-cable":      { m:"asm", t:0.5, out:2, p:true, in:{ "copper-plate":1 } },
  "iron-stick":        { m:"asm", t:0.5, out:2, p:true, in:{ "iron-plate":1 } },
  "pipe":              { m:"asm", t:0.5, out:1,          in:{ "iron-plate":1 } },
  "electronic-circuit":{ m:"asm", t:0.5, out:1, p:true, in:{ "iron-plate":1, "copper-cable":3 } },
  "advanced-circuit":  { m:"asm", t:6,   out:1, p:true, in:{ "electronic-circuit":2, "plastic-bar":2, "copper-cable":4 } },
  "processing-unit":   { m:"asm", t:10,  out:1, p:true, in:{ "electronic-circuit":20, "advanced-circuit":2, "sulfuric-acid":5 } },
  "plastic-bar":       { m:"chem", t:1,  out:2, p:true, in:{ "petroleum-gas":20, "coal":1 } },
  "sulfur":            { m:"chem", t:1,  out:2, p:true, in:{ "water":30, "petroleum-gas":30 } },
  "sulfuric-acid":     { m:"chem", t:1,  out:50, p:true, in:{ "sulfur":5, "iron-plate":1, "water":100 } },
  "lubricant":         { m:"chem", t:1,  out:10, p:true, in:{ "heavy-oil":10 } },
  "battery":           { m:"chem", t:4,  out:1, p:true, in:{ "sulfuric-acid":20, "iron-plate":1, "copper-plate":1 } },
  "solid-fuel":        { m:"chem", t:1,  out:1, p:true, in:{ "light-oil":10 } },
  "rocket-fuel":       { m:"asm", t:15,  out:1, p:true, in:{ "solid-fuel":10, "light-oil":10 } },
  "engine-unit":       { m:"asm", t:10,  out:1, p:true, in:{ "steel-plate":1, "iron-gear-wheel":1, "pipe":2 } },
  "electric-engine-unit":{ m:"asm", t:10, out:1, p:true, in:{ "engine-unit":1, "lubricant":15, "electronic-circuit":2 } },
  "flying-robot-frame":{ m:"asm", t:20,  out:1, p:true, in:{ "electric-engine-unit":1, "battery":2, "steel-plate":1, "electronic-circuit":3 } },
  "inserter":          { m:"asm", t:0.5, out:1,          in:{ "electronic-circuit":1, "iron-gear-wheel":1, "iron-plate":1 } },
  "transport-belt":    { m:"asm", t:0.5, out:2,          in:{ "iron-plate":1, "iron-gear-wheel":1 } },
  "firearm-magazine":  { m:"asm", t:1,   out:1,          in:{ "iron-plate":4 } },
  "piercing-rounds-magazine":{ m:"asm", t:6, out:2,      in:{ "firearm-magazine":2, "steel-plate":1, "copper-plate":2 } },
  "grenade":           { m:"asm", t:8,   out:1,          in:{ "iron-plate":5, "coal":10 } },
  "stone-wall":        { m:"asm", t:0.5, out:1,          in:{ "stone-brick":5 } },
  "electric-furnace":  { m:"asm", t:5,   out:1,          in:{ "steel-plate":10, "advanced-circuit":5, "stone-brick":10 } },
  "productivity-module":{ m:"asm", t:15, out:1,          in:{ "advanced-circuit":5, "electronic-circuit":5 } },
  "rail":              { m:"asm", t:0.5, out:2,          in:{ "stone":1, "iron-stick":1, "steel-plate":1 } },
  "low-density-structure":{ m:"asm", t:15, out:1, p:true, in:{ "steel-plate":2, "copper-plate":20, "plastic-bar":5 } },
  "solar-panel":       { m:"asm", t:10,  out:1,          in:{ "steel-plate":5, "electronic-circuit":15, "copper-plate":5 } },
  "accumulator":       { m:"asm", t:10,  out:1,          in:{ "iron-plate":2, "battery":5 } },
  "radar":             { m:"asm", t:0.5, out:1,          in:{ "electronic-circuit":5, "iron-gear-wheel":5, "iron-plate":10 } },
  "satellite":         { m:"asm", t:5,   out:1,          in:{ "low-density-structure":100, "solar-panel":100, "accumulator":100, "radar":5, "processing-unit":100, "rocket-fuel":50 } },
  "rocket-part":       { m:"silo", t:3,  out:1, p:true, in:{ "processing-unit":10, "low-density-structure":10, "rocket-fuel":10 } },
  "automation-science-pack": { m:"asm", t:5,  out:1, p:true, in:{ "copper-plate":1, "iron-gear-wheel":1 } },
  "logistic-science-pack":   { m:"asm", t:6,  out:1, p:true, in:{ "inserter":1, "transport-belt":1 } },
  "military-science-pack":   { m:"asm", t:10, out:2, p:true, in:{ "piercing-rounds-magazine":1, "grenade":1, "stone-wall":2 } },
  "chemical-science-pack":   { m:"asm", t:24, out:2, p:true, in:{ "engine-unit":2, "advanced-circuit":3, "sulfur":1 } },
  "production-science-pack": { m:"asm", t:21, out:3, p:true, in:{ "electric-furnace":1, "productivity-module":1, "rail":30 } },
  "utility-science-pack":    { m:"asm", t:21, out:3, p:true, in:{ "low-density-structure":3, "processing-unit":2, "flying-robot-frame":1 } },
  // A launch is not a machine recipe: rocket_parts_required = 100 (rocket-silo), satellite
  // rocket_launch_products = 1000 space science (item.lua). No machine is counted for it.
  "space-science-pack":      { m:null, t:0, out:1000, in:{ "rocket-part":100, "satellite":1 } },
};
// Oil (refinery + cracking) is solved as one block, not item by item.
const OIL = {
  aop:   { t:5, crude:100, water:50, heavy:25, light:45, pet:55 },     // advanced-oil-processing
  heavy: { t:2, heavy:40, water:30, light:30 },                        // heavy-oil-cracking
  light: { t:2, light:30, water:30, pet:20 },                          // light-oil-cracking
};
const FLUIDS = new Set(["heavy-oil","light-oil","petroleum-gas","crude-oil","water","sulfuric-acid","lubricant"]);
const RAW = ["iron-ore","copper-ore","stone","coal","crude-oil","water"];

const SCIENCE = [
  ["automation-science-pack","Automation (red)","#e5484d"],
  ["logistic-science-pack","Logistic (green)","#30a46c"],
  ["military-science-pack","Military (grey)","#8b8d98"],
  ["chemical-science-pack","Chemical (blue)","#3e9cf0"],
  ["production-science-pack","Production (purple)","#9e6cf0"],
  ["utility-science-pack","Utility (yellow)","#f0c000"],
  ["space-science-pack","Space (white)","#e9edf7"],
];

// ---------- blocks: what gets built where ---------------------------------------------
// makes = the shared outputs; local = sub-parts made inside the block (never shipped).
// Listed consumer-first so each block's demand is final before its suppliers are sized.
const BLOCKS = [
  { id:"labs",   name:"Research (labs)", color:"#e9edf7", makes:[], local:[], kind:"labs" },
  { id:"silo",   name:"Rocket silo + satellite", color:"#cfd6e6", makes:["space-science-pack"], local:["rocket-part","satellite","solar-panel","accumulator","radar","iron-gear-wheel"] },
  { id:"util",   name:"Utility science", color:"#f0c000", makes:["utility-science-pack"], local:[] },
  { id:"frames", name:"Robot frames", color:"#d9a441", makes:["flying-robot-frame"], local:["electric-engine-unit","engine-unit","iron-gear-wheel","pipe"] },
  { id:"prod",   name:"Production science", color:"#9e6cf0", makes:["production-science-pack"], local:["electric-furnace","productivity-module","rail","iron-stick"] },
  { id:"chem",   name:"Chemical science", color:"#3e9cf0", makes:["chemical-science-pack"], local:["engine-unit","iron-gear-wheel","pipe"] },
  { id:"mil",    name:"Military science", color:"#8b8d98", makes:["military-science-pack"], local:["piercing-rounds-magazine","firearm-magazine","grenade","stone-wall"] },
  { id:"log",    name:"Logistic science", color:"#30a46c", makes:["logistic-science-pack"], local:["inserter","transport-belt","iron-gear-wheel"] },
  { id:"auto",   name:"Automation science", color:"#e5484d", makes:["automation-science-pack"], local:["iron-gear-wheel"] },
  { id:"lds",    name:"Low density structure", color:"#c98a5b", makes:["low-density-structure"], local:[] },
  { id:"batt",   name:"Batteries", color:"#a0b84a", makes:["battery"], local:[] },
  { id:"blue",   name:"Processing units", color:"#4f7cff", makes:["processing-unit"], local:[] },
  { id:"red",    name:"Advanced circuits", color:"#d0504a", makes:["advanced-circuit"], local:["copper-cable"] },
  { id:"green",  name:"Electronic circuits", color:"#43b35c", makes:["electronic-circuit"], local:["copper-cable"] },
  { id:"oil",    name:"Oil refinery + chemicals", color:"#7c508b", makes:["plastic-bar","sulfur","sulfuric-acid","lubricant","rocket-fuel"], local:["solid-fuel"], kind:"oil" },
  { id:"steel",  name:"Steel smelting", color:"#8fa3b8", makes:["steel-plate"], local:[] },
  { id:"brick",  name:"Brick smelting", color:"#b58b6a", makes:["stone-brick"], local:[] },
  { id:"iron",   name:"Iron smelting", color:"#7d8ea8", makes:["iron-plate"], local:[] },
  { id:"copper", name:"Copper smelting", color:"#d27a45", makes:["copper-plate"], local:[] },
];

const NICE = {
  "iron-plate":"Iron plate","copper-plate":"Copper plate","stone-brick":"Stone brick","steel-plate":"Steel plate",
  "iron-gear-wheel":"Gear","copper-cable":"Copper cable","iron-stick":"Iron stick","pipe":"Pipe",
  "electronic-circuit":"Green circuit","advanced-circuit":"Red circuit","processing-unit":"Blue circuit",
  "plastic-bar":"Plastic","sulfur":"Sulfur","sulfuric-acid":"Sulfuric acid","lubricant":"Lubricant",
  "battery":"Battery","solid-fuel":"Solid fuel","rocket-fuel":"Rocket fuel","engine-unit":"Engine",
  "electric-engine-unit":"Electric engine","flying-robot-frame":"Robot frame","inserter":"Inserter",
  "transport-belt":"Belt","firearm-magazine":"Firearm magazine","piercing-rounds-magazine":"Piercing rounds",
  "grenade":"Grenade","stone-wall":"Wall","electric-furnace":"Electric furnace","productivity-module":"Prod module 1",
  "rail":"Rail","low-density-structure":"Low density structure","solar-panel":"Solar panel","accumulator":"Accumulator",
  "radar":"Radar","satellite":"Satellite","rocket-part":"Rocket part","iron-ore":"Iron ore","copper-ore":"Copper ore",
  "stone":"Stone","coal":"Coal","crude-oil":"Crude oil","water":"Water","heavy-oil":"Heavy oil","light-oil":"Light oil",
  "petroleum-gas":"Petroleum gas","automation-science-pack":"Red science","logistic-science-pack":"Green science",
  "military-science-pack":"Military science","chemical-science-pack":"Blue science","production-science-pack":"Purple science",
  "utility-science-pack":"Yellow science","space-science-pack":"Space science",
  "aop":"Advanced oil processing","heavy-crack":"Heavy oil cracking","light-crack":"Light oil cracking",
};
const nice = k => NICE[k] || k;

// ---------- module profiles ------------------------------------------------------------
// plain: empty machines. prod: Prod 3 in every machine whose recipe allows it.
// beacon: prod as above + N beacons (2x Speed 3 each) on every machine.
function effects(recipe, machineKey, opt){
  const m = MACHINES[machineKey];
  let speed = 0, prod = 0, cons = 0;
  if(opt.profile !== "plain" && recipe.p){ prod += PROD3.prod*m.slots; speed += PROD3.speed*m.slots; cons += PROD3.cons*m.slots; }
  if(opt.profile === "beacon"){
    const n = opt.beacons, f = n * BEACON.eff * (BEACON.profile[n-1]||0) * BEACON.slots;
    speed += SPEED3.speed * f; cons += SPEED3.cons * f;
  }
  const speedMul = Math.max(0.2, 1 + speed);
  return { speed: m.speed * speedMul, prod, cons: Math.max(-0.8, cons) };
}

// ---------- solver ---------------------------------------------------------------------
// Returns { blocks:{id:{lines:[{key,machine,count,rate}], imports:{}, exports:{}}}, raw:{}, totals }
function solve(opt){
  const perSec = opt.spm / 60;
  const science = SCIENCE.map(s=>s[0]).filter(k => k!=="military-science-pack" || opt.military);
  const demand = {};                       // shared-item demand, items/s
  science.forEach(k => demand[k] = perSec);
  const owner = {}; BLOCKS.forEach(b => b.makes.forEach(k => owner[k] = b.id));
  const out = { blocks:{}, raw:{}, science, opt };
  const add = (o,k,v) => { o[k] = (o[k]||0) + v; };

  for(const b of BLOCKS){
    const res = { lines:{}, imports:{}, exports:{}, oilFluids:{} };
    out.blocks[b.id] = res;
    if(b.kind === "labs"){ science.forEach(k => add(res.imports,k,perSec)); continue; }
    const want = {};
    b.makes.forEach(k => { if(demand[k]) { want[k] = demand[k]; res.exports[k] = demand[k]; } });
    // expand within the block
    const stack = Object.entries(want);
    while(stack.length){
      const [k, rate] = stack.pop();
      const r = R[k];
      const eff = r.m ? effects(r, r.m, opt) : { speed:1, prod:0, cons:0 };
      const crafts = rate / (r.out * (1 + eff.prod));          // crafts/s
      if(r.m){
        const L = res.lines[k] || (res.lines[k] = { key:k, machine:r.m, exact:0, rate:0, cons:eff.cons });
        L.exact += crafts * r.t / eff.speed; L.rate += rate;
      }
      for(const [ik, amt] of Object.entries(r.in)){
        const need = crafts * amt;
        const local = b.local.includes(ik) || (b.makes.includes(ik));
        if(b.kind === "oil" && ["heavy-oil","light-oil","petroleum-gas"].includes(ik)){ add(res.oilFluids, ik, need); continue; }
        if(local && R[ik]) stack.push([ik, need]);
        else if(RAW.includes(ik)) { add(res.imports, ik, need); add(out.raw, ik, need); }
        else { add(res.imports, ik, need); add(demand, ik, need); }
      }
    }
    if(b.kind === "oil") solveOil(res, opt, out);
  }
  // sanity: every imported intermediate must have an owner later in the list
  for(const b of BLOCKS) for(const k of Object.keys(out.blocks[b.id].imports))
    if(!RAW.includes(k) && !owner[k]) console.warn("No block makes", k);
  // machine counts
  let machines = 0, kw = 0, beacons = 0;
  for(const b of BLOCKS){
    const res = out.blocks[b.id];
    res.lineList = Object.values(res.lines).map(L => ({...L, count: Math.ceil(L.exact - 1e-9)}));
    res.lineList.forEach(L => {
      machines += L.count;
      kw += L.count * MACHINES[L.machine].kw * (1 + L.cons);
      if(opt.profile === "beacon" && L.machine !== "lab"){
        // the beaconed row (Templates): a full beacon row above and below, one between machines.
        // Rows are not stacked, so that's ~5 per 3x3 machine; fewer beacons per machine scales it down.
        const pat = linePattern(L.machine, opt), per = Math.max(1, Math.floor(80 / pat.pitch)), rows = Math.ceil(L.count / per);
        const rowB = n => 2 * Math.ceil((n * pat.pitch + 3) / 3) + n + 1;
        beacons += (Math.floor(L.count / per) * rowB(per) + (L.count % per ? rowB(L.count % per) : 0)) * Math.min(1, opt.beacons / 8);
      }
    });
    if(b.kind === "labs"){
      const labs = Math.ceil(opt.spm * opt.unitTime / (60 * opt.labSpeed));
      res.lineList = [{ key:"lab", machine:"lab", exact:labs, count:labs, rate:0 }];
      machines += labs; kw += labs * 60;
    }
  }
  kw += beacons * BEACON.kw;
  const drillRate = DRILL.rate * (1 + 0.1*opt.miningProd);
  const drills = ["iron-ore","copper-ore","stone","coal"].reduce((s,k)=>s + Math.ceil((out.raw[k]||0)/drillRate), 0);
  kw += drills * DRILL.kw;
  out.totals = { machines, beacons: Math.round(beacons), drills, mw: kw/1000,
    pumpjacks: Math.ceil((out.raw["crude-oil"]||0) / (PUMPJACK*opt.oilYield/100*(1 + 0.1*(opt.miningProd||0)))),   // mining productivity also speeds pumpjacks
    offshore: Math.ceil((out.raw["water"]||0) / 1200), drillRate };
  return out;
}

// Advanced oil processing, crack heavy -> light -> petroleum as needed (all with prod if set).
function solveOil(res, opt, out){
  const f = res.oilFluids, Dh = f["heavy-oil"]||0, Dl = f["light-oil"]||0, Dp = f["petroleum-gas"]||0;
  const e = k => effects({p:true}, k, opt);
  const er = e("ref"), ec = e("chem"), pr = 1+er.prod, pc = 1+ec.prod;
  const h = OIL.aop.heavy*pr, l = OIL.aop.light*pr, p = OIL.aop.pet*pr;   // per refinery craft
  // Crack all spare heavy into light and spare light into petroleum; take the smallest R
  // (refinery crafts/s) that covers heavy, light and petroleum demand at once.
  const hl = h*30*pc/40, lostH = Dh*30*pc/40;                 // light gained per R / lost to lube
  const Rr = Math.max(Dh/h, (Dl + lostH)/(l + hl), (Dp + (lostH + Dl)*20*pc/30)/(p + (l + hl)*20*pc/30));
  const H = Math.max(0, (Rr*h - Dh)/40);
  const L = Math.max(0, (Rr*l + H*30*pc - Dl)/30);
  const lines = [["aop","ref",Rr*OIL.aop.t/er.speed, er.cons],["heavy-crack","chem",H*OIL.heavy.t/ec.speed, ec.cons],["light-crack","chem",L*OIL.light.t/ec.speed, ec.cons]];
  for(const [k,m,ex,cons] of lines) if(ex>1e-9) res.lines[k] = { key:k, machine:m, exact:ex, rate:0, cons };
  const crude = Rr*OIL.aop.crude, water = Rr*OIL.aop.water + H*OIL.heavy.water + L*OIL.light.water;
  res.imports["crude-oil"] = crude; out.raw["crude-oil"] = (out.raw["crude-oil"]||0) + crude;
  res.imports["water"] = (res.imports["water"]||0) + water; out.raw["water"] = (out.raw["water"]||0) + water;
  res.oil = { refineryCrafts: Rr, heavyCrack: H, lightCrack: L, Dh, Dl, Dp };
}

// ---------- footprints ---------------------------------------------------------------
// Standard line patterns (drawn in the Templates tab), in tiles:
//  plain/prod: two rows of machines facing a shared 2-belt lane: size+1+2+1+size, +1 for poles.
//  beacon:     one row M B M B ... between two beacon rows; stacked lines share beacon rows.
function linePattern(machineKey, opt){
  const s = MACHINES[machineKey] ? MACHINES[machineKey].size : 3;
  if(machineKey === "lab") return { pitch: 3, perSlot: 2, height: 11 };
  if(opt.profile === "beacon") return { pitch: s+3, perSlot: 1, height: s+10, shared: 3 };
  return { pitch: s, perSlot: 2, height: 2*s + 5 };
}
// Pack a block's lines into rectangles no longer than maxLen. Returns [{w,h,lines:[...]}]
function packBlock(res, opt, maxLen, maxH){
  const rows = [];
  for(const L of res.lineList){
    const pat = linePattern(L.machine, opt);
    let left = L.count;
    const perLine = Math.max(1, Math.floor(maxLen / pat.pitch) * pat.perSlot);
    while(left > 0){
      const n = Math.min(left, perLine); left -= n;
      rows.push({ key:L.key, machine:L.machine, n, w: Math.ceil(n/pat.perSlot)*pat.pitch + 4, h: pat.height });
    }
  }
  rows.sort((a,b) => b.h - a.h);
  // shelf-pack rows into cells: rows sit side by side while they fit maxLen, shelves stack
  // downwards, and a new cell starts when the next shelf would pass maxH.
  const cells = []; let cur = null, shelf = null;
  const newCell = () => { cur = { w:0, h:2, rows:[] }; cells.push(cur); shelf = null; };
  for(const r of rows){
    if(!cur) newCell();
    if(shelf && shelf.x + r.w <= maxLen + 4 && r.h <= shelf.h){
      r.x = shelf.x; r.y = shelf.y; shelf.x += r.w;
    } else {
      const y = shelf ? shelf.y + shelf.h : 2;
      if(maxH && y + r.h > maxH && cur.rows.length) newCell();
      shelf = { x:0, y: shelf ? shelf.y + shelf.h : 2, h: r.h };
      r.x = 0; r.y = shelf.y; shelf.x = r.w;
    }
    cur.rows.push(r); cur.w = Math.max(cur.w, r.x + r.w); cur.h = Math.max(cur.h, r.y + r.h);
  }
  return cells;
}

// ---------- layout 1: main bus -----------------------------------------------------------
const BUS_ORDER = ["green","auto","log","mil","red","chem","prod","batt","frames","blue","lds","util","silo","labs"];
const SMELT = ["iron","copper","steel","brick"];
function layoutBus(sol){
  const opt = sol.opt, GAP = 3, MAXLEN = 48;
  // bus lanes: every shared item a block imports (not fluids, not raw-from-outposts except coal/stone)
  const lanes = [];
  const busItems = ["iron-plate","copper-plate","steel-plate","stone-brick","electronic-circuit","advanced-circuit","plastic-bar","sulfur","processing-unit","low-density-structure","battery","rocket-fuel","flying-robot-frame","coal","stone"];
  for(const k of busItems){
    let use = 0;
    for(const id of [...BUS_ORDER, "oil"]) use += sol.blocks[id].imports[k] || 0;
    if(use > 1e-9) lanes.push({ key:k, belts: Math.ceil(use / BELT - 1e-9), rate: use });
  }
  let x = 0; lanes.forEach(L => { L.x = x; x += L.belts; });
  const busW = x + Math.floor(Math.max(0,x-1)/4) * 2;   // a 2-tile gap every 4 belts for undergrounds
  // re-space lanes with the gaps
  let i = 0; lanes.forEach(L => { L.x = i + Math.floor(i/4)*2; i += L.belts; });
  const placed = [];
  // smelting band above the bus
  let sx = -10, sy = -GAP;
  const smeltCells = SMELT.map(id => ({ id, cell: packBlock(sol.blocks[id], opt, 60)[0] })).filter(s => s.cell);
  const bandH = Math.max(0, ...smeltCells.map(s => s.cell.h));
  let cx = -Math.round((smeltCells.reduce((s,c)=>s+c.cell.w+GAP,0) - busW)/2);
  for(const s of smeltCells){ placed.push({ id:s.id, x:cx, y:-GAP-bandH-6, w:s.cell.w, h:s.cell.h, cell:s.cell }); cx += s.cell.w + GAP; }
  // oil to the right of the smelting band, beside the bus head
  const oilCell = packBlock(sol.blocks.oil, opt, 60)[0];
  if(oilCell) placed.push({ id:"oil", x: cx + GAP*2, y:-GAP-bandH-6, w:oilCell.w, h:oilCell.h, cell:oilCell });
  // blocks alternate left/right down the bus
  let yl = GAP, yr = GAP;
  BUS_ORDER.forEach((id, n) => {
    const cells = packBlock(sol.blocks[id], opt, MAXLEN);
    for(const cell of cells){
      const left = yl <= yr;
      const p = { id, w:cell.w, h:cell.h, cell, x: left ? -GAP-cell.w : busW+GAP, y: left ? yl : yr };
      if(left) yl += cell.h + GAP; else yr += cell.h + GAP;
      placed.push(p);
    }
  });
  const busLen = Math.max(yl, yr);
  return { kind:"bus", lanes, busW, busLen, placed, busTop: -GAP-6 };
}

// ---------- layout 2: city blocks -------------------------------------------------------
const CITY = { pitch: 100, rail: 10, station: 14 };   // 100-tile blocks; 2x2 rails = 10-tile border; stations eat 14
function layoutCity(sol){
  const opt = sol.opt, inner = CITY.pitch - CITY.rail, usableH = inner - CITY.station;
  const cells = [];
  for(const b of BLOCKS){
    const packed = packBlock(sol.blocks[b.id], opt, inner-10, usableH);
    packed.forEach((cell, n) => cells.push({ id:b.id, n:n+1, of:packed.length, cell }));
  }
  // positions: closest-to-centre first. Consumers (labs, silo, science) sit in the middle,
  // smelting on the rim where ore trains arrive.
  const N = Math.ceil(Math.sqrt(cells.length)) + (Math.ceil(Math.sqrt(cells.length)) % 2 ? 0 : 1);
  const c = (N-1)/2, slots = [];
  for(let gy=0; gy<N; gy++) for(let gx=0; gx<N; gx++) slots.push({ gx, gy, d: Math.hypot(gx-c, gy-c) + 0.001*(gy*N+gx) });
  slots.sort((a,b) => a.d - b.d);
  cells.forEach((cl, i) => { cl.gx = slots[i].gx; cl.gy = slots[i].gy; });
  return { kind:"city", N, cells, pitch: CITY.pitch };
}


// ---------- research (technology.lua) ---------------------------------------------------
// A practical research order that includes every prerequisite (checked against technology.lua).
// `m:` unlocks are machines and modules rather than recipes; `trigger` techs unlock by doing, not in a lab. Each step lists the recipes
// (this planner's keys) the technology unlocks; recipes no technology unlocks are "start".
const RESEARCH = [
  { id:"start", name:"Game start", unlocks:["iron-plate","copper-plate","stone-brick","iron-gear-wheel","transport-belt","firearm-magazine"] },
  { id:"steam-power", name:"Steam power", unlocks:["pipe"], trigger:"No lab needed: it unlocks when you craft 50 iron plates." },
  { id:"electronics", name:"Electronics", unlocks:["copper-cable","electronic-circuit","lab","inserter"], trigger:"No lab needed: it unlocks when you craft 10 copper plates." },
  { id:"automation-science-pack", name:"Automation science pack", unlocks:["automation-science-pack"], trigger:"No lab needed: it unlocks when you craft a lab." },
  { id:"automation", name:"Automation", unlocks:["m:asm1"] },
  { id:"electric-mining-drill", name:"Electric mining drill", unlocks:["m:drill"] },
  { id:"logistics", name:"Logistics", unlocks:[] },
  { id:"radar", name:"Radar", unlocks:["radar"] },
  { id:"logistic-science-pack", name:"Logistic science pack", unlocks:["logistic-science-pack"] },
  { id:"steel-processing", name:"Steel processing", unlocks:["steel-plate"] },
  { id:"automation-2", name:"Automation 2", unlocks:["m:asm2"] },
  { id:"advanced-material-processing", name:"Advanced material processing", unlocks:["m:steel-furnace"] },
  { id:"military", name:"Military", unlocks:[] },
  { id:"stone-wall", name:"Stone wall", unlocks:["stone-wall"] },
  { id:"military-2", name:"Military 2", unlocks:["piercing-rounds-magazine","grenade"] },
  { id:"military-science-pack", name:"Military science pack", unlocks:["military-science-pack"] },
  { id:"engine", name:"Engine", unlocks:["engine-unit"] },
  { id:"logistics-2", name:"Logistics 2", unlocks:[] },
  { id:"fluid-handling", name:"Fluid handling", unlocks:[] },
  { id:"oil-gathering", name:"Oil gathering", unlocks:["m:pumpjack"] },
  { id:"oil-processing", name:"Oil processing", unlocks:["aop","m:ref","m:chem"], note:"Refineries run Basic oil processing until Advanced oil processing is researched; same buildings, different recipe.", trigger:"No lab needed: it unlocks when a pumpjack first mines crude oil." },
  { id:"plastics", name:"Plastics", unlocks:["plastic-bar"] },
  { id:"sulfur-processing", name:"Sulfur processing", unlocks:["sulfuric-acid","sulfur"] },
  { id:"advanced-circuit", name:"Advanced circuit", unlocks:["advanced-circuit"] },
  { id:"chemical-science-pack", name:"Chemical science pack", unlocks:["chemical-science-pack"] },
  { id:"modules", name:"Modules", unlocks:[] },
  { id:"productivity-module", name:"Productivity module", unlocks:["productivity-module"] },
  { id:"speed-module", name:"Speed module", unlocks:[] },
  { id:"advanced-oil-processing", name:"Advanced oil processing", unlocks:["heavy-crack","light-crack"], note:"Switch every refinery to Advanced oil processing, then add the cracking plants." },
  { id:"lubricant", name:"Lubricant", unlocks:["lubricant"] },
  { id:"flammables", name:"Flammables", unlocks:[] },
  { id:"battery", name:"Battery", unlocks:["battery"] },
  { id:"electric-energy-distribution-1", name:"Electric energy distribution 1", unlocks:["iron-stick"] },
  { id:"solar-energy", name:"Solar energy", unlocks:["solar-panel"] },
  { id:"electric-energy-accumulators", name:"Electric energy accumulators", unlocks:["accumulator"] },
  { id:"electric-engine", name:"Electric engine", unlocks:["electric-engine-unit"] },
  { id:"robotics", name:"Robotics", unlocks:["flying-robot-frame"] },
  { id:"processing-unit", name:"Processing unit", unlocks:["processing-unit"] },
  { id:"low-density-structure", name:"Low density structure", unlocks:["low-density-structure"] },
  { id:"advanced-material-processing-2", name:"Advanced material processing 2", unlocks:["electric-furnace","m:furn"] },
  { id:"railway", name:"Railway", unlocks:["rail"] },
  { id:"concrete", name:"Concrete", unlocks:[] },
  { id:"production-science-pack", name:"Production science pack", unlocks:["production-science-pack"] },
  { id:"productivity-module-2", name:"Productivity module 2", unlocks:[] },
  { id:"speed-module-2", name:"Speed module 2", unlocks:[] },
  { id:"automation-3", name:"Automation 3", unlocks:["m:asm"] },
  { id:"effect-transmission", name:"Effect transmission", unlocks:["m:beacon"] },
  { id:"productivity-module-3", name:"Productivity module 3", unlocks:["m:prod3"] },
  { id:"speed-module-3", name:"Speed module 3", unlocks:["m:speed3"] },
  { id:"utility-science-pack", name:"Utility science pack", unlocks:["utility-science-pack"] },
  { id:"rocket-fuel", name:"Rocket fuel", unlocks:["rocket-fuel","solid-fuel"] },
  { id:"rocket-silo", name:"Rocket silo", unlocks:["rocket-part","satellite"] },

];
const UNLOCK_STEP = {}; RESEARCH.forEach((t,i) => t.unlocks.forEach(k => { if(!(k in UNLOCK_STEP)) UNLOCK_STEP[k] = i; }));
// The plan is sized for the endgame machine. Until it's researched you build the same block
// with what you have; this says what that is and how fast it runs compared with the plan.
const MACHINE_TIERS = {
  asm:  [["m:asm","Assembling machine 3",1.25],["m:asm2","Assembling machine 2",0.75],["m:asm1","Assembling machine 1",0.5],[null,"hand crafting (Assembling machine 1 comes with Automation)",0]],
  furn: [["m:furn","Electric furnace",2],["m:steel-furnace","Steel furnace",2],[null,"Stone furnace",1]],
};
function machineAt(machine, step){
  const tiers = MACHINE_TIERS[machine];
  if(!tiers) return { name: MACHINES[machine] ? MACHINES[machine].name : machine, speed: MACHINES[machine] ? MACHINES[machine].speed : 1, final:true };
  const t = tiers.find(([k]) => k === null || (UNLOCK_STEP[k] ?? 0) <= step);
  return { name: t[1], speed: t[2], final: t === tiers[0] };
}
// modules and beacons only exist after their research
function modulesAt(opt, step){
  const prod = opt.profile !== "plain" && UNLOCK_STEP["m:prod3"] <= step;
  const beac = opt.profile === "beacon" && UNLOCK_STEP["m:beacon"] <= step && UNLOCK_STEP["m:speed3"] <= step;
  return { prod, beac, final: (opt.profile === "plain" || prod) && (opt.profile !== "beacon" || beac) };
}
// A block opens when the recipe for one of its outputs is researched (and that recipe's
// own sub-lines are too); its other lines light up as their research lands.
function blockStep(id, sol){
  const b = BLOCKS.find(x => x.id === id), lines = sol.blocks[id].lineList.map(L => L.key);
  if(b.kind === "labs") return UNLOCK_STEP["lab"];
  if(id === "silo") return UNLOCK_STEP["rocket-part"];
  const lineStep = k => UNLOCK_STEP[k] ?? 0;
  const firsts = b.makes.filter(k => lines.includes(k)).map(k => {
    const deps = Object.keys(R[k].in).filter(i => b.local.includes(i) && lines.includes(i));
    return Math.max(lineStep(k), ...deps.map(lineStep));
  });
  // and you need something to build it with: assemblers arrive with Automation
  const needAsm = sol.blocks[id].lineList.some(L => L.machine === "asm") ? UNLOCK_STEP["m:asm1"] : 0;
  return Math.max(needAsm, firsts.length ? Math.min(...firsts) : 0);
}

// ---------- layout 3: your world ------------------------------------------------------------
// Resource patches are wherever the player says they are. Blocks are placed supplier-first:
// each one goes as close as it can to the rate-weighted centre of what it consumes, without
// overlapping a patch or another block. Moving a patch re-plans everything around it.
const PATCH_KIND = { "iron-ore":"iron", "copper-ore":"copper", "stone":"stone", "coal":"coal", "crude-oil":"oil", "water":"water" };
const PATCH_INFO = {
  iron:{ name:"Iron ore", color:"#7d8ea8", r:26 }, copper:{ name:"Copper ore", color:"#d27a45", r:26 },
  stone:{ name:"Stone", color:"#b9a37f", r:18 }, coal:{ name:"Coal", color:"#4a4f5c", r:20 },
  oil:{ name:"Crude oil", color:"#8a5fa0", r:22 }, water:{ name:"Water (lake)", color:"#2f6fb5", r:34 },
};
const DEFAULT_PATCHES = [
  { id:"p1", kind:"iron",   x:120, y:140 }, { id:"p2", kind:"copper", x:470, y:120 },
  { id:"p3", kind:"stone",  x:300, y:60 },  { id:"p4", kind:"coal",   x:110, y:430 },
  { id:"p5", kind:"oil",    x:500, y:440 }, { id:"p6", kind:"water",  x:300, y:560 },
];
// ctx.pins: {blockId:{x,y}} keeps blocks the player has already built where they are.
// ctx.obstacles: Set of "gx,gy" 8-tile cells already covered by the player's other buildings.
function layoutWorld(sol, patches, ctx){
  ctx = ctx || {};
  const pins = ctx.pins || {}, obst = ctx.obstacles || null, G = 8, nests = (ctx.marks || []).filter(m => m.kind==="nest"), tags = (ctx.marks || []).filter(m => m.kind!=="nest");
  const NEST_GAP = 40;   // keep factories out of biter attack range; defend the gap
  const opt = sol.opt, M = 5, placed = [], flows = [], at = {};
  const pr = p => p.r || PATCH_INFO[p.kind].r;
  const centre = { x: patches.reduce((s,p)=>s+p.x,0)/Math.max(1,patches.length), y: patches.reduce((s,p)=>s+p.y,0)/Math.max(1,patches.length) };
  const nearest = (kind, pt) => patches.filter(p => p.kind===kind).sort((a,b)=>Math.hypot(a.x-pt.x,a.y-pt.y)-Math.hypot(b.x-pt.x,b.y-pt.y))[0];
  const weight = (k, rate) => k==="water" ? rate/200 : FLUIDS.has(k) ? rate/20 : rate;
  const free = (x,y,w,h) => placed.every(q => x+w+M <= q.x || q.x+q.w+M <= x || y+h+M <= q.y || q.y+q.h+M <= y)
    && patches.every(p => { const cx = Math.max(x, Math.min(p.x, x+w)), cy = Math.max(y, Math.min(p.y, y+h)); return Math.hypot(cx-p.x, cy-p.y) > pr(p)+M; })
    && tags.every(t => { const cx = Math.max(x, Math.min(t.x, x+w)), cy = Math.max(y, Math.min(t.y, y+h)); return Math.hypot(cx-t.x, cy-t.y) > 16; })
    && nests.every(n => { const cx = Math.max(x, Math.min(n.x, x+w)), cy = Math.max(y, Math.min(n.y, y+h)); return Math.hypot(cx-n.x, cy-n.y) > (n.r||12) + NEST_GAP; })
    && (!obst || !obst.size || (() => { for(let gx=Math.floor((x-M)/G); gx<=Math.floor((x+w+M)/G); gx++) for(let gy=Math.floor((y-M)/G); gy<=Math.floor((y+h+M)/G); gy++) if(obst.has(gx+","+gy)) return false; return true; })());
  const cells = {};
  // widen big blocks until they're no taller than ~1.5x their width, so they fit between patches
  for(const b of BLOCKS){ const res = sol.blocks[b.id]; if(!res.lineList.length) continue;
    let c; for(const L of [80, 120, 160, 240, 320, 480, 640]){ c = packBlock(res, opt, L)[0]; if(c.h <= c.w * 1.5) break; }
    cells[b.id] = c; }
  // pinned blocks go down first, exactly where they were built
  for(const [id, pin] of Object.entries(pins)){
    const cell = cells[id]; if(!cell) continue;
    // a re-plan can grow a pinned block into its neighbour; then it re-flows like any other
    if(!placed.every(q => pin.x+cell.w <= q.x || q.x+q.w <= pin.x || pin.y+cell.h <= q.y || q.y+q.h <= pin.y)) continue;
    const p = { id, x:pin.x, y:pin.y, w:cell.w, h:cell.h, cell, pinned:true };
    placed.push(p); at[id] = p;
  }
  for(const b of [...BLOCKS].reverse()){
    const res = sol.blocks[b.id]; if(!res.lineList.length) continue;
    const cell = cells[b.id];
    // sources: placed blocks for intermediates, nearest patch for raw (two passes so the
    // patch choice follows the block's own pull)
    let target = centre, srcs = [];
    for(let pass=0; pass<2; pass++){
      srcs = [];
      for(const [k, rate] of Object.entries(res.imports)){
        if(rate <= 1e-9) continue;
        let pt = null;
        if(PATCH_KIND[k]){ const p = nearest(PATCH_KIND[k], target); if(p) pt = { x:p.x, y:p.y, patch:p.id }; }
        else { const owner = BLOCKS.find(o => o.makes.includes(k)); const q = owner && at[owner.id]; if(q) pt = { x:q.x+q.w/2, y:q.y+q.h/2, block:owner.id }; }
        if(pt) srcs.push({ k, rate, w: weight(k, rate), ...pt });
      }
      const W = srcs.reduce((s,x)=>s+x.w,0);
      if(W > 0) target = { x: srcs.reduce((s,x)=>s+x.x*x.w,0)/W, y: srcs.reduce((s,x)=>s+x.y*x.w,0)/W };
    }
    if(at[b.id] && at[b.id].pinned){ const p = at[b.id]; srcs.forEach(s => flows.push({ ...s, to:b.id, tx:p.x+p.w/2, ty:p.y+p.h/2 })); continue; }
    // spiral out from the target to the nearest free spot
    const w = cell.w, h = cell.h, x0 = Math.round(target.x - w/2), y0 = Math.round(target.y - h/2);
    let spot = null;
    const tryAt = (dx, dy, best) => free(x0+dx, y0+dy, w, h) && (!best || Math.hypot(dx,dy) < best.d) ? { x:x0+dx, y:y0+dy, d:Math.hypot(dx,dy) } : best;
    for(let r=0; r<1600 && !spot; r+=4){
      let best = r ? null : tryAt(0, 0, null);
      for(let t=-r; t<=r && r; t+=4){ best = tryAt(t, -r, best); best = tryAt(t, r, best); if(Math.abs(t) < r){ best = tryAt(-r, t, best); best = tryAt(r, t, best); } }
      spot = best;
    }
    const stuck = !spot;
    spot = spot || { x:x0, y:y0 };
    const p = { id:b.id, x:spot.x, y:spot.y, w, h, cell, stuck };
    placed.push(p); at[b.id] = p;
    srcs.forEach(s => flows.push({ ...s, to:b.id, tx:p.x+w/2, ty:p.y+h/2 }));
  }
  // transport effort: belt-loads x tiles travelled (solids only)
  const effort = flows.filter(f => !FLUIDS.has(f.k)).reduce((s,f) => s + f.rate/BELT * Math.hypot(f.tx-f.x, f.ty-f.y), 0);
  placed.sort((a,b) => BLOCKS.findIndex(x=>x.id===b.id) - BLOCKS.findIndex(x=>x.id===a.id));
  return { kind:"world", placed, flows, patches, effort, marks: ctx.marks || [] };
}

// ---------- the guide: one linear list of things to do -----------------------------------
// Research and building interleave: research a technology, then build every block it opens,
// then extend blocks that gained a line. Steps have stable ids so ticks survive re-plans.
function guideSteps(sol){
  const steps = [{ id:"setup", type:"setup", title:"Mark where your resources are" }];
  const ids = BUILD_ORDER.filter(id => sol.blocks[id] && sol.blocks[id].lineList.length);
  const opens = Object.fromEntries(ids.map(id => [id, blockStep(id, sol)]));
  RESEARCH.forEach((t, i) => {
    const blocks = ids.filter(id => opens[id] === i);
    const extend = ids.filter(id => opens[id] < i).flatMap(id => sol.blocks[id].lineList.filter(L => UNLOCK_STEP[L.key] === i).map(L => ({ id, key:L.key })));
    if(i > 0){
      // back-to-back research with nothing to build in between becomes one step
      const last = steps[steps.length-1];
      if(last.type === "research") { last.techs.push(t.id); last.step = i; last.title = "Research " + last.techs.map(x => RESEARCH.find(r=>r.id===x).name).join(", "); if(t.note) last.notes.push(t.note); }
      else steps.push({ id:"r:"+t.id, type:"research", techs:[t.id], step:i, title:"Research "+t.name, notes: t.note ? [t.note] : [] });
    }
    // upgrades: the endgame machines and modules arrive late, so swap them into what's built
    const has = k => (UNLOCK_STEP[k] ?? -1) === i;
    const prof = sol.opt.profile;
    if(has("m:asm")) steps.push({ id:"u:asm", type:"upgrade", step:i, upgrade:"asm", title:"Upgrade every assembler to Assembling machine 3" });
    if(has("m:furn")) steps.push({ id:"u:furn", type:"upgrade", step:i, upgrade:"furn", title:"Swap your furnaces for electric furnaces" });
    if(prof !== "plain" && has("m:prod3")) steps.push({ id:"u:prod", type:"upgrade", step:i, upgrade:"prod", title:"Fill every machine with Productivity module 3" });
    if(prof === "beacon" && Math.max(UNLOCK_STEP["m:beacon"], UNLOCK_STEP["m:speed3"]) === i) steps.push({ id:"u:beacon", type:"upgrade", step:i, upgrade:"beacon", title:"Add beacons with Speed module 3" });
    blocks.forEach(id => steps.push({ id:"b:"+id, type:"build", block:id, step:i, title:"Build "+BLOCKS.find(b=>b.id===id).name }));
    // group extensions per block
    const byBlock = {};
    extend.forEach(e => (byBlock[e.id] = byBlock[e.id] || []).push(e.key));
    Object.entries(byBlock).forEach(([id, keys]) => steps.push({ id:"e:"+id+":"+t.id, type:"extend", block:id, keys, step:i,
      title:"Extend "+BLOCKS.find(b=>b.id===id).name }));
  });
  return steps;
}

// ---------- reading the player's game ------------------------------------------------------
// The save format can't be read outside the game, so a one-line console command exports what
// the planner needs (resources, crafting machines with recipes, finished research) to
// script-output/factorio-planner.json. Factorio 2.x Lua API.
const SCAN_COMMAND = [
  '/c local pl=game.player local s=pl.physical_surface local f=pl.force local c=pl.physical_position local R=800',
  'if s.platform then s=game.surfaces.nauvis end',
  'local A={{c.x-R,c.y-R},{c.x+R,c.y+R}} local b={}',
  'local function add(n,cx,cy,x,y,k,a) local key=n..":"..cx..":"..cy local t=b[key] if not t then t={n=n,cx=cx,cy=cy,x=0,y=0,c=0,a=0} b[key]=t end t.x=t.x+x*k t.y=t.y+y*k t.c=t.c+k t.a=t.a+(a or 0) end',
  'for _,e in pairs(s.find_entities_filtered{area=A,type="resource"}) do local p=e.position add(e.name,math.floor(p.x/32),math.floor(p.y/32),p.x,p.y,1,e.amount) end',
  'local W={} for _,n in pairs{"water","deepwater","water-green","deepwater-green","water-shallow","water-mud"} do if prototypes.tile[n] then W[#W+1]=n end end',
  'for cx=math.floor((c.x-R)/32),math.floor((c.x+R)/32) do for cy=math.floor((c.y-R)/32),math.floor((c.y+R)/32) do local n=s.count_tiles_filtered{area={{cx*32,cy*32},{cx*32+32,cy*32+32}},name=W} if n>0 and #W>0 then add("water",cx,cy,cx*32+16,cy*32+16,n) end end end',
  'local res={} for _,t in pairs(b) do res[#res+1]={n=t.n,cx=t.cx,cy=t.cy,x=t.x/t.c,y=t.y/t.c,c=t.c,a=t.a} end',
  'local m={} for _,e in pairs(s.find_entities_filtered{force=f,type={"assembling-machine","furnace","rocket-silo","lab"}}) do local r=nil',
  'pcall(function() local x=e.get_recipe() if x then r=x.name end end)',
  'if not r and e.type=="furnace" then pcall(function() local q=e.previous_recipe if q then r=(type(q.name)=="string") and q.name or q.name.name end end) end',
  'm[#m+1]={n=e.name,t=e.type,x=e.position.x,y=e.position.y,r=r} end',
  'local tech={} for n,t in pairs(f.technologies) do if t.researched then tech[#tech+1]=n end end',
  'local tags={} for _,t in pairs(f.find_chart_tags(s)) do tags[#tags+1]={x=t.position.x,y=t.position.y,text=t.text,icon=t.icon and t.icon.name or nil} end',
  'local en={} for _,e in pairs(s.find_entities_filtered{area=A,force="enemy",type={"unit-spawner","turret"}}) do en[#en+1]={x=e.position.x,y=e.position.y,t=e.type} end',
  'helpers.write_file("factorio-planner.json",helpers.table_to_json({v=1,seed=s.map_gen_settings.seed,tick=game.tick,player={x=c.x,y=c.y},resources=res,machines=m,research=tech,tags=tags,enemies=en}),false,pl.index)',
  'pl.print("Saved script-output/factorio-planner.json: "..#res.." resource chunks, "..#m.." machines, "..#tech.." technologies, "..#tags.." map tags, "..#en.." enemy buildings")',
].join(" ");

const RES_KIND = { "iron-ore":"iron", "copper-ore":"copper", "stone":"stone", "coal":"coal", "crude-oil":"oil", "water":"water" };
const RECIPE_KEY = { "solid-fuel-from-light-oil":"solid-fuel", "advanced-oil-processing":"aop", "basic-oil-processing":"aop",
  "heavy-oil-cracking":"heavy-crack", "light-oil-cracking":"light-crack",
  "solid-fuel-from-petroleum-gas":"solid-fuel", "solid-fuel-from-heavy-oil":"solid-fuel" };
// the game writes an empty Lua table as {} rather than [], so read every list defensively
const arr = v => Array.isArray(v) ? v : (v && typeof v==="object" ? Object.values(v) : []);
// Turn the export into patches (adjacent chunks of one resource merge into one patch; the
// biggest few of each kind are kept), machines keyed like the planner, and research ids.
function parseScan(data, maxPerKind){
  maxPerKind = maxPerKind || 3;
  if(!data || typeof data!=="object" || !("resources" in data) || !("machines" in data)) throw new Error("This doesn't look like a factorio-planner.json export.");
  data = { ...data, resources: arr(data.resources), machines: arr(data.machines), research: arr(data.research), tags: arr(data.tags), enemies: arr(data.enemies) };
  // chunks that are mostly water: blocks are kept off them (a lake isn't a circle)
  const water = data.resources.filter(r => r.n==="water" && r.c >= 300).map(r => [r.cx, r.cy]);
  const groups = {};
  for(const r of data.resources){ const k = RES_KIND[r.n]; if(k) (groups[k] = groups[k] || []).push(r); }
  const patches = [];
  for(const [kind, list] of Object.entries(groups)){
    const byKey = new Map(list.map(r => [r.cx+","+r.cy, r])), seen = new Set(), found = [];
    for(const r of list){
      const k0 = r.cx+","+r.cy; if(seen.has(k0)) continue;
      const stack = [r], members = []; seen.add(k0);
      while(stack.length){ const q = stack.pop(); members.push(q);
        for(let dx=-1; dx<=1; dx++) for(let dy=-1; dy<=1; dy++){ const k = (q.cx+dx)+","+(q.cy+dy); if(!seen.has(k) && byKey.has(k)){ seen.add(k); stack.push(byKey.get(k)); } } }
      const c = members.reduce((s,m)=>s+m.c,0);
      found.push({ c, a: members.reduce((s,m)=>s+(m.a||0),0), x: members.reduce((s,m)=>s+m.x*m.c,0)/c, y: members.reduce((s,m)=>s+m.y*m.c,0)/c });
    }
    const min = kind==="oil" ? 1 : kind==="water" ? 400 : 60;
    found.filter(f => f.c >= min).sort((a,b) => b.c - a.c).slice(0, maxPerKind).forEach((f, i) => patches.push({
      id: "s"+kind+i, kind, x: Math.round(f.x), y: Math.round(f.y), amount: f.a,
      r: kind==="oil" ? 14 : Math.max(10, Math.min(kind==="water" ? 240 : 60, Math.round(Math.sqrt(f.c/Math.PI)))) }));
  }
  const machines = data.machines.map(m => ({ x:m.x, y:m.y, name:m.n,
    key: m.n==="lab" ? "lab" : (m.r ? (RECIPE_KEY[m.r] || m.r) : null) }));
  // map tags the player placed, and enemy bases grouped into nests (spawners/worms within ~48 tiles)
  const marks = (data.tags || []).map((t, i) => ({ id:"t"+i, kind:"tag", x:Math.round(t.x), y:Math.round(t.y), text: t.text || (t.icon ? (t.icon.startsWith("signal-") ? t.icon.slice(7) : nice(t.icon)) : "Tag") }));
  // enemy buildings: bucket into 64-tile squares, then join touching squares into nests (capped
  // so one huge infested area becomes several nests rather than one giant circle)
  const cellsE = new Map();
  for(const e of data.enemies){ const k = Math.floor(e.x/64)+","+Math.floor(e.y/64); (cellsE.get(k) || cellsE.set(k, []).get(k)).push(e); }
  const seenE = new Set();
  const pendingE = [...cellsE.keys()];
  while(pendingE.length){
    const k0 = pendingE.shift();
    if(seenE.has(k0)) continue;
    const grp = [], q = [k0]; seenE.add(k0);
    let cellsIn = 0;
    while(q.length && cellsIn++ < 9){
      const k = q.shift(); grp.push(...cellsE.get(k));
      const [cx, cy] = k.split(",").map(Number);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const n = (cx+dx)+","+(cy+dy); if(cellsE.has(n) && !seenE.has(n)){ seenE.add(n); q.push(n); } }
    }
    q.forEach(k => { seenE.delete(k); pendingE.push(k); });   // not absorbed: they start their own nest
    const x = grp.reduce((s,e)=>s+e.x,0)/grp.length, y = grp.reduce((s,e)=>s+e.y,0)/grp.length;
    const r = Math.max(12, Math.max(...grp.map(e => Math.hypot(e.x-x, e.y-y))) + 6);
    marks.push({ id:"n"+marks.length, kind:"nest", x:Math.round(x), y:Math.round(y), r:Math.round(r), count:grp.length, text: String(grp.length) });
  }
  return { seed: data.seed ?? null, patches, water, marks, machines, research: new Set(data.research || []), player: data.player || null, tick: data.tick };
}
// How much of each placed block is built: machines with the right recipe inside the block's
// footprint (plus a small margin). Also returns 8-tile cells covered by machines that sit
// outside every block, so a re-plan steers around the player's existing buildings.
function checkBase(sol, placed, machines){
  const M = 6, out = {}, used = new Set();
  for(const p of placed){
    const lines = sol.blocks[p.id].lineList.map(L => ({ key:L.key, need:L.count, built:0 }));
    machines.forEach((m, i) => {
      if(m.x < p.x-M || m.x > p.x+p.w+M || m.y < p.y-M || m.y > p.y+p.h+M) return;
      const L = lines.find(l => l.key === m.key); if(L){ L.built++; used.add(i); }
    });
    const need = lines.reduce((s,l)=>s+l.need,0), have = lines.reduce((s,l)=>s+Math.min(l.built,l.need),0);
    out[p.id] = { lines, need, have, frac: need ? have/need : 0 };
  }
  const obstacles = new Set();
  machines.forEach((m, i) => { if(!used.has(i)) for(let dx=-1; dx<=1; dx++) for(let dy=-1; dy<=1; dy++) obstacles.add(Math.floor((m.x+dx*2)/8)+","+Math.floor((m.y+dy*2)/8)); });
  return { blocks: out, obstacles, outside: machines.length - used.size };
}

// Machines you've already built somewhere else than the plan: when a cluster of them makes one
// block's products, move that block onto them (as a pin) instead of planning a second copy.
function adoptBuilt(sol, placed, machines, pins){
  const out = {}, taken = new Set();
  const inside = (m, p) => m.x >= p.x-6 && m.x <= p.x+p.w+6 && m.y >= p.y-6 && m.y <= p.y+p.h+6;
  for(const id of BUILD_ORDER){
    const res = sol.blocks[id]; if(!res || !res.lineList.length || pins[id]) continue;
    const p = placed.find(q => q.id===id); if(!p) continue;
    const keys = new Set(res.lineList.map(L => L.key)), need = res.lineList.reduce((s,L)=>s+L.count,0);
    if(machines.some(m => keys.has(m.key) && inside(m, p))) continue;      // already building it where planned
    const mine = machines.map((m, i) => ({ ...m, i })).filter(m => keys.has(m.key) && !taken.has(m.i));
    // biggest group of them within 48 tiles of each other
    let best = [];
    const seen = new Set();
    for(const m of mine){
      if(seen.has(m.i)) continue;
      const grp = [m]; seen.add(m.i);
      for(let k=0; k<grp.length; k++) for(const n of mine) if(!seen.has(n.i) && Math.hypot(n.x-grp[k].x, n.y-grp[k].y) < 48){ seen.add(n.i); grp.push(n); }
      if(grp.length > best.length) best = grp;
    }
    if(best.length < Math.max(3, Math.min(10, need * 0.05))) continue;
    best.forEach(m => taken.add(m.i));
    out[id] = { x: Math.floor(Math.min(...best.map(m => m.x))) - 3, y: Math.floor(Math.min(...best.map(m => m.y))) - 3, adopted: best.length };
  }
  return out;
}

// ---------- the exact build: every entity of a block, tile by tile ------------------------
// Positions are block-local tiles (top-left of the entity). The same list draws the close-up
// view and becomes the in-game blueprint, so what you see is what you paste.
const ENTITY = { asm:"assembling-machine-3", furn:"electric-furnace", chem:"chemical-plant", ref:"oil-refinery", silo:"rocket-silo", lab:"lab" };
const GAME_RECIPE = { aop:"advanced-oil-processing", "heavy-crack":"heavy-oil-cracking", "light-crack":"light-oil-cracking", "solid-fuel":"solid-fuel-from-light-oil" };
const DIR = { N:0, E:4, S:8, W:12 };   // Factorio 2.x 16-way directions
function blockEntities(cell, opt){
  const out = [], add = (name, x, y, w, h, extra) => out.push({ name, x, y, w, h, ...extra });
  for(const r of cell.rows){
    const m = r.machine, size = m==="lab" ? 3 : MACHINES[m].size, beacon = opt.profile==="beacon" && m!=="lab";
    const recipe = m==="lab" || m==="furn" || m==="silo" ? null : (GAME_RECIPE[r.key] || r.key);
    const mach = (x, y) => add(ENTITY[m], x, y, size, size, { recipe, key:r.key, machine:true, machineKey:m });
    const feeds = m !== "ref";   // refineries are all pipes
    if(beacon){
      // beacons | input belt | inserters | machines between beacons | inserters | output belt | beacons
      const pitch = size + 3, x0 = r.x + 1, y0 = r.y, my = y0 + 5, len = r.n * pitch + 3;
      for(let bx = 0; bx + 3 <= len; bx += 3){ add("beacon", x0+bx, y0, 3, 3); add("beacon", x0+bx, my+size+2, 3, 3); }
      for(let x = 0; x < len; x++){ add("express-transport-belt", x0+x, y0+3, 1, 1, { dir:DIR.E, lane:"in" }); add("express-transport-belt", x0+x, my+size+1, 1, 1, { dir:DIR.E, lane:"out" }); }
      for(let i = 0; i <= r.n; i++){
        add("beacon", x0+i*pitch, my, 3, 3);
        add("medium-electric-pole", x0+i*pitch+1, y0+4, 1, 1); add("medium-electric-pole", x0+i*pitch+1, my+size, 1, 1);
        if(size >= 9 && i < r.n){ add("medium-electric-pole", x0+i*pitch+1, my+4, 1, 1);
          add("medium-electric-pole", x0+i*pitch+7, y0+4, 1, 1); add("medium-electric-pole", x0+i*pitch+7, my+size, 1, 1); }
        if(size >= 9 && i === r.n) add("medium-electric-pole", x0+i*pitch+1, my+4, 1, 1);
      }
      for(let i = 0; i < r.n; i++){
        const mx = x0 + 3 + i*pitch; mach(mx, my);
        if(feeds){ add("fast-inserter", mx+1, y0+4, 1, 1, { dir:DIR.N, from:"belt" });            // belt above → machine
          add("fast-inserter", mx+1, my+size, 1, 1, { dir:DIR.N, from:"machine" }); }           // machine → belt below
      }
    } else {
      // two rows of machines facing an input belt and an output belt
      const per = Math.ceil(r.n/2), x0 = r.x + 2, y0 = r.y, by = y0 + size + 1, len = per * size;
      for(let x = 0; x < len; x++){ add("express-transport-belt", x0+x, by, 1, 1, { dir:DIR.E, lane:"in" }); add("express-transport-belt", x0+x, by+1, 1, 1, { dir:DIR.E, lane:"out" }); }
      for(let i = 0; i < r.n; i++){
        const col = i % per, top = i < per, mx = x0 + col*size, my = top ? y0 : y0 + size + 4, iy = top ? y0 + size : y0 + size + 3;
        mach(mx, my);
        const ia = size > 3 ? mx + Math.floor(size/2) - 1 : mx, ib = size > 3 ? mx + Math.floor(size/2) + 1 : mx+size-1;
        if(feeds){
          if(top){ add("fast-inserter", ia, iy, 1, 1, { dir:DIR.S, from:"belt" });                    // input belt (next row) → machine
                   add("long-handed-inserter", ib, iy, 1, 1, { dir:DIR.N, from:"machine" }); } // machine → output belt (2 rows down)
          else   { add("long-handed-inserter", ia, iy, 1, 1, { dir:DIR.N, from:"belt" });            // input belt (2 rows up) → machine
                   add("fast-inserter", ib, iy, 1, 1, { dir:DIR.S, from:"machine" }); }      // machine → output belt
        }
        if(size === 3 && (col % 2 === 0 || col === per-1)) add("medium-electric-pole", mx+1, iy, 1, 1);
        else if(size > 3 && col % 1 === 0) add("medium-electric-pole", mx+Math.floor(size/2), iy, 1, 1);
      }
      if(size > 3) add("medium-electric-pole", x0+len, y0+3, 1, 1);   // bridge to the 3x3 rows beside it
    }
  }
  for(let y = 1; y < cell.h; y += 7) add("medium-electric-pole", 0, y, 1, 1);   // spine joining the shelves
  return out;
}
// Factorio blueprint JSON (the caller compresses it: "0" + base64(zlib(json))). It's written in
// the 1.1 format (8-way directions, 1.1 version stamp): Factorio 2.x upgrades it on import, and
// blueprint viewers that only know 1.1 (fbe.teoxoy.com) can still draw it with the game's sprites.
function blueprintJson(cell, opt, label){
  const ents = blockEntities(cell, opt);
  const entities = ents.map((e, i) => {
    const o = { entity_number: i+1, name: e.name, position: { x: e.x + e.w/2, y: e.y + e.h/2 } };
    if(e.dir) o.direction = e.dir / 2;
    if(e.recipe) o.recipe = e.recipe;
    // module requests, as the plan assumes them (the game asks bots or you to fill them)
    const M = e.machine && MACHINES[e.machineKey];
    if(M && opt.profile !== "plain" && ((R[e.key] && R[e.key].p) || ["aop","heavy-crack","light-crack"].includes(e.key))) o.items = { "productivity-module-3": M.slots };
    if(e.name === "beacon") o.items = { "speed-module-3": 2 };
    return o;
  });
  const main = ents.find(e => e.machine);
  return { blueprint: { item:"blueprint", label: label || "Factorio planner block",
    icons: [{ signal:{ type:"item", name: main ? main.name : "assembling-machine-3" }, index:1 }],
    entities, version: 281479278886912 } };   // 1.1.110
}

// ---------- build order -----------------------------------------------------------------
const BUILD_ORDER = ["iron","copper","green","auto","log","brick","steel","mil","oil","red","chem","prod","batt","frames","blue","lds","util","silo","labs"];

if(typeof module !== "undefined") module.exports = { MACHINES, R, OIL, BLOCKS, SCIENCE, solve, layoutBus, layoutCity, layoutWorld, packBlock, nice, effects, BUILD_ORDER, BELT, RESEARCH, blockStep, DEFAULT_PATCHES, guideSteps, parseScan, checkBase, adoptBuilt, blockEntities, blueprintJson, SCAN_COMMAND, UNLOCK_STEP, PATCH_INFO, machineAt, modulesAt, MACHINE_TIERS, effects, PROD3 };
