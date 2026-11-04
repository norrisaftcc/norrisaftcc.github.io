// The rules core: create a game from a setup, step it with a command, and answer the page's
// questions. Pure: it never touches the page, never mutates a state it was given, and rolls
// every die from state.rng. Commands in, events out, as the hedge's Game.act.

import { Mulberry32, seedFromText } from "./rng.js";
import * as H from "./hex.js";
import { TERRAIN, STRUCTURES, TERRAIN_BY_GLYPH, STRUCTURE_BY_GLYPH } from "./data/terrain.js";
import { KAIJU, PART_SLOTS, RULES, SCORE } from "./data/kaiju.js";
import { kaijuDef } from "./data/variants.js";
import { UNITS } from "./data/units.js";
import { MUTATIONS, BUDGET } from "./data/mutations.js";
import { planUnit, planRival, planBerserk } from "./ai.js";
import { say, headline } from "./voice.js";

const ACTORS = ["kaiju", "rival"];
// Stomp strikes like an attack that cannot miss: a damage roll for each thing in the hex.
const STOMP = { id: "stomp", name: "Stomp", kind: "stomp", pattern: "single", range: 1, damage: RULES.stompDamage, accuracy: 100, effects: {} };

// ---------- small helpers ----------

const other = (actor) => (actor === "kaiju" ? "rival" : "kaiju");

export function alive(k) {
  return !!k && !k.withdrawn && k.parts.body.hp > 0;
}

export function partState(part) {
  if (part.hp <= 0) return "crippled";
  if (part.hp <= Math.floor(part.max / 3)) return "bad";
  if (part.hp <= Math.floor((2 * part.max) / 3)) return "hurt";
  return "intact";
}

function roll(s, sides) {
  const m = new Mulberry32(s.rng);
  const v = m.roll(sides);
  s.rng = m.state;
  return v;
}

function randint(s, low, high) {
  const m = new Mulberry32(s.rng);
  const v = m.randint(low, high);
  s.rng = m.state;
  return v;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const byId = (a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1));

function emitter(s, events) {
  return (k, data = {}) => {
    const full = { turn: s.turn, ...data };
    if (!full.variant) delete full.variant; // only a variant game carries the key
    const e = { k, text: say(k, full), ...full };
    events.push(e);
    return e;
  };
}

export function unitAt(state, key) {
  return state.units.find((u) => u.at === key) || null;
}

export function kaijuAt(state, key) {
  for (const a of ACTORS) if (alive(state[a]) && state[a].at === key) return a;
  return null;
}

function terrainAt(state, key) {
  const hex = state.map.hexes[key];
  return hex ? TERRAIN[hex.terrain] : null;
}

export function lineOfSight(state, a, b) {
  const keys = H.line(a, b);
  for (let i = 1; i < keys.length - 1; i++) {
    const t = terrainAt(state, keys[i]);
    if (t && t.blocksLos) return false;
  }
  return true;
}

function inCover(state, unit) {
  return !UNITS[unit.type].air && !!state.map.hexes[unit.at].structure;
}

// ---------- setup ----------

function buildMap(map) {
  const rows = map.terrain.length;
  const cols = map.terrain[0].length;
  const hexes = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const terrain = TERRAIN_BY_GLYPH[map.terrain[row][col]] || "open";
      const glyph = map.features ? map.features[row][col] : ".";
      const type = STRUCTURE_BY_GLYPH[glyph];
      const structure = type ? { type, hp: STRUCTURES[type].hp, maxHp: STRUCTURES[type].hp } : null;
      hexes[H.offsetToKey(col, row)] = { terrain, structure };
    }
  }
  return { cols, rows, hexes };
}

const toKey = (at) => H.offsetToKey(at[0], at[1]);

function makeKaiju(id, actor, start, mutations = null, variant = null) {
  const def = kaijuDef(id, variant);
  if (mutations === null) mutations = def.preset || [];
  let spent = 0;
  const seen = new Set();
  for (const m of mutations) {
    if (!Object.hasOwn(MUTATIONS, m)) throw new Error(`Unknown mutation: ${m}`);
    if (seen.has(m)) throw new Error(`Mutation chosen twice: ${m}`);
    if (def.forbid.includes(m)) throw new Error(`${def.name} cannot take ${MUTATIONS[m].name}`);
    seen.add(m);
    spent += MUTATIONS[m].cost;
  }
  if (spent > BUDGET) throw new Error(`Mutations cost ${spent}; the budget is ${BUDGET}`);
  const k = {
    id,
    variant: def.variant,
    actor,
    at: toKey(start.at),
    facing: start.facing || 0,
    ap: 0,
    apMax: 0,
    armor: def.armor,
    energy: def.energy.start,
    energyMax: def.energy.max,
    hunger: def.hunger ? def.hunger.start : null,
    hungerMax: def.hunger ? def.hunger.max : null,
    parts: {},
    passives: [...def.passives],
    mutations: [...mutations],
    range: 0,
    roarRadius: RULES.roarRadius,
    roarPressure: RULES.roarPressure,
    hungerEvery: 1,
    lingering: 0,
    lastHurt: null,
    used: { roar: false, finish: false },
    berserk: false,
    withdrawn: false,
  };
  for (const p of PART_SLOTS) k.parts[p] = { hp: def.parts[p].hp, max: def.parts[p].hp };
  let bodyBonus = actor === "kaiju" ? BUDGET - spent : 0;
  for (const m of mutations) {
    const a = MUTATIONS[m].apply;
    if (a.armor) k.armor += a.armor;
    if (a.passive && !k.passives.includes(a.passive)) k.passives.push(a.passive);
    if (a.range) k.range += a.range;
    if (a.roarRadius) k.roarRadius += a.roarRadius;
    if (a.roarPressure) k.roarPressure += a.roarPressure;
    if (a.hungerEvery) k.hungerEvery = a.hungerEvery;
    if (a.energyMax) k.energyMax += a.energyMax;
    if (a.energyStart) k.energy += a.energyStart;
    if (a.body) bodyBonus += a.body;
  }
  k.energy = Math.min(k.energy, k.energyMax);
  k.parts.body.hp += bodyBonus;
  k.parts.body.max += bodyBonus;
  return k;
}

// AP before the floor of 1. Lingering may push it below.
function rawAp(k) {
  const def = kaijuDef(k.id, k.variant);
  let ap = def.ap;
  for (const m of k.mutations) ap += MUTATIONS[m].apply.ap || 0;
  if (k.passives.includes("thrusters") && k.parts.aux.hp > 0) ap += 1;
  ap -= RULES.legsAp[partState(k.parts.legs)];
  if (k.hunger !== null && k.hunger >= RULES.hungryAt * k.hungerMax) ap -= RULES.hungryAp;
  ap -= k.lingering;
  if (def.energy.rule === "battery" && k.energy <= 0) ap -= RULES.batteryEmptyAp;
  return ap;
}

function computeAp(k) {
  return Math.max(1, rawAp(k));
}

// A rampage's objective by name: its weights and its star thresholds, from the mission's table.
function rampageObjective(mission, name) {
  const table = mission.objectives || {};
  if (typeof name !== "string" || !Object.hasOwn(table, name)) throw new Error(`Mission ${mission.id} needs an objective`);
  const o = table[name];
  return {
    kind: "none",
    at: null,
    type: null,
    id: o.id,
    name: o.name,
    text: o.text,
    weights: { structures: { ...o.structures }, units: { ...o.units }, perTurn: o.perTurn },
    stars: [...o.stars],
  };
}

// setup: {kaiju, variant, mutations, mission, target, rival, rivalVariant, seed, objective}. A variant
// with a preset build uses it when mutations is absent. The rival takes no mutations. mission is
// resolved: map filled. objective names one of a rampage's objectives (mission.objectives).
export function create(setup) {
  const mission = setup.mission;
  if (!mission || !mission.map || !mission.map.terrain) throw new Error("create needs a resolved mission with a map");
  const seed = typeof setup.seed === "string" ? seedFromText(setup.seed) : (Number(setup.seed) || 0) >>> 0;
  const map = buildMap(mission.map);
  let objective = { kind: mission.objective.kind, at: null, type: null };
  let target = setup.target || null;
  if (mission.objective.kind === "destroy" || mission.objective.kind === "chosen") {
    let at = mission.objective.at;
    if (mission.objective.kind === "chosen") {
      if (!mission.targets || !Object.hasOwn(mission.targets, target)) throw new Error(`Mission ${mission.id} needs a target`);
      at = mission.targets[target];
    }
    const key = toKey(at);
    if (!map.hexes[key]) throw new Error(`Mission ${mission.id} has its objective off the map`);
    const st = map.hexes[key].structure;
    objective = { kind: "destroy", at: key, type: st ? st.type : null };
  }
  if (mission.objective.kind === "none") objective = rampageObjective(mission, setup.objective);
  const s = {
    v: 1,
    seed,
    rng: seed,
    turn: 1,
    turnLimit: mission.turns,
    phase: "kaiju",
    mission: mission.id,
    target,
    goal: mission.goal || "",
    map,
    retreat: (mission.retreat || []).map(toKey),
    rivalRetreat: (mission.rivalRetreat || []).map(toKey),
    objective,
    kaiju: makeKaiju(setup.kaiju, "kaiju", mission.kaijuStart, setup.mutations || null, setup.variant || null),
    rival: null,
    units: [],
    nextUnit: 1,
    pending: (mission.reinforcements || []).map((r) => ({ turn: r.turn, type: r.type, at: toKey(r.at) })),
    tally: { structures: 0, units: 0, destroyed: { structures: [], units: [] } },
    waves: mission.waves ? structuredClone(mission.waves) : null,
    lingeringGrows: !!mission.lingeringGrows,
    result: null,
  };
  if (mission.objective.kind === "rival" || mission.rivalStart) {
    let rivalId = setup.rival;
    if (!rivalId) {
      const others = Object.keys(KAIJU).filter((id) => id !== setup.kaiju);
      rivalId = others[randint(s, 0, others.length - 1)];
    }
    s.rival = makeKaiju(rivalId, "rival", mission.rivalStart, [], setup.rivalVariant || null);
    // Left to chance, the pick draws a die; chosen, it does not. A setup line must say which.
    s.rivalByChance = !setup.rival;
    s.rival.apMax = computeAp(s.rival);
    s.rival.ap = s.rival.apMax;
  }
  for (const u of mission.units || []) addUnit(s, u.type, toKey(u.at));
  phaseStart(s, "kaiju", () => {});
  return s;
}

function addUnit(s, type, at) {
  if (!UNITS[type]) throw new Error(`Unknown unit: ${type}`);
  const u = { id: `u${s.nextUnit}`, type, at, hp: UNITS[type].hp, panicked: 0, reload: 0 };
  s.nextUnit += 1;
  s.units.push(u);
  return u;
}

// ---------- phase start ----------

function changeEnergy(s, actor, change, why, ev) {
  const k = s[actor];
  const before = k.energy;
  k.energy = clamp(k.energy + change, 0, k.energyMax);
  const delta = k.energy - before;
  if (delta !== 0) ev("energy", { actor, who: k.id, variant: k.variant, energy: k.energy, change: delta, why });
}

function nearPower(s, key) {
  for (const h of [key, ...H.neighbors(key)]) {
    const hex = s.map.hexes[h];
    if (hex && hex.structure && STRUCTURES[hex.structure.type].power) return true;
  }
  return false;
}

function heal(s, actor, ev) {
  const k = s[actor];
  let best = null;
  for (const p of PART_SLOTS) {
    const part = k.parts[p];
    const missing = part.max - part.hp;
    if (missing > 0 && (!best || missing > best.missing)) best = { p, missing };
  }
  if (!best) return;
  const part = k.parts[best.p];
  const before = partState(part);
  part.hp = Math.min(part.max, part.hp + RULES.heal);
  ev("heal", { actor, who: k.id, variant: k.variant, part: best.p, hp: part.hp, max: part.max });
  const after = partState(part);
  if (after !== before) ev("part", { actor, who: k.id, variant: k.variant, part: best.p, state: after });
}

function phaseStart(s, actor, ev) {
  const k = s[actor];
  const def = kaijuDef(k.id, k.variant);
  if (actor === "kaiju") ev("phase", { phase: "kaiju" });
  if (k.hunger !== null && (k.hungerEvery <= 1 || s.turn % k.hungerEvery === 0)) {
    k.hunger = Math.min(k.hungerMax, k.hunger + 1);
    ev("hunger", { actor, who: k.id, variant: k.variant, hunger: k.hunger, max: k.hungerMax });
    if (k.hunger >= k.hungerMax) k.berserk = true;
  }
  const rule = def.energy.rule;
  const terrain = terrainAt(s, k.at);
  if (rule === "battery") {
    changeEnergy(s, actor, -RULES.batteryDrain, "drain", ev);
    if (nearPower(s, k.at)) changeEnergy(s, actor, RULES.batteryCharge, "charge", ev);
  }
  if (rule === "water" && terrain.water) {
    changeEnergy(s, actor, terrain.water === "deep" ? RULES.waterDeep : RULES.waterShallow, "water", ev);
  }
  if (k.passives.includes("regen")) heal(s, actor, ev);
  if (k.passives.includes("stoneBody") && terrain.water) heal(s, actor, ev);
  if (s.lingeringGrows && k.lingering >= 1) lingeringGrows(s, actor, ev);
  k.apMax = computeAp(k);
  k.ap = k.apMax;
  k.used.roar = false;
}

// The lingering death: the paralysis deepens each phase start, and what AP cannot pay for
// falls on the body.
function lingeringGrows(s, actor, ev) {
  const k = s[actor];
  k.lingering += 1;
  ev("lingering", { actor, who: k.id, variant: k.variant, lingering: k.lingering });
  const excess = Math.min(k.lingering, 1 - rawAp(k));
  if (excess <= 0) return;
  const res = damageKaiju(s, actor, "body", excess, ev, "lingering");
  ev("hurt", { actor, who: k.id, variant: k.variant, why: "lingering", damage: excess, part: "body", before: res.before, after: res.after });
  res.report();
}

// ---------- paths ----------

// Cheapest-first search from start; costFn(key) is the price to enter, or null when barred.
// The frontier is a binary heap ordered by cost, then by insertion, so ties break the same way every time.
function dijkstra(start, budget, costFn) {
  const best = new Map([[start, { cost: 0, prev: null }]]);
  const heap = [[0, 0, start]];
  let seq = 1;
  const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (item) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  const done = new Set();
  while (heap.length) {
    const [base, , cur] = pop();
    if (done.has(cur)) continue;
    done.add(cur);
    for (const n of H.neighbors(cur)) {
      if (done.has(n)) continue;
      const c = costFn(n);
      if (c === null) continue;
      const total = base + c;
      if (total > budget) continue;
      const known = best.get(n);
      if (!known || total < known.cost) {
        best.set(n, { cost: total, prev: cur });
        push([total, seq++, n]);
      }
    }
  }
  const out = {};
  for (const [k, v] of best) {
    if (k === start) continue;
    const path = [];
    for (let cur = k; cur !== start; cur = best.get(cur).prev) path.push(cur);
    out[k] = { cost: v.cost, path: path.reverse() };
  }
  return out;
}

function kaijuEnterCost(s, actor, key, units) {
  const hex = s.map.hexes[key];
  if (!hex) return null;
  const rival = s[other(actor)];
  if (alive(rival) && rival.at === key) return null;
  const u = units.get(key);
  if (u && UNITS[u.type].air) return null;
  const st = hex.structure ? STRUCTURES[hex.structure.type] : null;
  if (st && st.solid) return null;
  return TERRAIN[hex.terrain].cost + (st ? st.height : 0) + (u ? RULES.crushAp : 0);
}

export function reach(state, actor = "kaiju") {
  const k = state[actor];
  if (!alive(k) || state.result) return {};
  const units = new Map(state.units.map((u) => [u.at, u]));
  return dijkstra(k.at, k.ap, (key) => kaijuEnterCost(state, actor, key, units));
}

function unitCanStand(s, type, key, ignoreId = null) {
  const hex = s.map.hexes[key];
  if (!hex) return false;
  if (kaijuAt(s, key)) return false;
  const there = unitAt(s, key);
  if (there && there.id !== ignoreId) return false;
  return !solidAt(s, key) && unitEnterCost(s, type, key) !== null;
}

function solidAt(s, key) {
  const st = s.map.hexes[key] && s.map.hexes[key].structure;
  return !!st && STRUCTURES[st.type].solid;
}

// The price to pass through a hex. Air units fly over anything; none may stop on a solid structure.
function unitEnterCost(s, type, key) {
  const hex = s.map.hexes[key];
  if (!hex) return null;
  const def = UNITS[type];
  if (def.air) return 1;
  if (solidAt(s, key)) return null;
  const t = TERRAIN[hex.terrain];
  if (t.ground === false) return null;
  if (t.infantryOnly && type !== "infantry") return null;
  return t.ground;
}

// {key: {cost, path}} for every hex the unit can move to this phase.
export function unitReach(state, unitId) {
  const u = state.units.find((x) => x.id === unitId);
  if (!u) return {};
  const def = UNITS[u.type];
  if (def.move <= 0) return {};
  const taken = new Set(state.units.map((x) => x.at));
  for (const a of ACTORS) if (alive(state[a])) taken.add(state[a].at);
  const all = dijkstra(u.at, def.move, (key) => (taken.has(key) ? null : unitEnterCost(state, u.type, key)));
  for (const key of Object.keys(all)) if (solidAt(state, key)) delete all[key];
  return all;
}

// ---------- attacks: definitions and patterns ----------

export function attackOf(state, actor, attackId) {
  const k = state[actor];
  const base = kaijuDef(k.id, k.variant).attacks.find((a) => a.id === attackId);
  if (!base) return null;
  const extra = (base.kind === "ranged" || base.kind === "special") && base.range > 1 ? k.range : 0;
  return { ...base, range: base.range + extra };
}

function attackBlocked(state, actor, a) {
  const k = state[actor];
  if (k.parts[a.uses].hp <= 0) return `The ${kaijuDef(k.id, k.variant).parts[a.uses].name.toLowerCase()} is crippled.`;
  if (a.effects.oncePerMission && k.used[a.id]) return "Already used this mission.";
  if (k.ap < a.ap) return "Not enough AP.";
  if (k.energy < a.energy) return "Not enough energy.";
  return null;
}

function onMap(state, keys) {
  return keys.filter((h) => state.map.hexes[h]);
}

function cutAtMountain(state, keys) {
  const out = [];
  for (const h of keys) {
    if (!state.map.hexes[h]) break;
    out.push(h);
    if (terrainAt(state, h).blocksLos) break;
  }
  return out;
}

function hasVictim(state, actor, key) {
  const hex = state.map.hexes[key];
  if (!hex) return false;
  if (hex.structure || unitAt(state, key)) return true;
  const o = state[other(actor)];
  return alive(o) && o.at === key;
}

// The hexes a pattern covers from where the actor stands, for a given facing.
function patternHexes(state, actor, a, facing) {
  const k = state[actor];
  if (a.pattern === "line") return cutAtMountain(state, H.ray(k.at, facing, a.range));
  if (a.pattern === "cone") return onMap(state, H.cone(k.at, facing, a.range)).filter((h) => lineOfSight(state, k.at, h));
  if (a.pattern === "rear") return onMap(state, [2, 3, 4].map((d) => H.neighbor(k.at, (facing + d) % 6)));
  if (a.pattern === "teleport") {
    return onMap(state, H.range(k.at, a.range)).filter((h) => {
      if (h === k.at || unitAt(state, h) || kaijuAt(state, h)) return false;
      const st = state.map.hexes[h].structure;
      return !(st && STRUCTURES[st.type].solid);
    });
  }
  return onMap(state, H.range(k.at, a.range)).filter(
    (h) => h !== k.at && hasVictim(state, actor, h) && (H.distance(k.at, h) <= 1 || lineOfSight(state, k.at, h)),
  );
}

// Why the attack cannot be used now, or null when it can (targets aside).
export function attackReady(state, attackId, actor = "kaiju") {
  const k = state[actor];
  if (!alive(k) || state.result) return "The mission is over.";
  const a = attackOf(state, actor, attackId);
  if (!a) return "That monster has no such attack.";
  return attackBlocked(state, actor, a);
}

// Legal target hexes. An area pattern is offered only when it would strike something
// (for a zero-damage attack, a unit).
export function attackTargets(state, attackId, actor = "kaiju") {
  const k = state[actor];
  if (attackReady(state, attackId, actor)) return [];
  const a = attackOf(state, actor, attackId);
  const hexes = patternHexes(state, actor, a, k.facing);
  if (a.pattern === "single" || a.pattern === "teleport") return hexes;
  const zero = a.damage[1] === 0;
  return hexes.some((h) => (zero ? !!unitAt(state, h) : hasVictim(state, actor, h))) ? hexes : [];
}

export function affected(state, attackId, target, actor = "kaiju", facing = null) {
  const k = state[actor];
  const a = attackOf(state, actor, attackId);
  if (!a || !alive(k)) return [];
  const all = patternHexes(state, actor, a, facing === null ? k.facing : facing);
  if (!all.includes(target)) return [];
  return a.pattern === "single" || a.pattern === "teleport" ? [target] : all;
}

// Who stands in a hex, in strike order. A single attack strikes only the first.
function victims(state, actor, key) {
  const out = [];
  const o = other(actor);
  if (alive(state[o]) && state[o].at === key) out.push({ kind: "kaiju", actor: o });
  const u = unitAt(state, key);
  if (u) out.push({ kind: "unit", unit: u });
  if (state.map.hexes[key].structure) out.push({ kind: "structure", key });
  return out;
}

function kaijuAccuracy(state, actor, a, v, dist) {
  const k = state[actor];
  if (v.kind === "structure") return 100;
  let acc = a.accuracy - RULES.headAccuracy[partState(k.parts.head)];
  if (v.kind === "kaiju" && state[v.actor].passives.includes("eldritch")) acc -= RULES.eldritchAccuracy;
  if (v.kind === "unit" && inCover(state, v.unit)) acc -= RULES.coverAccuracy;
  if (a.kind === "ranged") acc -= RULES.rangedPerHex * Math.max(0, dist - 1);
  return clamp(acc, RULES.accuracyMin, RULES.accuracyMax);
}

// The fixed part of the damage: everything but the die.
function kaijuDamageMod(state, actor, a, v) {
  const k = state[actor];
  let mod = 0;
  if (a.effects.waterBonus && terrainAt(state, k.at).water) mod += a.effects.waterBonus;
  if (a.kind === "melee") mod -= RULES.armsMelee[partState(k.parts.arms)];
  if (v.kind === "kaiju") {
    const t = state[v.actor];
    if (H.arc(t.facing, k.at, t.at) === "rear") mod += RULES.rearBonus;
    mod -= t.armor;
  }
  if (v.kind === "unit") {
    mod -= UNITS[v.unit.type].armor;
    if (inCover(state, v.unit)) mod -= RULES.coverDamage;
  }
  return mod;
}

function damageRange(min, max, mod, zero) {
  if (zero) return [0, 0];
  return [Math.max(1, min + mod), Math.max(1, max + mod)];
}

// ---------- damage ----------

function hitLocation(s, k) {
  const table = kaijuDef(k.id, k.variant).hitTable;
  const total = table.reduce((n, [, w]) => n + w, 0);
  let r = randint(s, 1, total);
  for (const [part, w] of table) {
    r -= w;
    if (r <= 0) return part;
  }
  return "body";
}

// Damage to a kaiju part. Beyond the part's hp, or on a crippled part, it goes to the body.
// why: "attack", "blast" or "lingering", kept as lastHurt to name the death.
function damageKaiju(s, actor, part, dmg, ev, why = "attack") {
  const k = s[actor];
  k.lastHurt = why;
  let hitPart = part;
  if (part !== "body" && k.parts[part].hp <= 0) hitPart = "body";
  const p = k.parts[hitPart];
  const before = { hp: p.hp, max: p.max };
  const stateBefore = partState(p);
  const bodyBefore = partState(k.parts.body);
  const taken = Math.min(p.hp, dmg);
  p.hp -= taken;
  let spill = 0;
  if (hitPart !== "body") {
    spill = dmg - taken;
    k.parts.body.hp = Math.max(0, k.parts.body.hp - spill);
  }
  const after = { hp: p.hp, max: p.max };
  return {
    part: hitPart,
    before,
    after,
    spill,
    report: () => {
      if (partState(p) !== stateBefore) ev("part", { actor, who: k.id, variant: k.variant, part: hitPart, state: partState(p) });
      if (hitPart !== "body" && partState(k.parts.body) !== bodyBefore) {
        ev("part", { actor, who: k.id, variant: k.variant, part: "body", state: partState(k.parts.body) });
      }
      if (k.parts.body.hp <= 0) ev("destroyed", { what: "kaiju", type: k.id, variant: k.variant, at: k.at, points: 0 });
    },
  };
}

function destroyUnit(s, u, byActor, ev) {
  s.units = s.units.filter((x) => x.id !== u.id);
  const points = byActor === "kaiju" ? UNITS[u.type].points : 0;
  if (points) {
    s.tally.units += points;
    s.tally.destroyed.units.push({ type: u.type, at: u.at });
  }
  ev("destroyed", { what: "unit", type: u.type, at: u.at, points, unit: u.id });
}

function destroyStructure(s, key, byActor, ev) {
  const hex = s.map.hexes[key];
  const type = hex.structure.type;
  hex.structure = null;
  hex.terrain = "rubble";
  const points = byActor === "kaiju" ? STRUCTURES[type].points : 0;
  if (points) {
    s.tally.structures += points;
    s.tally.destroyed.structures.push({ type, at: key });
  }
  ev("destroyed", { what: "structure", type, at: key, points });
  return type;
}

function blast(s, actor, key, type, ev) {
  const k = s[actor];
  if (k.passives.includes("reactorBelly")) {
    ev("blast", { actor, who: k.id, variant: k.variant, at: key, type, energy: RULES.reactorBlastEnergy });
    changeEnergy(s, actor, RULES.reactorBlastEnergy, "reactor", ev);
    return;
  }
  const [lo, hi] = STRUCTURES[type].blast;
  const dmg = randint(s, lo, hi);
  const res = damageKaiju(s, actor, hitLocation(s, k), dmg, ev, "blast");
  ev("blast", { actor, who: k.id, variant: k.variant, at: key, type, damage: dmg, part: res.part, before: res.before, after: res.after, spill: res.spill });
  res.report();
}

function breakStructure(s, actor, key, ev) {
  const type = destroyStructure(s, key, actor, ev);
  if (STRUCTURES[type].power) blast(s, actor, key, type, ev);
}

function panicTest(s, u, pressure, ev) {
  const def = UNITS[u.type];
  let broke = false;
  if (def.morale < 99) {
    const total = roll(s, 6) + roll(s, 6) + pressure;
    broke = total > def.morale;
  }
  ev("panic", { unit: u.id, type: u.type, at: u.at, broke });
  if (!broke) return;
  u.panicked = RULES.panicBroken;
  ev("radio", { callsign: def.radio, about: "break", at: u.at });
  for (const a of ACTORS) {
    const k = s[a];
    if (alive(k) && kaijuDef(k.id, k.variant).energy.rule === "panic") changeEnergy(s, a, RULES.panicEnergy, "panic", ev);
  }
}

function side(state, actor) {
  const v = state[actor].variant;
  return v ? { side: actor, id: actor, type: state[actor].id, variant: v } : { side: actor, id: actor, type: state[actor].id };
}

// ---------- the kaiju's commands ----------

function enterHex(s, actor, key, ev) {
  const k = s[actor];
  const u = unitAt(s, key);
  if (u && !UNITS[u.type].air) {
    ev("crush", { actor, who: k.id, variant: k.variant, at: key, what: "unit", type: u.type });
    destroyUnit(s, u, actor, ev);
  }
  const hex = s.map.hexes[key];
  if (hex.structure) {
    ev("crush", { actor, who: k.id, variant: k.variant, at: key, what: "structure", type: hex.structure.type });
    breakStructure(s, actor, key, ev);
  }
}

function doMove(s, actor, cmd, ev) {
  const k = s[actor];
  const all = reach(s, actor);
  const r = Object.hasOwn(all, cmd.to) ? all[cmd.to] : null;
  if (!r) return "That hex is out of reach.";
  const from = k.at;
  k.ap -= r.cost;
  k.facing = H.directionTo(r.path.length > 1 ? r.path[r.path.length - 2] : from, cmd.to);
  const move = ev("move", { actor, who: k.id, variant: k.variant, from, to: cmd.to, path: r.path, cost: r.cost });
  let walked = 0;
  for (const step of r.path) {
    k.at = step;
    walked += 1;
    enterHex(s, actor, step, ev);
    if (!alive(k)) break;
  }
  if (walked < r.path.length) {
    // A blast ended the walk: the move event tells only the part that happened.
    Object.assign(move, { to: k.at, path: r.path.slice(0, walked), cost: all[k.at].cost });
    const { k: _kind, text: _text, ...data } = move;
    move.text = say("move", data);
  }
  return null;
}

function doFace(s, actor, cmd, ev) {
  const dir = typeof cmd.dir === "number" || (typeof cmd.dir === "string" && /^\d$/.test(cmd.dir)) ? Number(cmd.dir) : NaN;
  if (!Number.isInteger(dir) || dir < 0 || dir > 5) return "Face which way?";
  const k = s[actor];
  k.facing = dir;
  ev("face", { actor, who: k.id, variant: k.variant, dir });
  return null;
}

function strikeUnit(s, actor, a, u, ev) {
  const k = s[actor];
  const v = { kind: "unit", unit: u };
  const hex = s.map.hexes[u.at];
  const def = UNITS[u.type];
  const before = { hp: u.hp, max: def.hp };
  const base = {
    attacker: side(s, actor),
    defender: { side: "unit", id: u.id, type: u.type },
    attack: { id: a.id, name: a.name },
    from: k.at,
    at: u.at,
    terrain: hex.terrain,
    structure: hex.structure ? hex.structure.type : null,
    part: null,
    rear: false,
    spill: 0,
  };
  if (a.damage[1] === 0) {
    ev("attack", { ...base, hit: true, damage: 0, zero: true, before, after: before });
    if (a.effects.panic) panicTest(s, u, a.effects.panic, ev);
    return;
  }
  const dist = H.distance(k.at, u.at);
  const hit = a.id === "stomp" || roll(s, 100) <= kaijuAccuracy(s, actor, a, v, dist);
  let damage = 0;
  if (hit) damage = Math.max(1, randint(s, a.damage[0], a.damage[1]) + kaijuDamageMod(s, actor, a, v));
  u.hp = Math.max(0, u.hp - damage);
  ev("attack", { ...base, hit, damage, before, after: { hp: u.hp, max: def.hp } });
  if (u.hp <= 0) {
    destroyUnit(s, u, actor, ev);
    return;
  }
  if (hit && a.effects.pull && dist === 2) {
    const mid = H.line(k.at, u.at)[1];
    if (unitCanStand(s, u.type, mid, u.id)) {
      const from = u.at;
      u.at = mid;
      ev("umove", { unit: u.id, type: u.type, from, to: mid, path: [mid], pulled: true, who: k.id, variant: k.variant });
    }
  }
  if (hit && a.effects.panic) panicTest(s, u, a.effects.panic, ev);
}

function strikeStructure(s, actor, a, key, ev) {
  const k = s[actor];
  const hex = s.map.hexes[key];
  const st = hex.structure;
  const before = { hp: st.hp, max: st.maxHp };
  const damage = Math.max(1, randint(s, a.damage[0], a.damage[1]) + kaijuDamageMod(s, actor, a, { kind: "structure" }));
  st.hp = Math.max(0, st.hp - damage);
  ev("attack", {
    attacker: side(s, actor),
    defender: { side: "structure", id: key, type: st.type },
    attack: { id: a.id, name: a.name },
    from: k.at,
    at: key,
    terrain: hex.terrain,
    structure: st.type,
    hit: true,
    damage,
    part: null,
    rear: false,
    before,
    after: { hp: st.hp, max: st.maxHp },
    spill: 0,
  });
  if (st.hp <= 0) {
    if (a.id === "stomp") breakStructure(s, actor, key, ev);
    else destroyStructure(s, key, actor, ev);
  }
}

function strikeKaiju(s, actor, a, targetActor, ev) {
  const k = s[actor];
  const t = s[targetActor];
  const v = { kind: "kaiju", actor: targetActor };
  const hex = s.map.hexes[t.at];
  const dist = H.distance(k.at, t.at);
  const rear = H.arc(t.facing, k.at, t.at) === "rear";
  const hit = roll(s, 100) <= kaijuAccuracy(s, actor, a, v, dist);
  const base = {
    attacker: side(s, actor),
    defender: side(s, targetActor),
    attack: { id: a.id, name: a.name },
    from: k.at,
    at: t.at,
    terrain: hex.terrain,
    structure: hex.structure ? hex.structure.type : null,
    rear,
  };
  if (!hit) {
    const body = t.parts.body;
    ev("attack", { ...base, hit: false, damage: 0, part: null, before: { hp: body.hp, max: body.max }, after: { hp: body.hp, max: body.max }, spill: 0 });
    return;
  }
  const damage = Math.max(1, randint(s, a.damage[0], a.damage[1]) + kaijuDamageMod(s, actor, a, v));
  const res = damageKaiju(s, targetActor, hitLocation(s, t), damage, ev);
  ev("attack", { ...base, hit: true, damage, part: res.part, before: res.before, after: res.after, spill: res.spill });
  res.report();
}

// An area attack strikes each victim with its own attack event; the first of them is marked
// "first", so one use of an attack can be told from the many victims it reached.
function marksUse(ev) {
  let first = true;
  return (k, data) => {
    if (k !== "attack" || !first) return ev(k, data);
    first = false;
    return ev(k, { ...data, first: true });
  };
}

function doAttack(s, actor, cmd, ev) {
  const k = s[actor];
  const a = attackOf(s, actor, cmd.attack);
  if (!a) return "That monster has no such attack.";
  const blocked = attackBlocked(s, actor, a);
  if (blocked) return blocked;
  if (!attackTargets(s, a.id, actor).includes(cmd.target)) return "No target there.";
  const hexes = affected(s, a.id, cmd.target, actor);
  ev = marksUse(ev);
  k.ap -= a.ap;
  k.energy -= a.energy;
  if (a.effects.oncePerMission) k.used[a.id] = true;
  if (a.pattern === "teleport") {
    const from = k.at;
    k.at = cmd.target;
    ev("move", { actor, who: k.id, variant: k.variant, from, to: cmd.target, path: [cmd.target], cost: a.ap, teleport: true, attack: a.id });
    if (s.map.hexes[cmd.target].structure) {
      ev("crush", { actor, who: k.id, variant: k.variant, at: cmd.target, what: "structure", type: s.map.hexes[cmd.target].structure.type });
      breakStructure(s, actor, cmd.target, ev);
    }
    return null;
  }
  const single = a.pattern === "single";
  for (const h of hexes) {
    const vs = victims(s, actor, h);
    for (const v of single ? vs.slice(0, 1) : vs) {
      if (v.kind === "unit") {
        if (s.units.includes(v.unit)) strikeUnit(s, actor, a, v.unit, ev);
      } else if (a.damage[1] === 0) {
        continue;
      } else if (v.kind === "kaiju") {
        if (alive(s[v.actor])) strikeKaiju(s, actor, a, v.actor, ev);
      } else if (s.map.hexes[h].structure) {
        strikeStructure(s, actor, a, h, ev);
      }
    }
  }
  return null;
}

function adjacent(s, actor, key) {
  return !!s.map.hexes[key] && H.distance(s[actor].at, key) === 1;
}

export function stompTargets(state, actor = "kaiju") {
  const k = state[actor];
  if (!alive(k)) return [];
  return onMap(state, H.neighbors(k.at)).filter((h) => {
    const u = unitAt(state, h);
    return !!state.map.hexes[h].structure || (u && !UNITS[u.type].air);
  });
}

function doStomp(s, actor, cmd, ev) {
  const k = s[actor];
  if (k.ap < RULES.stompAp) return "Not enough AP.";
  if (!adjacent(s, actor, cmd.target) || !stompTargets(s, actor).includes(cmd.target)) return "Nothing to stomp there.";
  k.ap -= RULES.stompAp;
  ev = marksUse(ev);
  const u = unitAt(s, cmd.target);
  if (u && !UNITS[u.type].air) strikeUnit(s, actor, STOMP, u, ev);
  if (s.map.hexes[cmd.target].structure) strikeStructure(s, actor, STOMP, cmd.target, ev);
  return null;
}

function food(state, actor, key) {
  const k = state[actor];
  const u = unitAt(state, key);
  if (u && !UNITS[u.type].air && UNITS[u.type].edible) return { what: "unit", unit: u };
  const st = state.map.hexes[key] && state.map.hexes[key].structure;
  if (st && STRUCTURES[st.type].populated) return { what: "structure", type: st.type };
  if (st && STRUCTURES[st.type].power && k.passives.includes("reactorBelly")) return { what: "structure", type: st.type, power: true };
  return null;
}

export function eatTargets(state, actor = "kaiju") {
  const k = state[actor];
  if (!alive(k) || k.hunger === null) return [];
  return onMap(state, H.neighbors(k.at)).filter((h) => food(state, actor, h));
}

function doEat(s, actor, cmd, ev) {
  const k = s[actor];
  if (k.hunger === null) return `${kaijuDef(k.id, k.variant).name} does not eat.`;
  if (k.ap < RULES.eatAp) return "Not enough AP.";
  if (!adjacent(s, actor, cmd.target)) return "Too far to eat.";
  const f = food(s, actor, cmd.target);
  if (!f) return "Nothing to eat there.";
  k.ap -= RULES.eatAp;
  const rule = kaijuDef(k.id, k.variant).energy.rule;
  if (f.what === "unit") {
    k.hunger = Math.max(0, k.hunger - UNITS[f.unit.type].edible);
    ev("eat", { actor, who: k.id, variant: k.variant, at: cmd.target, what: "unit", type: f.unit.type, hunger: k.hunger });
    destroyUnit(s, f.unit, actor, ev);
    if (rule === "eat") changeEnergy(s, actor, RULES.eatEnergy, "eat", ev);
    return null;
  }
  if (f.power) {
    ev("eat", { actor, who: k.id, variant: k.variant, at: cmd.target, what: "structure", type: f.type, hunger: k.hunger });
    destroyStructure(s, cmd.target, actor, ev);
    changeEnergy(s, actor, RULES.reactorEatEnergy, "reactor", ev);
    return null;
  }
  k.hunger = Math.max(0, k.hunger - RULES.eatStructureHunger);
  ev("eat", { actor, who: k.id, variant: k.variant, at: cmd.target, what: "structure", type: f.type, hunger: k.hunger });
  destroyStructure(s, cmd.target, actor, ev);
  if (rule === "eat") changeEnergy(s, actor, RULES.eatEnergy, "eat", ev);
  return null;
}

function doRoar(s, actor, cmd, ev) {
  const k = s[actor];
  if (k.used.roar) return "Already roared this turn.";
  if (k.ap < RULES.roarAp) return "Not enough AP.";
  k.ap -= RULES.roarAp;
  k.used.roar = true;
  ev("roar", { actor, who: k.id, variant: k.variant, at: k.at, radius: k.roarRadius });
  const near = s.units.filter((u) => H.distance(u.at, k.at) <= k.roarRadius).sort(byId);
  for (const u of near) panicTest(s, u, k.roarPressure, ev);
  return null;
}

function doWithdraw(s, actor, cmd, ev) {
  const k = s[actor];
  const hexes = actor === "kaiju" ? s.retreat : s.rivalRetreat;
  if (!hexes.includes(k.at)) return "Not on a retreat hex.";
  k.withdrawn = true;
  ev("withdraw", { actor, who: k.id, variant: k.variant, at: k.at });
  if (actor === "kaiju") finish(s, "withdrawn", ev);
  return null;
}

const KAIJU_COMMANDS = { move: doMove, face: doFace, attack: doAttack, stomp: doStomp, eat: doEat, roar: doRoar, withdraw: doWithdraw };

// ---------- the units' commands ----------

export function canFire(state, unit, fromKey, targetKey) {
  const def = UNITS[unit.type];
  const d = H.distance(fromKey, targetKey);
  if (d < def.minRange || d > def.range) return false;
  return def.effect === "indirect" || lineOfSight(state, fromKey, targetKey);
}

function doUmove(s, cmd, ev) {
  const u = s.units.find((x) => x.id === cmd.id);
  if (!u) return "No such unit.";
  const all = unitReach(s, u.id);
  const r = Object.hasOwn(all, cmd.to) ? all[cmd.to] : null;
  if (!r) return "The unit cannot get there.";
  const from = u.at;
  u.at = cmd.to;
  ev("umove", { unit: u.id, type: u.type, from, to: cmd.to, path: r.path });
  return null;
}

function doUfire(s, cmd, ev, fired) {
  const u = s.units.find((x) => x.id === cmd.id);
  if (!u) return "No such unit.";
  const target = cmd.target === "rival" ? "rival" : "kaiju";
  const t = s[target];
  const def = UNITS[u.type];
  if (u.panicked > 0 || u.reload > 0 || fired.has(u.id)) return "The unit cannot fire.";
  if (!alive(t) || !canFire(s, u, u.at, t.at)) return "No shot.";
  fired.add(u.id);
  if (def.reload) u.reload = def.reload - 1;
  const hex = s.map.hexes[t.at];
  const rear = H.arc(t.facing, u.at, t.at) === "rear";
  const acc = clamp(def.accuracy - (t.passives.includes("eldritch") ? RULES.eldritchAccuracy : 0), RULES.accuracyMin, RULES.accuracyMax);
  const hit = roll(s, 100) <= acc;
  const base = {
    attacker: { side: "unit", id: u.id, type: u.type },
    defender: side(s, target),
    attack: { id: "fire", name: def.weapon },
    from: u.at,
    at: t.at,
    terrain: hex.terrain,
    structure: hex.structure ? hex.structure.type : null,
    rear,
  };
  if (!hit) {
    const body = t.parts.body;
    ev("attack", { ...base, hit: false, damage: 0, part: null, before: { hp: body.hp, max: body.max }, after: { hp: body.hp, max: body.max }, spill: 0 });
    return null;
  }
  const damage = Math.max(1, randint(s, def.attack[0], def.attack[1]) + (rear ? RULES.rearBonus : 0) - t.armor);
  const res = damageKaiju(s, target, hitLocation(s, t), damage, ev);
  ev("attack", { ...base, hit: true, damage, part: res.part, before: res.before, after: res.after, spill: res.spill });
  res.report();
  if (def.effect === "lingering") t.lingering += 1;
  return null;
}

// ---------- turn order ----------

function apply(s, actor, cmd, ev) {
  const fn = Object.hasOwn(KAIJU_COMMANDS, cmd.t) ? KAIJU_COMMANDS[cmd.t] : null;
  if (!fn) return "Unknown command.";
  if (!alive(s[actor])) return "That monster is not on the map.";
  const why = fn(s, actor, cmd, ev);
  if (!why) checkEnd(s, ev);
  return why;
}

// Run a planner one command at a time, planning again after each, until it has nothing to do.
function runPlan(s, actor, planner, ev, stopAfterMeal = false) {
  for (let i = 0; i < 40 && !s.result; i++) {
    const plan = planner(s, actor);
    if (!plan.length) return;
    const before = ev.count();
    const why = apply(s, actor, plan[0], ev);
    if (why) return;
    if (stopAfterMeal && ev.since(before).some((e) => e.k === "eat")) return;
  }
}

function playBerserk(s, actor, ev) {
  const k = s[actor];
  ev("berserk", { actor, who: k.id, variant: k.variant });
  runPlan(s, actor, planBerserk, ev, true);
  if (s.result) return;
  k.hunger = Math.min(k.hunger, k.hungerMax - RULES.berserkDrop);
  k.berserk = false;
  ev("hunger", { actor, who: k.id, variant: k.variant, hunger: k.hunger, max: k.hungerMax });
}

function nearestFree(s, type, key) {
  for (let n = 0; n <= Math.max(s.map.cols, s.map.rows) * 2; n++) {
    for (const h of H.ring(key, n)) if (unitCanStand(s, type, h)) return h;
  }
  return null;
}

// The size of turn t's wave, and the unit types it may bring.
export function waveSize(waves, t) {
  return Math.min(waves.size.max, waves.size.base + Math.floor((t - 1) / waves.size.growEvery));
}

function waveTypes(waves, t) {
  return waves.mix.filter((m) => m.from <= t).flatMap((m) => m.types);
}

function edgeHex(s, edge) {
  const { cols, rows } = s.map;
  if (edge === "north") return H.offsetToKey(randint(s, 0, cols - 1), 0);
  return H.offsetToKey(edge === "east" ? cols - 1 : 0, randint(s, 0, rows - 1));
}

// A rampage's wave: units of the unlocked types, each on a rolled edge, while fewer than the cap stand.
function rollWave(s, ev) {
  const w = s.waves;
  const kinds = waveTypes(w, s.turn);
  const types = [];
  for (let i = 0; i < waveSize(w, s.turn); i++) types.push(kinds[randint(s, 0, kinds.length - 1)]);
  // The mad scientist comes first, so a nearly full field still lets the scientist in.
  if (w.scientist && s.turn >= w.scientist.from && (s.turn - w.scientist.from) % w.scientist.every === 0) types.unshift("scientist");
  let first = null;
  const edges = new Set();
  for (const type of types) {
    if (s.units.length >= w.cap) break;
    const edge = w.edges[randint(s, 0, w.edges.length - 1)];
    const at = nearestFree(s, type, edgeHex(s, edge));
    if (!at) continue;
    const u = addUnit(s, type, at);
    ev("reinforce", { unit: u.id, type, at, edge });
    first = first || { type, edge, at };
    edges.add(edge);
  }
  // The call names an edge only when the whole wave came from it.
  if (first) ev("radio", { callsign: "CONTROL", about: "wave", edge: edges.size === 1 ? first.edge : null, at: first.at });
}

function defensePhase(s, ev) {
  ev("phase", { phase: "defense" });
  const due = s.pending.filter((p) => p.turn <= s.turn);
  s.pending = s.pending.filter((p) => p.turn > s.turn);
  for (const p of due) {
    const at = nearestFree(s, p.type, p.at);
    if (!at) continue;
    const u = addUnit(s, p.type, at);
    ev("reinforce", { unit: u.id, type: u.type, at });
    ev("radio", { callsign: UNITS[u.type].radio, about: "arrive", at });
  }
  if (s.waves && s.units.length < s.waves.cap) rollWave(s, ev);
  if (alive(s.rival)) {
    phaseStart(s, "rival", ev);
    if (s.rival.berserk) playBerserk(s, "rival", ev);
    else runPlan(s, "rival", (st) => planRival(st), ev);
    checkEnd(s, ev);
    if (s.result) return;
  }
  const fired = new Set();
  const ids = [...s.units].sort(byId).map((u) => u.id);
  for (const id of ids) {
    if (!s.units.some((u) => u.id === id)) continue;
    for (const cmd of planUnit(s, id)) {
      const why = cmd.t === "umove" ? doUmove(s, cmd, ev) : cmd.t === "ufire" ? doUfire(s, cmd, ev, fired) : "Unknown command.";
      if (why) break;
      if (cmd.t === "ufire" && fired.size === 1) {
        const u = s.units.find((x) => x.id === id);
        if (u) ev("radio", { callsign: UNITS[u.type].radio, about: "fire", at: u.at });
      }
      checkEnd(s, ev);
      if (s.result) return;
    }
  }
  for (const u of s.units) if (u.reload > 0 && !fired.has(u.id)) u.reload -= 1;
}

function endTurn(s, ev) {
  for (let guard = 0; guard < 1000; guard++) {
    defensePhase(s, ev);
    if (s.result) return;
    for (const u of s.units) if (u.panicked > 0) u.panicked -= 1;
    if (s.turnLimit !== null && s.turn >= s.turnLimit) {
      finish(s, "time", ev);
      return;
    }
    s.turn += 1;
    phaseStart(s, "kaiju", ev);
    if (checkEnd(s, ev)) return;
    if (!s.kaiju.berserk) return;
    playBerserk(s, "kaiju", ev);
    if (s.result) return;
  }
}

// ---------- results ----------

function goalMet(s) {
  if (s.objective.kind === "destroy") {
    const hex = s.map.hexes[s.objective.at];
    return !hex || !hex.structure || hex.structure.type !== s.objective.type;
  }
  if (s.objective.kind === "rival") return !alive(s.rival);
  return false;
}

function checkEnd(s, ev) {
  if (s.result) return true;
  if (s.kaiju.parts.body.hp <= 0) finish(s, "fallen", ev);
  else if (goalMet(s)) finish(s, "goal", ev);
  return !!s.result;
}

const DEATHS = { blast: "sudden", lingering: "lingering", attack: "cuts" };

// How the kaiju died, from the last blow that reached it; null when it did not fall.
function deathOf(s, outcome) {
  if (outcome !== "fallen") return null;
  return DEATHS[s.kaiju.lastHurt] || "cuts";
}

// What a structure or unit type is worth under a rampage objective's weights.
export function structureWeight(weights, type) {
  const w = weights.structures;
  const st = STRUCTURES[type];
  let n = st.populated && w.populated !== undefined ? w.populated : w.all;
  if (w.perHeight) n *= st.height;
  return n;
}

export function unitWeight(weights, type) {
  return Object.hasOwn(weights.units, type) ? weights.units[type] : weights.units.all;
}

// A tally weighed by an objective: {structures, units, survival, total}.
export function rampageScore(weights, destroyed, turns) {
  const structures = Math.round(destroyed.structures.reduce((n, d) => n + STRUCTURES[d.type].points * structureWeight(weights, d.type), 0));
  const units = Math.round(destroyed.units.reduce((n, d) => n + UNITS[d.type].points * unitWeight(weights, d.type), 0));
  const survival = weights.perTurn * turns;
  return { structures, units, survival, total: structures + units + survival };
}

export function starsFor(thresholds, total) {
  return 1 + thresholds.filter((t) => total >= t).length;
}

function finishRampage(s, outcome, ev) {
  const o = s.objective;
  const score = rampageScore(o.weights, s.tally.destroyed, s.turn);
  s.result = { grade: "rampage", outcome, score, objective: o.id, stars: starsFor(o.stars, score.total), death: deathOf(s, outcome), headline: "" };
  s.result.headline = headline(s.result, s);
  s.phase = "over";
  ev("over", { result: s.result, objective: o.name });
}

function finish(s, outcome, ev) {
  if (s.result) return;
  if (s.objective.kind === "none") {
    finishRampage(s, outcome, ev);
    return;
  }
  const k = s.kaiju;
  const met = outcome === "goal";
  const partsLeft = PART_SLOTS.filter((p) => k.parts[p].hp > 0).length;
  const score = {
    destruction: s.tally.structures,
    units: s.tally.units,
    objective: met ? SCORE.objective : 0,
    time: met ? SCORE.perTurnLeft * Math.max(0, s.turnLimit - s.turn) : 0,
    parts: outcome === "fallen" ? 0 : SCORE.perPart * partsLeft,
  };
  score.total = score.destruction + score.units + score.objective + score.time + score.parts;
  let grade = "draw";
  if (met) grade = k.parts.body.hp > k.parts.body.max / 2 ? "total victory" : "victory";
  if (outcome === "fallen") grade = "defeat";
  s.result = { grade, outcome, score, death: deathOf(s, outcome), headline: "" };
  s.result.headline = headline(s.result, s);
  s.phase = "over";
  ev("over", { result: s.result });
}

// ---------- step ----------

export function step(state, cmd) {
  const refuse = (text) => ({ state, events: [{ k: "refuse", text: say("refuse", { why: text }), why: text }] });
  if (!cmd || typeof cmd !== "object") return refuse("No command.");
  if (state.result || state.phase === "over") return refuse("The mission is over.");
  if (cmd.t === "umove" || cmd.t === "ufire") return refuse("Unit orders come from the defense phase.");
  if (cmd.actor && cmd.actor !== "kaiju") return refuse("The player commands only the monster.");
  const s = structuredClone(state);
  const events = [];
  const ev = trackedEmitter(s, events);
  if (cmd.t === "end") {
    endTurn(s, ev);
    return { state: s, events };
  }
  if (!Object.hasOwn(KAIJU_COMMANDS, cmd.t)) return refuse("Unknown command.");
  const why = apply(s, "kaiju", cmd, ev);
  if (why) return refuse(why);
  return { state: s, events };
}

function trackedEmitter(s, events) {
  const ev = emitter(s, events);
  ev.count = () => events.length;
  ev.since = (n) => events.slice(n);
  return ev;
}

export function replay(setup, commands) {
  return replayEvents(setup, commands).state;
}

// As replay, with every event the commands raised, in order (refusals included).
export function replayEvents(setup, commands) {
  let state = create(setup);
  const events = [];
  for (const cmd of commands) {
    const out = step(state, cmd);
    state = out.state;
    for (const e of out.events) events.push(e);
  }
  return { state, events };
}

// ---------- queries ----------

function victimInfo(state, v) {
  if (v.kind === "unit") {
    const def = UNITS[v.unit.type];
    return { key: v.unit.at, kind: "unit", id: v.unit.id, type: v.unit.type, name: def.name, hp: v.unit.hp, max: def.hp };
  }
  if (v.kind === "kaiju") {
    const k = state[v.actor];
    return { key: k.at, kind: "kaiju", id: v.actor, type: k.id, variant: k.variant, name: kaijuDef(k.id, k.variant).name, hp: k.parts.body.hp, max: k.parts.body.max };
  }
  const st = state.map.hexes[v.key].structure;
  return { key: v.key, kind: "structure", id: v.key, type: st.type, name: STRUCTURES[st.type].name, hp: st.hp, max: st.maxHp };
}

// Who could strike the actor next defense phase from where it stands now: units, then the other kaiju.
// Each range runs from the weakest blow to the strongest over the hexes the striker could use.
function returnFire(state, actor) {
  const k = state[actor];
  const out = [];
  if (!alive(k)) return out;
  for (const u of [...state.units].sort(byId)) {
    if (u.panicked > 0 || u.reload > 0) continue;
    const spots = [u.at, ...Object.keys(unitReach(state, u.id))].filter((h) => canFire(state, u, h, k.at));
    if (!spots.length) continue;
    const def = UNITS[u.type];
    const acc = clamp(def.accuracy - (k.passives.includes("eldritch") ? RULES.eldritchAccuracy : 0), RULES.accuracyMin, RULES.accuracyMax);
    const rears = spots.map((h) => (H.arc(k.facing, h, k.at) === "rear" ? RULES.rearBonus : 0));
    const lo = damageRange(def.attack[0], def.attack[1], Math.min(...rears) - k.armor, false)[0];
    const hi = damageRange(def.attack[0], def.attack[1], Math.max(...rears) - k.armor, false)[1];
    out.push({ unit: u.id, type: u.type, name: def.name, hitChance: acc, damage: [lo, hi] });
  }
  const best = otherKaijuThreat(state, actor);
  if (best) out.push(best);
  return out;
}

// The other kaiju's best blow next phase: its phase start is played on a copy, then every hex
// it could walk to with the attack's AP kept back is tried, with the attack's own pattern and sight.
function otherKaijuThreat(state, actor) {
  const other = actor === "kaiju" ? "rival" : "kaiju";
  if (!alive(state[other])) return null;
  const ghost = structuredClone(state);
  phaseStart(ghost, other, () => {});
  const o = ghost[other];
  const spots = { [o.at]: { cost: 0 }, ...reach(ghost, other) };
  const home = o.at;
  const vs = { kind: "kaiju", actor };
  let best = null;
  for (const base of kaijuDef(o.id, o.variant).attacks) {
    const a = attackOf(ghost, other, base.id);
    if (a.damage[1] === 0 || a.pattern === "teleport" || attackBlocked(ghost, other, a)) continue;
    for (const [spot, r] of Object.entries(spots)) {
      if (r.cost > o.ap - a.ap) continue;
      o.at = spot;
      const facings = a.pattern === "single" ? [o.facing] : [0, 1, 2, 3, 4, 5];
      const face = facings.find((d) => patternHexes(ghost, other, a, d).includes(ghost[actor].at));
      if (face === undefined) continue;
      o.facing = face;
      const hitChance = kaijuAccuracy(ghost, other, a, vs, H.distance(spot, ghost[actor].at));
      const damage = damageRange(a.damage[0], a.damage[1], kaijuDamageMod(ghost, other, a, vs), false);
      const value = hitChance * (damage[0] + damage[1]);
      if (!best || value > best.value) best = { value, entry: { unit: other, type: o.id, variant: o.variant, name: `${kaijuDef(o.id, o.variant).name}: ${a.name}`, hitChance, damage } };
    }
    o.at = home;
  }
  return best && best.entry;
}

// facing: optional; forecast as if the actor first turned that way (the AI uses it).
export function forecast(state, attackId, target, actor = "kaiju", facing = null) {
  const k = state[actor];
  if (attackId === "stomp") {
    const [lo, hi] = STOMP.damage;
    const targets = [];
    if (stompTargets(state, actor).includes(target)) {
      const u = unitAt(state, target);
      const vs = [];
      if (u && !UNITS[u.type].air) vs.push({ kind: "unit", unit: u });
      if (state.map.hexes[target].structure) vs.push({ kind: "structure", key: target });
      for (const v of vs) targets.push({ ...victimInfo(state, v), hitChance: 100, damage: damageRange(lo, hi, kaijuDamageMod(state, actor, STOMP, v), false) });
    }
    return { apCost: RULES.stompAp, energyCost: 0, targets, returnFire: returnFire(state, actor) };
  }
  const a = attackOf(state, actor, attackId);
  if (!a) return { apCost: 0, energyCost: 0, targets: [], returnFire: [] };
  const hexes = affected(state, attackId, target, actor, facing);
  const targets = [];
  if (a.pattern !== "teleport") {
    for (const h of hexes) {
      const vs = victims(state, actor, h);
      for (const v of a.pattern === "single" ? vs.slice(0, 1) : vs) {
        const zero = a.damage[1] === 0;
        if (zero && v.kind !== "unit") continue;
        const dist = H.distance(k.at, h);
        targets.push({
          ...victimInfo(state, v),
          hitChance: zero ? 100 : kaijuAccuracy(state, actor, a, v, dist),
          damage: damageRange(a.damage[0], a.damage[1], kaijuDamageMod(state, actor, a, v), zero),
        });
      }
    }
  }
  return { apCost: a.ap, energyCost: a.energy, targets, returnFire: returnFire(state, actor) };
}

export function actions(state) {
  const k = state.kaiju;
  const over = !!state.result || !alive(k);
  const out = [];
  const add = (id, name, kind, ap, energy, why) => out.push({ id, name, kind, ap, energy, enabled: !why, why: why || "" });
  const overWhy = "The mission is over.";
  add("move", "Move", "move", null, 0, over ? overWhy : k.ap <= 0 ? "No AP left." : Object.keys(reach(state)).length ? null : "Nowhere to go.");
  add("face", "Face", "face", 0, 0, over ? overWhy : null);
  for (const base of kaijuDef(k.id, k.variant).attacks) {
    const a = attackOf(state, "kaiju", base.id);
    let why = over ? overWhy : attackBlocked(state, "kaiju", a);
    if (!why && !attackTargets(state, a.id, "kaiju").length) why = "No target in reach.";
    add(a.id, a.name, "attack", a.ap, a.energy, why);
  }
  let why = over ? overWhy : k.ap < RULES.stompAp ? "Not enough AP." : stompTargets(state).length ? null : "Nothing adjacent to stomp.";
  add("stomp", "Stomp", "stomp", RULES.stompAp, 0, why);
  if (over) why = overWhy;
  else if (k.hunger === null) why = `${kaijuDef(k.id, k.variant).name} does not eat.`;
  else if (k.ap < RULES.eatAp) why = "Not enough AP.";
  else why = eatTargets(state).length ? null : "Nothing adjacent to eat.";
  add("eat", "Eat", "eat", RULES.eatAp, 0, why);
  why = over ? overWhy : k.used.roar ? "Already roared this turn." : k.ap < RULES.roarAp ? "Not enough AP." : null;
  add("roar", "Roar", "roar", RULES.roarAp, 0, why);
  add("withdraw", "Withdraw", "withdraw", 0, 0, over ? overWhy : state.retreat.includes(k.at) ? null : "Not on a retreat hex.");
  add("end", "End turn", "end", 0, 0, over ? overWhy : null);
  return out;
}

export function describeHex(state, key) {
  const hex = state.map.hexes[key];
  if (!hex) return { terrain: null, structure: null, units: [], kaiju: null, text: "Off the map." };
  const t = TERRAIN[hex.terrain];
  const terrain = { id: t.id, name: t.name, cost: t.cost };
  const st = hex.structure;
  const structure = st
    ? { type: st.type, name: STRUCTURES[st.type].name, hp: st.hp, max: st.maxHp, height: STRUCTURES[st.type].height, points: STRUCTURES[st.type].points }
    : null;
  const units = state.units
    .filter((u) => u.at === key)
    .map((u) => ({ id: u.id, type: u.type, name: UNITS[u.type].name, hp: u.hp, max: UNITS[u.type].hp, panicked: u.panicked }));
  const who = kaijuAt(state, key);
  const kaiju = who ? { actor: who, id: state[who].id, variant: state[who].variant, name: kaijuDef(state[who].id, state[who].variant).name } : null;
  const bits = [];
  if (kaiju) bits.push(`${kaiju.name}${who === "rival" ? ", the rival" : ""}.`);
  if (structure) bits.push(`${structure.name}, ${structure.hp} of ${structure.max}, height ${structure.height}.`);
  for (const u of units) bits.push(`${u.name}, ${u.hp} of ${u.max}${u.panicked ? ", running" : ""}.`);
  bits.push(`${t.name}${t.blocksLos ? ", blocks sight" : ""}.`);
  if (state.objective.at === key) bits.push("The objective.");
  if (state.retreat.includes(key)) bits.push("A way out.");
  return { terrain, structure, units, kaiju, text: bits.join(" ") };
}
