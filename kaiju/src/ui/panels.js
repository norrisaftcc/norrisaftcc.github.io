// The play screen's panels as HTML strings: top bar, status, inspect, actions, the log's lines,
// the hint bar under the map and the forecast sheet. main.js puts them on the page.

import { PART_SLOTS } from "../data/kaiju.js";
import { kaijuDef } from "../data/variants.js";
import { STRUCTURES } from "../data/terrain.js";
import { UNITS } from "../data/units.js";
import { portrait, silhouette } from "../art/kaiju.js";
import { STATE_FILL } from "../art/defs.js";
import { partState } from "../rules.js";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Keys for each action id. Attacks take 2, 3 and 4 in the order the kaiju lists them.
export function actionKeys(list) {
  const keys = {};
  let n = 2;
  for (const a of list) {
    if (a.id === "move") keys[a.id] = "1";
    else if (a.kind === "attack") keys[a.id] = String(n++);
    else if (a.id === "stomp") keys[a.id] = "5";
    else if (a.id === "eat") keys[a.id] = "6";
    else if (a.id === "withdraw") keys[a.id] = "7";
    else if (a.id === "face") keys[a.id] = "F";
    else if (a.id === "roar") keys[a.id] = "R";
    else if (a.id === "end") keys[a.id] = "E";
  }
  return keys;
}

export function partStates(k) {
  const out = {};
  for (const p of PART_SLOTS) out[p] = partState(k.parts[p]);
  return out;
}

export function goalShort(state) {
  const o = state.objective;
  if (o.kind === "none") return `No goal but the score: ${o.name}`;
  if (o.kind === "rival" && state.rival) return `Defeat ${kaijuDef(state.rival.id, state.rival.variant).name}`;
  if (o.type && STRUCTURES[o.type]) return `Destroy the ${STRUCTURES[o.type].name.toLowerCase()}`;
  return state.goal;
}

const ICON_GEAR = `<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0 -7zM10.4 2h3.2l.5 2.6l1.9 .8l2.2 -1.5l2.3 2.3l-1.5 2.2l.8 1.9l2.6 .5v3.2l-2.6 .5l-.8 1.9l1.5 2.2l-2.3 2.3l-2.2 -1.5l-1.9 .8l-.5 2.6h-3.2l-.5 -2.6l-1.9 -.8l-2.2 1.5l-2.3 -2.3l1.5 -2.2l-.8 -1.9l-2.6 -.5v-3.2l2.6 -.5l.8 -1.9l-1.5 -2.2l2.3 -2.3l2.2 1.5l1.9 -.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
export const ICON_THEME = `<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>`;

export function topBar(state, { phase, themeName }) {
  const k = state.kaiju;
  const turn = `<span class="tb-item"><span class="tb-long">Turn </span><span class="tb-short">T</span><b>${state.turn}</b>${state.turnLimit ? `/${state.turnLimit}` : ""}</span>`;
  const ap = `<span class="tb-item">AP <b>${k.ap}</b>/${k.apMax}</span>`;
  const goalText = state.objective.kind === "none" ? `${state.goal} ${state.objective.name}: ${state.objective.text}` : state.goal;
  const goalHtml = state.objective.kind === "none"
    ? `<span class="tb-long">No goal but the score: </span><span class="tb-short">Score: </span>${esc(state.objective.name)}`
    : esc(goalShort(state));
  const goal = `<span class="tb-goal" title="${esc(goalText)}">${goalHtml}</span>`;
  const ph = phase ? `<span class="tb-phase">${esc(phase)}</span>` : "";
  const states = partStates(k);
  const look = kaijuDef(k.id, k.variant).look;
  const figs = `<span class="tb-figs" aria-hidden="true">${portrait(look, { parts: states })}${silhouette(look, { parts: states })}</span>`;
  return `${figs}<div class="tb-facts">${turn}${ap}${ph}${goal}</div>`
    + `<div class="tb-buttons"><button type="button" class="btn icon" data-ui="theme" title="Theme: ${themeName}. Light, dark, or as the system says." aria-label="Theme: ${themeName}">${ICON_THEME}<span class="tb-label">${themeName}</span></button>`
    + `<button type="button" class="btn icon" data-ui="settings" title="Settings" aria-label="Settings">${ICON_GEAR}</button></div>`;
}

function bar(label, value, max, cls, text = `${value}/${max}`) {
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return `<div class="bar ${cls}"><span class="bar-label">${label}</span><span class="bar-track"><span class="bar-fill" style="width:${(frac * 100).toFixed(1)}%"></span></span><span class="bar-num">${text}</span></div>`;
}

function swatch(state) {
  return `<svg class="swatch" viewBox="0 0 14 14" aria-hidden="true"><rect x="0.75" y="0.75" width="12.5" height="12.5" fill="${STATE_FILL[state]}" stroke-width="1.2" style="stroke: var(--ink)"/></svg>`;
}

const STATE_WORD = { intact: "intact", hurt: "hurt", bad: "badly hurt", crippled: "crippled" };

export function status(state) {
  const k = state.kaiju;
  const def = kaijuDef(k.id, k.variant);
  const states = partStates(k);
  const battery = def.energy.rule === "battery";
  let bars = bar("AP", k.ap, k.apMax, "b-ap");
  bars += bar(battery ? "Battery" : "Energy", k.energy, k.energyMax, battery ? "b-battery" : "b-energy");
  if (k.hunger !== null) bars += bar("Hunger", k.hunger, k.hungerMax, k.hunger >= 0.7 * k.hungerMax ? "b-hunger high" : "b-hunger");
  const facts = [`Armor ${k.armor}`];
  if (k.lingering) facts.push(`Lingering −${k.lingering} AP`);
  if (k.used.roar) facts.push("Roared");
  if (def.attacks.some((a) => a.effects.oncePerMission) && k.used.finish) facts.push("Finish spent");
  const parts = PART_SLOTS.map((p) => {
    const part = k.parts[p];
    const s = states[p];
    return `<li class="part-row s-${s}" title="${esc(def.parts[p].name)}: ${STATE_WORD[s]}">${swatch(s)}<span class="pr-name">${esc(def.parts[p].name)}</span><span class="pr-hp">${part.hp}/${part.max}</span></li>`;
  }).join("");
  let rival = "";
  const r = state.rival;
  if (r) {
    const rdef = kaijuDef(r.id, r.variant);
    const rs = partStates(r);
    const gone = r.withdrawn ? "withdrawn" : r.parts.body.hp <= 0 ? "down" : "";
    const worst = PART_SLOTS.filter((p) => rs[p] !== "intact").map((p) => `${rdef.parts[p].name.toLowerCase()} ${STATE_WORD[rs[p]]}`);
    rival = `<div class="rival-row"><div class="rival-sil">${silhouette(rdef.look, { parts: rs })}</div><div class="rival-text">`
      + `<div class="rival-name">Rival: ${esc(rdef.name)}${gone ? ` <i>(${gone})</i>` : ""}</div>`
      + bar(rdef.parts.body.name, r.parts.body.hp, r.parts.body.max, "b-rival")
      + `<div class="rival-parts">${worst.length ? esc(worst.join(", ")) : "Unmarked."}</div></div></div>`;
  }
  return `<div class="status-main"><div class="status-figs"><div class="st-portrait">${portrait(def.look, { parts: states })}</div>`
    + `<div class="st-sil">${silhouette(def.look, { parts: states })}</div></div>`
    + `<div class="status-vitals"><div class="st-name">${esc(def.name)}<span class="st-epithet">${esc(def.epithet)}</span></div>${bars}`
    + `<div class="st-facts">${facts.map(esc).join(" · ")}</div></div></div>`
    + `<div class="status-more"><ul class="parts">${parts}</ul>${rival}</div>`;
}

export function inspect(text) {
  return `<span class="inspect-label">Inspect</span> ${text ? esc(text) : "Tap a hex to see what is there."}`;
}

function cost(a) {
  const bits = [];
  if (a.ap === null) bits.push("AP by terrain");
  else if (a.ap === 0) bits.push("free");
  else bits.push(`${a.ap} AP`);
  if (a.energy) bits.push(`${a.energy} energy`);
  return bits.join(" · ");
}

export function actions(list, { mode, busy, undo }) {
  const keys = actionKeys(list);
  const active = (a) => (mode === a.id || (mode === "attack-" + a.id));
  let out = list.map((a) => {
    const enabled = a.enabled && !busy;
    const sub = a.enabled ? cost(a) : a.why;
    const title = a.enabled ? `${a.name}: ${cost(a)}` : `${a.name}: ${a.why}`;
    return `<button type="button" class="btn act${active(a) ? " on" : ""}${a.id === "end" ? " act-end" : ""}" data-action="${a.id}"${enabled ? "" : " disabled"} title="${esc(title)}" aria-keyshortcuts="${keys[a.id]}">`
      + `<span class="act-top"><kbd>${keys[a.id]}</kbd><span class="act-name">${esc(a.name)}</span></span><span class="act-sub">${esc(sub)}</span></button>`;
  }).join("");
  if (undo) {
    out += `<button type="button" class="btn act act-undo" data-action="undo"${busy ? " disabled" : ""} title="Take back the last move" aria-keyshortcuts="U">`
      + `<span class="act-top"><kbd>U</kbd><span class="act-name">Undo move</span></span><span class="act-sub">no dice rolled since</span></button>`;
  }
  return out;
}

// The class a log line gets: whose voice it is.
export function logClass(e, playerId) {
  if (e.k === "radio") return "radio";
  if (e.k === "phase") return "phase";
  if (e.k === "refuse") return "refuse";
  if (e.k === "over") return "over";
  if (e.k === "caption") return "caption";
  if (e.actor === "kaiju" || (e.attacker && e.attacker.side === "kaiju")) return "own";
  if (e.actor === "rival" || (e.attacker && e.attacker.side === "rival")) return "rival";
  if (e.k === "destroyed" && e.what === "kaiju" && e.type === playerId) return "own";
  if (e.attacker && e.attacker.side === "unit") return "enemy";
  return "";
}

export function hint({ text, confirm, cancel, extra }) {
  let out = `<p class="hint-text">${esc(text)}</p><div class="hint-buttons">`;
  if (extra) out += extra;
  if (confirm) out += `<button type="button" class="btn primary" data-ui="confirm">${esc(confirm)} <kbd>Enter</kbd></button>`;
  if (cancel) out += `<button type="button" class="btn" data-ui="cancel">${esc(cancel)} <kbd>Esc</kbd></button>`;
  return out + `</div>`;
}

function after(t) {
  if (t.kind === "kaiju") return "a part, by roll";
  const lo = Math.max(0, t.hp - t.damage[1]);
  const hi = Math.max(0, t.hp - t.damage[0]);
  if (hi === 0) return `${t.hp} → falls`;
  return lo === hi ? `${t.hp} → ${lo}` : `${t.hp} → ${lo}–${hi}`;
}

// The chance that 2d6 + pressure beats a morale, in whole percent.
function breakChance(pressure, morale) {
  let n = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b + pressure > morale) n++;
  return Math.round((100 * n) / 36);
}

function range(d) {
  return d[0] === d[1] ? `${d[0]}` : `${d[0]}–${d[1]}`;
}

export function forecastSheet(fc, { name, note, panic = 0 }) {
  const costs = [`${fc.apCost} AP`];
  if (fc.energyCost) costs.push(`${fc.energyCost} energy`);
  const row = (t) => {
    if (panic && t.damage[1] === 0 && t.kind === "unit") {
      const morale = UNITS[t.type].morale;
      const odds = morale >= 99 ? "never breaks" : `breaks ${breakChance(panic, morale)}%`;
      return `<tr><td>${esc(t.name)}</td><td class="num">${t.hitChance}%</td><td class="num">panic +${panic}</td><td class="num">${odds}</td></tr>`;
    }
    return `<tr><td>${esc(t.name)}</td><td class="num">${t.hitChance}%</td><td class="num">${range(t.damage)}</td><td class="num">${after(t)}</td></tr>`;
  };
  const rows = fc.targets.map(row).join("");
  const table = fc.targets.length
    ? `<table class="fc-table"><thead><tr><th>Target</th><th>Hit</th><th>Damage</th><th>HP after</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<p class="fc-none">Nothing in the pattern to strike.</p>`;
  let back = "Nothing can strike you next phase from here.";
  if (fc.returnFire.length) {
    // Units of one type can differ: each one's rear bonus is its own.
    const groups = new Map();
    for (const r of fc.returnFire) {
      const key = `${r.name}|${r.hitChance}|${range(r.damage)}`;
      const g = groups.get(key) || { n: 0, name: r.name, hit: r.hitChance, dmg: r.damage };
      g.n += 1;
      groups.set(key, g);
    }
    const most = fc.returnFire.reduce((sum, r) => sum + r.damage[1], 0);
    const likely = Math.round(fc.returnFire.reduce((sum, r) => sum + (r.hitChance / 100) * ((r.damage[0] + r.damage[1]) / 2), 0));
    back = "Return fire next phase: " + [...groups.values()].map((g) => `${g.n > 1 ? g.n + " × " : ""}${g.name} (${g.hit}%, ${range(g.dmg)})`).join(", ") + `. About ${likely} damage, at most ${most}.`;
  }
  return `<h2 class="tile-title">Forecast</h2><div class="sheet-body"><div class="fc-head"><b>${esc(name)}</b><span class="fc-cost">${costs.join(" · ")}</span></div>`
    + (note ? `<p class="fc-note">${esc(note)}</p>` : "") + table + `<p class="fc-return">${esc(back)}</p></div>`
    + `<div class="sheet-buttons"><button type="button" class="btn primary" data-ui="confirm"${fc.targets.length ? "" : " disabled"}>Confirm <kbd>Enter</kbd></button>`
    + `<button type="button" class="btn" data-ui="cancel">Cancel <kbd>Esc</kbd></button></div>`;
}
