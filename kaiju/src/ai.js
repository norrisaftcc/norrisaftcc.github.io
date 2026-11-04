// Plans for the other side: defense units, the rival kaiju and a berserk kaiju. Pure functions
// over a state that return commands; the rules apply them. Ties break the same way every time.

import * as H from "./hex.js";
import { RULES } from "./data/kaiju.js";
import { kaijuDef } from "./data/variants.js";
import { UNITS } from "./data/units.js";
import { STRUCTURES, TERRAIN } from "./data/terrain.js";
import { alive, reach, unitReach, canFire, attackOf, attackReady, attackTargets, affected, forecast, unitAt, stompTargets } from "./rules.js";

const ACTORS = ["kaiju", "rival"];
const LOW_BATTERY = 2;

// Best of a list by score (higher wins); ties to `prefer`, then the lowest key.
function best(keys, score, prefer = null) {
  let top = null;
  let topScore = -Infinity;
  for (const k of keys) {
    const s = score(k);
    let wins = top === null || s > topScore;
    if (!wins && s === topScore && top !== prefer) wins = k === prefer || k < top;
    if (wins) {
      top = k;
      topScore = s;
    }
  }
  return { key: top, score: topScore };
}

export function planUnit(state, unitId) {
  const u = state.units.find((x) => x.id === unitId);
  if (!u) return [];
  const def = UNITS[u.type];
  const foes = ACTORS.filter((a) => alive(state[a]));
  if (!foes.length) return [];
  const spots = [u.at, ...Object.keys(unitReach(state, unitId))];
  const minDist = (h) => Math.min(...foes.map((a) => H.distance(h, state[a].at)));

  if (u.panicked > 0) {
    const { key } = best(spots, minDist, u.at);
    return key === u.at ? [] : [{ t: "umove", id: u.id, to: key }];
  }

  const target = foes.reduce((a, b) => (H.distance(u.at, state[b].at) < H.distance(u.at, state[a].at) ? b : a));
  const tk = state[target].at;
  const score = (h) => {
    const d = H.distance(h, tk);
    let s = 0;
    if (canFire(state, u, h, tk)) s += 10;
    if (u.type === "infantry" && state.map.hexes[h].structure) s += 3;
    s -= 2 * Math.abs(d - def.range);
    if (def.range > 1 && minDist(h) === 1) s -= 5;
    return s;
  };
  const { key } = best(spots, score, u.at);
  const plan = [];
  if (key !== u.at) plan.push({ t: "umove", id: u.id, to: key });
  if (u.reload <= 0) {
    const shot = [target, ...foes.filter((a) => a !== target)].find((a) => canFire(state, u, key, state[a].at));
    if (shot) plan.push({ t: "ufire", id: u.id, target: shot });
  }
  return plan;
}

function expected(state, actor, attackId, target, facing) {
  const f = forecast(state, attackId, target, actor, facing);
  const foe = f.targets.find((t) => t.kind === "kaiju");
  if (!foe) return 0;
  return (foe.hitChance / 100) * ((foe.damage[0] + foe.damage[1]) / 2);
}

// Every way the actor can strike the other kaiju from where it stands: [{attack, facing, target, value}].
function strikes(state, actor) {
  const k = state[actor];
  const foe = state[actor === "kaiju" ? "rival" : "kaiju"];
  const out = [];
  for (const base of kaijuDef(k.id, k.variant).attacks) {
    if (base.pattern === "teleport" || base.damage[1] === 0) continue;
    const a = attackOf(state, actor, base.id);
    if (attackReady(state, a.id, actor)) continue;
    if (a.pattern === "single") {
      if (!attackTargets(state, a.id, actor).includes(foe.at)) continue;
      out.push({ attack: a, facing: null, target: foe.at, value: expected(state, actor, a.id, foe.at, null) });
      continue;
    }
    const dirs = [k.facing, 0, 1, 2, 3, 4, 5].filter((d, i, all) => all.indexOf(d) === i);
    for (const d of dirs) {
      if (!affected(state, a.id, foe.at, actor, d).length) continue;
      out.push({ attack: a, facing: d, target: foe.at, value: expected(state, actor, a.id, foe.at, d) });
      break;
    }
  }
  return out;
}

function strikeCommands(actor, k, s) {
  const cmds = [];
  if (s.facing !== null && s.facing !== k.facing) cmds.push({ t: "face", actor, dir: s.facing });
  cmds.push({ t: "attack", actor, attack: s.attack.id, target: s.target });
  return cmds;
}

function isPower(state, key) {
  const st = state.map.hexes[key] && state.map.hexes[key].structure;
  return !!st && !!STRUCTURES[st.type].power;
}

// Hexes beside an undestroyed power structure, where a battery charges at phase start.
function chargers(state) {
  const out = new Set();
  for (const key of Object.keys(state.map.hexes)) {
    if (!isPower(state, key)) continue;
    for (const n of H.neighbors(key)) if (state.map.hexes[n] && !isPower(state, n)) out.add(n);
  }
  return [...out];
}

// A battery kaiju low on charge walks to a power structure and waits beside it, without
// walking through one. Returns null when it has no reason to.
function planRecharge(state, actor, foe) {
  const k = state[actor];
  const spots = chargers(state);
  if (!spots.length) return null;
  if (spots.includes(k.at)) {
    const dir = H.directionTo(k.at, foe.at);
    return dir !== k.facing ? [{ t: "face", actor, dir }] : [];
  }
  const toSpot = (h) => Math.min(...spots.map((x) => H.distance(h, x)));
  const options = reach(state, actor);
  const safe = Object.keys(options).filter((h) => !options[h].path.some((p) => isPower(state, p)));
  const { key } = best(safe, (h) => -toSpot(h) - options[h].cost / 100);
  if (key && toSpot(key) < toSpot(k.at)) return [{ t: "move", actor, to: key }];
  return null;
}

export function planRival(state) {
  const actor = "rival";
  const r = state.rival;
  const foe = state.kaiju;
  if (!alive(r) || !alive(foe) || state.result) return [];
  const def = kaijuDef(r.id, r.variant);

  if (r.parts.body.hp <= RULES.retreatBelow * r.parts.body.max && state.rivalRetreat.length) {
    if (state.rivalRetreat.includes(r.at)) return [{ t: "withdraw", actor }];
    const toExit = (h) => Math.min(...state.rivalRetreat.map((x) => H.distance(h, x)));
    const options = reach(state, actor);
    const { key } = best(Object.keys(options), (h) => -toExit(h) - options[h].cost / 100);
    if (key && toExit(key) < toExit(r.at)) return [{ t: "move", actor, to: key }];
    return [];
  }

  if (!r.used.roar && r.ap >= RULES.roarAp) {
    const near = state.units.filter((u) => H.distance(u.at, r.at) <= r.roarRadius).length;
    if (near >= 3) return [{ t: "roar", actor }];
  }

  const all = strikes(state, actor);
  const specials = all.filter((s) => s.attack.kind === "special");
  const pool = specials.length ? specials : all;
  if (pool.length) {
    const top = pool.reduce((a, b) => (b.value > a.value ? b : a));
    return strikeCommands(actor, r, top);
  }

  if (def.energy.rule === "battery" && r.energy <= LOW_BATTERY) {
    const plan = planRecharge(state, actor, foe);
    if (plan) return plan;
  }

  const options = reach(state, actor);
  const keys = Object.keys(options);
  if (keys.length) {
    const wet = def.energy.rule === "water";
    const value = (h) => {
      const t = TERRAIN[state.map.hexes[h].terrain];
      return -H.distance(h, foe.at) + (wet && t.water ? 0.5 : 0) - options[h].cost / 100;
    };
    const here = -H.distance(r.at, foe.at) + (wet && TERRAIN[state.map.hexes[r.at].terrain].water ? 0.5 : 0);
    const { key, score } = best(keys, value);
    if (score > here) return [{ t: "move", actor, to: key }];
  }

  const dir = H.directionTo(r.at, foe.at);
  if (dir !== r.facing) return [{ t: "face", actor, dir }];
  return [];
}

function isFood(state, key) {
  const u = unitAt(state, key);
  if (u && !UNITS[u.type].air && UNITS[u.type].edible) return true;
  const st = state.map.hexes[key] && state.map.hexes[key].structure;
  return !!st && STRUCTURES[st.type].populated;
}

export function planBerserk(state, actor = "kaiju") {
  const k = state[actor];
  if (!alive(k) || k.hunger === null || state.result) return [];
  const foods = Object.keys(state.map.hexes).filter((h) => isFood(state, h));
  if (!foods.length) return [];
  if (k.ap >= RULES.eatAp) {
    const near = H.neighbors(k.at).filter((h) => foods.includes(h)).sort();
    if (near.length) return [{ t: "eat", actor, target: near[0] }];
  }
  const options = reach(state, actor);
  const foodSet = new Set(foods);
  const beside = Object.keys(options).filter((h) => H.neighbors(h).some((n) => foodSet.has(n)));
  if (beside.length && k.ap - Math.min(...beside.map((h) => options[h].cost)) >= RULES.eatAp) {
    const { key } = best(beside, (h) => -options[h].cost);
    return [{ t: "move", actor, to: key }];
  }
  const toFood = (h) => Math.min(...foods.map((f) => H.distance(h, f)));
  const { key } = best(Object.keys(options), (h) => -toFood(h) - options[h].cost / 100);
  if (key && toFood(key) < toFood(k.at)) return [{ t: "move", actor, to: key }];
  if (k.ap >= RULES.stompAp) {
    const nearest = foods.reduce((a, b) => (H.distance(k.at, b) < H.distance(k.at, a) ? b : a));
    const ahead = H.neighbor(k.at, H.directionTo(k.at, nearest));
    if (stompTargets(state, actor).includes(ahead)) return [{ t: "stomp", actor, target: ahead }];
  }
  return [];
}
