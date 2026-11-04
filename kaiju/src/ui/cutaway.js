// The combat cutaway: two combatants over the defender's terrain, name plates and hp bars at
// the bottom, Fire Emblem fashion. planScenes picks which attack events get a scene and groups
// them; buildScene reads the scene from the board before and after; playScene shows it.

import { PART_SLOTS } from "../data/kaiju.js";
import { kaijuDef } from "../data/variants.js";
import { UNITS } from "../data/units.js";
import { figure as kaijuFigure } from "../art/kaiju.js";
import { figure as unitFigure } from "../art/units.js";
import { backdrop } from "../art/terrain.js";
import { partState } from "../rules.js";
import { esc } from "./panels.js";

const KAIJU_SIDES = ["kaiju", "rival"];
// Figures shown for one unit at full strength; a group shows more, up to five.
const SQUAD = { infantry: 5, tank: 3, artillery: 2, helicopter: 2, jet: 2, missile: 2, gun: 2, maser: 1, scientist: 1 };
// Events that end a run of grouped attacks.
const BREAK = new Set(["phase", "over", "move", "face", "berserk", "withdraw", "reinforce"]);

// Does this attack event get a cutaway in this mode? Only attacks that involve the player's kaiju.
export function qualifies(e, mode) {
  if (e.k !== "attack" || mode === "off") return false;
  const a = e.attacker.side;
  const d = e.defender.side;
  if (a !== "kaiju" && d !== "kaiju") return false;
  if (mode === "kaiju") return KAIJU_SIDES.includes(a) && KAIJU_SIDES.includes(d);
  return d !== "structure";
}

function groupKey(e) {
  const d = e.defender;
  return `${e.attacker.side}|${e.attacker.type}|${e.attack.id}|${d.side}|${d.side === "unit" ? d.type : d.id}`;
}

// [{start, end, events}]: runs of consecutive qualifying attacks with the same attacker type,
// attack and defender, so one unit type's fire on the kaiju in one phase is one scene [CMB-5].
export function planScenes(events, mode) {
  const groups = [];
  let cur = null;
  events.forEach((e, i) => {
    if (BREAK.has(e.k)) {
      cur = null;
      return;
    }
    if (!qualifies(e, mode)) return;
    const key = groupKey(e);
    if (cur && cur.key === key) {
      cur.end = i;
      cur.events.push(e);
      return;
    }
    cur = { key, start: i, end: i, events: [e] };
    groups.push(cur);
  });
  return groups;
}

const states = (k) => Object.fromEntries(PART_SLOTS.map((p) => [p, partState(k.parts[p])]));
const unitsById = (view, ids) => ids.map((id) => view.units.find((u) => u.id === id)).filter(Boolean);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function countFor(type, n, hp, max) {
  if (hp <= 0) return 0;
  const full = Math.min(5, SQUAD[type] * n);
  return Math.max(1, Math.ceil((full * hp) / max));
}

function unitSide(type, ids, before, after) {
  const def = UNITS[type];
  const max = def.hp * ids.length;
  const hpOf = (view) => unitsById(view, ids).reduce((sum, u) => sum + u.hp, 0);
  const hp0 = hpOf(before);
  const hp1 = hpOf(after);
  return {
    kind: "unit",
    type,
    name: ids.length > 1 ? `${def.name} × ${ids.length}` : def.name,
    bars: [{ label: "Strength", before: hp0, after: hp1, max }],
    count0: countFor(type, ids.length, hp0, max),
    count1: countFor(type, ids.length, hp1, max),
  };
}

function kaijuSide(actor, before, after) {
  const k0 = before[actor];
  const k1 = after[actor];
  const def = kaijuDef(k0.id, k0.variant);
  const bars = [];
  for (const p of PART_SLOTS) {
    if (k0.parts[p].hp !== k1.parts[p].hp) bars.push({ label: def.parts[p].name, before: k0.parts[p].hp, after: k1.parts[p].hp, max: k0.parts[p].max });
  }
  if (!bars.length) bars.push({ label: def.parts.body.name, before: k0.parts.body.hp, after: k1.parts.body.hp, max: k0.parts.body.max });
  return { kind: "kaiju", id: k0.id, look: def.look, name: def.name, bars, parts0: states(k0), parts1: states(k1), down: k1.parts.body.hp <= 0 };
}

// Panic results for units hit by a zero-damage attack: the events within the run, and after it
// up to the next attack.
function panicWord(events, group, ids) {
  let broke = 0;
  let held = 0;
  for (let i = group.start; i < events.length && (i <= group.end || (events[i].k !== "attack" && !BREAK.has(events[i].k))); i++) {
    const e = events[i];
    if (e.k === "panic" && ids.includes(e.unit)) e.broke ? broke++ : held++;
  }
  if (broke && !held) return "BROKEN";
  if (held && !broke) return "STEADY";
  return broke ? "SHAKEN" : "STARE";
}

// before: the board as it stood when the run began; after: once its last event applied.
export function buildScene(group, before, after, events) {
  const e0 = group.events[0];
  const attacker = e0.attacker;
  const defender = e0.defender;
  const attackerIds = [...new Set(group.events.map((e) => e.attacker.id))];
  const defenderIds = [...new Set(group.events.map((e) => e.defender.id))];
  const left = attacker.side === "unit" ? unitSide(attacker.type, attackerIds, before, before) : kaijuSide(attacker.side, before, before);
  const right = defender.side === "unit" ? unitSide(defender.type, defenderIds, before, after) : kaijuSide(defender.side, before, after);
  const hits = group.events.filter((e) => e.hit).length;
  const damage = group.events.reduce((sum, e) => sum + (e.hit ? e.damage : 0), 0);
  const shots = group.events.length;
  let result;
  if (group.events.every((e) => e.zero)) result = { text: panicWord(events, group, defenderIds), hit: true };
  else if (!hits) result = { text: "MISS", hit: false };
  else {
    const lost = right.kind === "unit" ? right.bars[0].before - right.bars[0].after : damage;
    result = { text: `−${lost}`, hit: true };
  }
  let note = "";
  if (shots > 1) note = hits === shots ? `${shots} hits` : `${hits} of ${shots} hit`;
  if (group.events.some((e) => e.hit && e.rear)) note = (note ? note + ", " : "") + "from behind";
  return {
    title: cap(e0.attack.name),
    note,
    terrain: e0.terrain,
    structure: e0.structure,
    left,
    right,
    result,
  };
}

function figureOf(side, flip, after) {
  if (side.kind === "kaiju") return kaijuFigure(side.look, { flip, parts: after ? side.parts1 : side.parts0 });
  const n = after ? side.count1 : side.count0;
  if (n > 0) return unitFigure(side.type, { flip, count: n });
  return `<div class="fallen">${unitFigure(side.type, { flip, count: 1 })}</div>`;
}

function bars(side, after) {
  return side.bars.map((b) => {
    const v = after ? b.after : b.before;
    const w = b.max > 0 ? (100 * Math.max(0, v)) / b.max : 0;
    return `<div class="pbar"><span class="pbar-label">${esc(b.label)}</span><span class="pbar-track"><span class="pbar-fill" style="width:${w.toFixed(1)}%"></span></span>`
      + `<span class="pbar-num">${Math.max(0, v)}</span></div>`;
  }).join("");
}

function plate(side, cls, after) {
  return `<div class="plate ${cls}"><div class="plate-name">${esc(side.name)}</div>${bars(side, after)}</div>`;
}

function stageHtml(scene, final) {
  const bg = backdrop(scene.terrain || "open", scene.structure ? { structure: scene.structure } : {});
  return `<div class="cut-stage" role="img" aria-label="${esc(scene.left.name)} against ${esc(scene.right.name)}: ${esc(scene.title)}, ${esc(scene.result.text)}">`
    + `<div class="cut-bg">${bg}</div>`
    + `<div class="cut-banner"><span>${esc(scene.title)}</span>${scene.note ? `<small>${esc(scene.note)}</small>` : ""}</div>`
    + `<div class="cut-actor left">${figureOf(scene.left, false, false)}</div>`
    + `<div class="cut-actor right">${figureOf(scene.right, true, final)}</div>`
    + `<div class="cut-flash"></div>`
    + `<div class="cut-number${scene.result.hit ? "" : " miss"}"${final ? "" : ' style="opacity:0"'}>${esc(scene.result.text)}</div>`
    + `<div class="cut-plates">${plate(scene.left, "left", false)}${plate(scene.right, "right", final)}</div>`
    + `<div class="cut-skip">Tap to skip</div></div>`;
}

// Show a scene in host; resolves when it ends or is skipped (a tap, Escape, Enter or Space),
// with true when the player skipped it.
export function playScene(host, scene, { reduced = false } = {}) {
  return new Promise((resolve) => {
    let skipped = false;
    let wake = null;
    const timers = new Set();
    const wait = (ms) => new Promise((r) => {
      if (skipped) return r();
      const t = setTimeout(() => {
        timers.delete(t);
        wake = null;
        r();
      }, ms);
      timers.add(t);
      wake = () => {
        clearTimeout(t);
        timers.delete(t);
        r();
      };
    });
    const skip = () => {
      if (skipped) return;
      skipped = true;
      if (wake) wake();
    };
    const onKey = (e) => {
      if (["Escape", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        skip();
      }
    };
    const finish = () => {
      for (const t of timers) clearTimeout(t);
      host.removeEventListener("pointerdown", skip);
      document.removeEventListener("keydown", onKey, true);
      host.hidden = true;
      host.innerHTML = "";
      resolve(skipped);
    };
    host.addEventListener("pointerdown", skip);
    document.addEventListener("keydown", onKey, true);
    host.hidden = false;

    if (reduced) {
      host.innerHTML = stageHtml(scene, true);
      wait(1200).then(finish);
      return;
    }

    host.innerHTML = stageHtml(scene, false);
    const q = (s) => host.querySelector(s);
    const stage = q(".cut-stage");
    const left = q(".cut-actor.left");
    const right = q(".cut-actor.right");
    const number = q(".cut-number");
    const flash = q(".cut-flash");
    const anim = (el, frames, ms, easing = "ease-out") => (el && !skipped ? el.animate(frames, { duration: ms, easing, fill: "forwards" }) : null);
    (async () => {
      anim(stage, [{ opacity: 0 }, { opacity: 1 }], 300);
      anim(left, [{ transform: "translateX(-30%)" }, { transform: "translateX(0)" }], 300);
      anim(right, [{ transform: "translateX(30%)" }, { transform: "translateX(0)" }], 300);
      await wait(300);
      anim(left, [{ transform: "translateX(0)" }, { transform: "translateX(16%)" }, { transform: "translateX(0)" }], 300, "ease-in-out");
      await wait(150);
      if (scene.result.hit) {
        anim(flash, [{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }], 160);
        if (!skipped) right.innerHTML = figureOf(scene.right, true, true);
        anim(right, [{ transform: "translateX(0)" }, { transform: "translateX(5%)" }, { transform: "translateX(-3%)" }, { transform: "translateX(0)" }], 260);
      } else {
        anim(right, [{ transform: "translateX(0)" }, { transform: "translateX(9%)" }, { transform: "translateX(0)" }], 300, "ease-in-out");
      }
      await wait(120);
      anim(number, [{ opacity: 0, transform: "translate(-50%, 20%)" }, { opacity: 1, transform: "translate(-50%, -40%)" }], 380);
      if (!skipped) {
        const fills = host.querySelectorAll(".plate.right .pbar-fill");
        const nums = host.querySelectorAll(".plate.right .pbar-num");
        scene.right.bars.forEach((b, i) => {
          if (fills[i]) fills[i].style.width = `${(b.max > 0 ? (100 * Math.max(0, b.after)) / b.max : 0).toFixed(1)}%`;
          if (nums[i]) nums[i].textContent = Math.max(0, b.after);
        });
      }
      await wait(380);
      if (scene.right.kind === "unit" && scene.right.count1 === 0) anim(q(".cut-actor.right"), [{ opacity: 1 }, { opacity: 0 }], 300);
      if (scene.right.kind === "kaiju" && scene.right.down) anim(q(".cut-actor.right"), [{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(12%) rotate(8deg)" }], 400);
      await wait(600);
      anim(stage, [{ opacity: 1 }, { opacity: 0 }], 200);
      await wait(200);
      finish();
    })();
  });
}
