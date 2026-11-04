// Boot and the three screens: setup, play and end. The game changes only through rules.step;
// the page plays the events it returns in order (the board patched from their data, cutaways
// for blows that involve the monster), then settles on the state step returned.

import * as R from "../rules.js";
import * as H from "../hex.js";
import { say, review } from "../voice.js";
import { VERSION } from "../version.js";
import { MISSIONS, TARGETS, OBJECTIVES, resolveMission } from "../data/missions.js";
import { KAIJU } from "../data/kaiju.js";
import { kaijuDef, LOOKS } from "../data/variants.js";
import { MUTATIONS, BUDGET } from "../data/mutations.js";
import { UNITS } from "../data/units.js";
import { STRUCTURES } from "../data/terrain.js";
import { DEFS } from "../art/defs.js";
import { portrait, silhouette } from "../art/kaiju.js";
import { createBoard } from "./board.js";
import * as P from "./panels.js";
import { planScenes, buildScene, playScene } from "./cutaway.js";
import * as S from "./settings.js";

const $ = (id) => document.getElementById(id);
const esc = P.esc;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomSeed = () => String(1 + Math.floor(Math.random() * 99999));
const KAIJU_IDS = Object.keys(KAIJU);
const MISSION_IDS = Object.keys(MISSIONS);
// The two-column play layout; style.css uses the same query.
const WIDE = "(min-width: 900px), (orientation: landscape) and (min-width: 640px)";
const stacked = () => !matchMedia(WIDE).matches;

const PAPERS = { fortress: "The Kessel Range Clarion", swathe: "The Port Halloran Courier", coast: "The Gull Point Gazette", rampage: "The Port Halloran Courier" };
const GRADE_LINE = {
  "total victory": "Total victory",
  victory: "Victory",
  draw: "Draw",
  defeat: "Defeat",
  rampage: "Last call",
};
const OUTCOME_LINE = {
  goal: "The objective fell.",
  time: "The clock ran out with the objective standing.",
  withdrawn: "The monster left the map.",
  fallen: "The monster fell.",
};
const DEATH_LINE = {
  cuts: "It fell to a thousand cuts.",
  sudden: "It died the sudden death.",
  lingering: "It died the lingering death.",
};
const OBJECTIVE_IDS = Object.keys(OBJECTIVES);
const ENERGY_RULE = {
  eat: "Energy from eating.",
  water: "Energy from standing in water.",
  panic: "Energy from every unit that breaks.",
  battery: "A battery that drains each turn; it charges beside power.",
};
const PASSIVE = {
  reactorBelly: "Reactor belly: power blasts feed it.",
  stoneBody: "Stone body: heals in water.",
  regen: "Regenerates.",
  eldritch: "Eldritch: harder to hit.",
  noHunger: "No hunger.",
  thrusters: "Thrusters: +1 AP while they work.",
};
const TARGET_TEXT = {
  plant: ["Power plant", "Explodes when crushed or eaten. Pylons beside it."],
  lab: ["Research lab", "Solid. Must be battered down. Populated."],
  leyline: ["Ley-line nexus", "Standing stones in a park. Solid, and old."],
};

// ---------- setup ----------

// variant is the chosen look's id, or null for the kaiju's own. touched is true once the player
// has set a mutation by hand: from then on a look's preset build no longer replaces their choice.
const pick = { kaiju: "radiosaur", variant: null, mutations: [], touched: false, mission: "fortress", target: "plant", rival: "", objective: "balanced", seed: randomSeed() };

// The def of the monster the setup screen shows for a kaiju id: the chosen look for the chosen
// kaiju, the base look for the others.
const defFor = (id) => kaijuDef(id, id === pick.kaiju ? pick.variant : null);

// A preset build, cut down to what the kaiju may take and what the budget allows.
function presetFor(def) {
  const out = [];
  for (const m of def.preset || []) {
    if (def.forbid.includes(m) || spent([...out, m]) > BUDGET) continue;
    out.push(m);
  }
  return out;
}

function chooseKaiju(id) {
  if (id === pick.kaiju) return;
  pick.kaiju = id;
  pick.variant = null;
  pick.mutations = pick.touched ? pick.mutations.filter((m) => !defFor(id).forbid.includes(m)) : [];
}

function chooseLook(lookId) {
  if (!Object.hasOwn(LOOKS, pick.kaiju) || !LOOKS[pick.kaiju].includes(lookId)) return;
  pick.variant = lookId === pick.kaiju ? null : lookId;
  const def = defFor(pick.kaiju);
  pick.mutations = pick.touched ? pick.mutations.filter((m) => !def.forbid.includes(m)) : presetFor(def);
}

function spent(muts) {
  return muts.reduce((n, m) => n + MUTATIONS[m].cost, 0);
}

function statsFor(id, muts) {
  const def = defFor(id);
  const s = { ap: def.ap, armor: def.armor, body: def.parts.body.hp, energy: def.energy.max, range: 0, roar: 3 };
  if (def.passives.includes("thrusters")) s.ap += 1;
  for (const m of muts) {
    const a = MUTATIONS[m].apply;
    s.ap += a.ap || 0;
    s.armor += a.armor || 0;
    s.body += a.body || 0;
    s.energy += a.energyMax || 0;
    s.range += a.range || 0;
  }
  s.body += BUDGET - spent(muts);
  return s;
}

function patternText(a, extra) {
  const range = a.range + ((a.kind === "ranged" || a.kind === "special") && a.range > 1 ? extra : 0);
  if (a.pattern === "single") return range === 1 ? "adjacent" : `range ${range}`;
  if (a.pattern === "line") return `line of ${range}`;
  if (a.pattern === "cone") return `cone of ${range}`;
  if (a.pattern === "rear") return "rear arc";
  return `step ${range}`;
}

function monsterCard(id) {
  const def = defFor(id);
  const chosen = pick.kaiju === id;
  const base = statsFor(id, []);
  const s = chosen ? statsFor(id, pick.mutations) : base;
  const up = (key) => (s[key] > base[key] ? " up" : "");
  const stat = (label, value, key) => `<div class="stat${key ? up(key) : ""}"><dt>${label}</dt><dd>${value}</dd></div>`;
  const attacks = def.attacks.map((a) => {
    const dmg = a.damage[1] === 0 ? "no damage" : `${a.damage[0]}–${a.damage[1]}`;
    const cost = `${a.ap} AP${a.energy ? `, ${a.energy} energy` : ""}`;
    return `<li><b>${esc(a.name)}</b> <span>${cost} · ${patternText(a, s.range)} · ${dmg}</span></li>`;
  }).join("");
  const passives = def.passives.map((p) => PASSIVE[p]).join(" ");
  return `<div class="card monster-card${chosen ? " chosen" : ""}" role="radio" tabindex="${chosen ? 0 : -1}" aria-checked="${chosen}" data-kaiju="${id}">`
    + `<div class="mc-art"><div class="mc-portrait">${portrait(def.look)}</div><div class="mc-sil">${silhouette(def.look)}</div></div>`
    + `<div class="mc-body"><div class="card-name">${esc(def.name)}</div><div class="card-sub">${esc(def.epithet)}</div>`
    + `<dl class="stats">${stat("AP", s.ap, "ap")}${stat("Armor", s.armor, "armor")}${stat(esc(def.parts.body.name), s.body, "body")}${stat("Energy", s.energy, "energy")}${stat("Hunger", def.hunger ? def.hunger.max : "none")}</dl>`
    + `<ul class="attacks">${attacks}</ul>`
    + `<p class="card-note">${esc(ENERGY_RULE[def.energy.rule])} ${esc(passives)}</p></div></div>`;
}

// The row of looks under the monster cards: a button for each look of the chosen kaiju, a small
// portrait and its name, then the chosen look's description.
function looksHtml() {
  const list = LOOKS[pick.kaiju];
  const def = defFor(pick.kaiju);
  const base = kaijuDef(pick.kaiju);
  if (!list || list.length < 2) return "";
  const buttons = list.map((lookId) => {
    const d = kaijuDef(pick.kaiju, lookId === pick.kaiju ? null : lookId);
    const on = lookId === def.look;
    return `<button type="button" class="look${on ? " on" : ""}" data-look="${lookId}" aria-pressed="${on}" tabindex="${on ? 0 : -1}" title="${esc(d.name)}, ${esc(d.epithet)}">`
      + `<span class="look-art" aria-hidden="true">${portrait(lookId)}</span><span class="look-name">${esc(d.name)}</span></button>`;
  }).join("");
  const preset = def.preset ? `<p class="look-preset">Starts with ${esc(presetFor(def).map((m) => MUTATIONS[m].name).join(" and ") || "no mutations")}. Change it below.</p>` : "";
  return `<p class="look-head" id="look-head">Looks of ${esc(base.name)}</p>`
    + `<div class="looks-row" role="group" aria-labelledby="look-head">${buttons}</div>`
    + `<div class="look-text"><b>${esc(def.name)}</b>, <i>${esc(def.epithet)}</i>. ${esc(def.blurb)}</div>${preset}`;
}

function mutationRows() {
  const def = defFor(pick.kaiju);
  const left = BUDGET - spent(pick.mutations);
  return Object.values(MUTATIONS).map((m) => {
    const on = pick.mutations.includes(m.id);
    let why = "";
    if (def.forbid.includes(m.id)) why = def.passives.includes(m.apply.passive) ? `${def.name} has it already.` : `${def.name} cannot take it.`;
    else if (!on && m.cost > left) why = "Not enough points left.";
    const pips = "●".repeat(m.cost);
    return `<label class="mut${on ? " on" : ""}${why ? " off" : ""}"><input type="checkbox" name="mutation" value="${m.id}"${on ? " checked" : ""}${why ? " disabled" : ""}>`
      + `<span class="mut-name">${esc(m.name)}</span><span class="mut-cost" aria-label="cost ${m.cost}">${pips}</span>`
      + `<span class="mut-text">${esc(m.text)}${why ? ` <em>${esc(why)}</em>` : ""}</span></label>`;
  }).join("");
}

function opposition(mission) {
  const count = (list) => {
    const n = {};
    for (const u of list) n[u.type] = (n[u.type] || 0) + 1;
    return Object.entries(n).map(([t, c]) => `${c} ${UNITS[t].name.toLowerCase()}${c > 1 && !/s$|guard|artillery/i.test(UNITS[t].name) ? "s" : ""}`);
  };
  const now = count(mission.units).join(", ");
  const later = mission.reinforcements.map((r) => `${UNITS[r.type].name.toLowerCase()} on turn ${r.turn}`).join(", ");
  const waves = mission.waves ? " Then waves from the edges, larger every third turn." : "";
  return `${now}.${later ? ` Later: ${later}.` : ""}${waves}`;
}

function missionCard(id) {
  const m = MISSIONS[id];
  const chosen = pick.mission === id;
  let resolved;
  try {
    resolved = resolveMission(id, { seed: pick.seed || "0", target: pick.target });
  } catch (e) {
    resolved = { ...m, units: m.units || [], reinforcements: m.reinforcements || [] };
  }
  return `<div class="card mission-card${chosen ? " chosen" : ""}" role="radio" tabindex="${chosen ? 0 : -1}" aria-checked="${chosen}" data-mission="${id}">`
    + `<div class="card-name">${esc(m.name)}</div><div class="card-sub">${esc(m.tagline)}</div>`
    + `<div class="briefing">${m.briefing.map((l) => `<p>${esc(l)}</p>`).join("")}</div>`
    + `<p class="card-goal"><b>Goal.</b> ${esc(m.goal)}</p>`
    + `<p class="card-note"><b>${m.turns ? `${m.turns} turns.` : "No turn limit."}</b> Opposition: ${esc(opposition(resolved))}</p></div>`;
}

function questionHtml() {
  const m = MISSIONS[pick.mission];
  if (m.choose === "target") {
    const rows = TARGETS.map((t) => `<label class="choice${pick.target === t ? " on" : ""}"><input type="radio" name="target" value="${t}"${pick.target === t ? " checked" : ""}>`
      + `<span class="choice-name">${TARGET_TEXT[t][0]}</span><span class="choice-text">${TARGET_TEXT[t][1]}</span></label>`).join("");
    return `<fieldset class="question"><legend>Which target does it go for?</legend>${rows}</fieldset>`;
  }
  if (m.choose === "rival") {
    const others = KAIJU_IDS.filter((id) => id !== pick.kaiju);
    if (pick.rival === pick.kaiju) pick.rival = "";
    const opt = (value, name, text) => `<label class="choice${pick.rival === value ? " on" : ""}"><input type="radio" name="rival" value="${value}"${pick.rival === value ? " checked" : ""}>`
      + `<span class="choice-name">${esc(name)}</span><span class="choice-text">${esc(text)}</span></label>`;
    return `<fieldset class="question"><legend>Which monster waits on the coast?</legend>${opt("", "Leave it to chance", "One of the other three, by the seed.")}`
      + others.map((id) => opt(id, kaijuDef(id).name, kaijuDef(id).epithet)).join("") + `</fieldset>`;
  }
  if (m.choose === "objective") {
    const rows = OBJECTIVE_IDS.map((id) => {
      const o = OBJECTIVES[id];
      const on = pick.objective === id;
      return `<label class="choice${on ? " on" : ""}"><input type="radio" name="objective" value="${id}"${on ? " checked" : ""}>`
        + `<span class="choice-name">${esc(o.name)}</span><span class="choice-text">${esc(o.text)}</span></label>`;
    }).join("");
    return `<fieldset class="question"><legend>What counts tonight?</legend>${rows}</fieldset>`;
  }
  return `<p class="question-none">The fortress asks no questions. The bunker is behind the wall.</p>`;
}

function renderSetup() {
  const focus = document.activeElement;
  const restore = focus && (focus.dataset.kaiju ? `[data-kaiju="${focus.dataset.kaiju}"]` : focus.dataset.look ? `[data-look="${focus.dataset.look}"]` : focus.dataset.mission ? `[data-mission="${focus.dataset.mission}"]`
    : focus.name ? `input[name="${focus.name}"][value="${focus.value}"]` : null);
  $("monsters").innerHTML = KAIJU_IDS.map(monsterCard).join("");
  $("looks").innerHTML = looksHtml();
  const chosen = defFor(pick.kaiju);
  const left = BUDGET - spent(pick.mutations);
  $("points").innerHTML = `<b>${left}</b> of ${BUDGET} points left${left ? ` <span class="unspent">unspent: +${left} ${esc(chosen.parts.body.name.toLowerCase())}</span>` : ""}`;
  $("mutations").innerHTML = mutationRows();
  $("missions").innerHTML = MISSION_IDS.map(missionCard).join("");
  $("question").innerHTML = questionHtml();
  if (document.activeElement !== $("seed")) $("seed").value = pick.seed;
  const muts = pick.mutations.map((m) => MUTATIONS[m].name).join(", ") || "no mutations";
  const rules = MISSIONS[pick.mission].choose === "objective" ? `: ${OBJECTIVES[pick.objective].name}` : "";
  const lookName = chosen.variant ? `${chosen.name} (${kaijuDef(pick.kaiju).name})` : chosen.name;
  $("summary").textContent = `${lookName}, ${muts}. ${MISSIONS[pick.mission].name}${rules}. Seed ${pick.seed || "0"}.`;
  if (restore) {
    const el = document.querySelector(restore);
    if (el) el.focus();
  }
}

function setupEvents() {
  const root = $("setup");
  root.addEventListener("click", (e) => {
    const look = e.target.closest("[data-look]");
    if (look) {
      chooseLook(look.dataset.look);
      return renderSetup();
    }
    const card = e.target.closest("[data-kaiju], [data-mission]");
    if (card && card.dataset.kaiju) {
      if (Object.hasOwn(KAIJU, card.dataset.kaiju)) chooseKaiju(card.dataset.kaiju);
      renderSetup();
    } else if (card && card.dataset.mission) {
      pick.mission = card.dataset.mission;
      renderSetup();
    }
  });
  root.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=radio]")) {
      e.preventDefault();
      e.target.click();
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step && e.target.matches(".look")) {
      e.preventDefault();
      const group = [...e.target.parentElement.querySelectorAll(".look")];
      const next = group[(group.indexOf(e.target) + step + group.length) % group.length];
      next.focus();
      next.click();
    } else if (step && e.target.matches(".card[role=radio]")) {
      e.preventDefault();
      const group = [...e.target.parentElement.querySelectorAll(".card[role=radio]")];
      const next = group[(group.indexOf(e.target) + step + group.length) % group.length];
      next.focus();
      next.click();
    }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "mutation") {
      pick.touched = true;
      pick.mutations = t.checked ? [...pick.mutations, t.value] : pick.mutations.filter((m) => m !== t.value);
      if (spent(pick.mutations) > BUDGET) pick.mutations = pick.mutations.filter((m) => m !== t.value);
    } else if (t.name === "target") pick.target = t.value;
    else if (t.name === "rival") pick.rival = t.value;
    else if (t.name === "objective") pick.objective = t.value;
    else return;
    renderSetup();
  });
  $("seed").addEventListener("input", (e) => {
    pick.seed = e.target.value.trim();
    $("summary").textContent = $("summary").textContent.replace(/Seed .*$/, `Seed ${pick.seed || "0"}.`);
  });
  $("seed").addEventListener("change", renderSetup);
  $("seed").addEventListener("keydown", (e) => {
    if (e.key === "Enter") deploy();
  });
  $("reseed").addEventListener("click", () => {
    pick.seed = randomSeed();
    $("seed").value = pick.seed;
    renderSetup();
  });
  $("deploy").addEventListener("click", () => deploy());
}

// ---------- play ----------

const game = {
  pick: null,
  setup: null,
  state: null,
  view: null,
  mode: { kind: "move" },
  preview: null,
  selected: null,
  busy: false,
  busyText: "",
  phase: "",
  undo: null,
  events: [],
  list: [],
  keys: {},
  lastAction: "move",
  pendingFocus: null,
};
let board;

function show(screen) {
  for (const id of ["setup", "play", "end"]) $(id).hidden = id !== screen;
  document.body.dataset.screen = screen;
  window.scrollTo(0, 0);
}

function deploy(p = pick) {
  const seed = (p.seed || "").trim() || randomSeed();
  const m = MISSIONS[p.mission];
  const target = m.choose === "target" ? p.target : null;
  let setup;
  let state;
  try {
    const mission = resolveMission(p.mission, { seed, target });
    setup = { kaiju: p.kaiju, mutations: [...p.mutations], mission, target, seed };
    if (p.variant) setup.variant = p.variant;
    if (m.choose === "rival" && p.rival) setup.rival = p.rival;
    if (m.choose === "objective") setup.objective = p.objective;
    state = R.create(setup);
  } catch (err) {
    $("summary").textContent = `That will not deploy: ${err.message}`;
    return;
  }
  Object.assign(game, {
    pick: { ...p, mutations: [...p.mutations], seed },
    setup,
    state,
    view: null,
    mode: { kind: "move" },
    preview: null,
    selected: null,
    busy: false,
    phase: "",
    undo: null,
    events: [],
  });
  $("log").innerHTML = "";
  for (const line of setup.mission.briefing) addLog({ k: "caption", text: line });
  addLog({ k: "caption", text: `Goal: ${setup.mission.goal}` });
  if (state.objective.kind === "none") addLog({ k: "caption", text: `${state.objective.name}. ${state.objective.text}` });
  if (state.rival) addLog({ k: "caption", text: `The rival is ${kaijuDef(state.rival.id, state.rival.variant).name}, ${kaijuDef(state.rival.id, state.rival.variant).epithet}.` });
  addLog({ k: "phase", text: say("phase", { phase: "kaiju", turn: 1 }) });
  board.reset();
  show("play");
  render();
}

function view() {
  return game.view || game.state;
}

function candidates() {
  const s = game.state;
  const m = game.mode;
  if (s.result) return [];
  if (m.kind === "move") return Object.keys(R.reach(s));
  if (m.kind === "attack" || m.kind === "teleport") return R.attackTargets(s, m.attack);
  if (m.kind === "stomp") return R.stompTargets(s);
  if (m.kind === "eat") return R.eatTargets(s);
  return [];
}

function marks() {
  const s = game.state;
  const m = game.mode;
  const p = game.preview;
  const out = { selected: game.selected };
  if (s.result) return out;
  if (m.kind === "face") return { ...out, arrows: true };
  if (m.kind === "withdraw") return { ...out, tag: "Exit", tagAt: s.kaiju.at };
  out.lit = candidates();
  out.litKind = m.kind === "move" ? "move" : m.kind === "teleport" ? "teleport" : "target";
  if (!p) return out;
  if (m.kind === "move") {
    const r = R.reach(s)[p];
    if (r) Object.assign(out, { path: r.path, tag: `${r.cost} AP`, tagAt: p });
  } else if (m.kind === "attack") out.pattern = R.affected(s, m.attack, p);
  else if (m.kind === "teleport") Object.assign(out, { pattern: [p], tag: `${R.attackOf(s, "kaiju", m.attack).ap} AP`, tagAt: p });
  else out.pattern = [p];
  return out;
}

function modeId() {
  const m = game.mode;
  if (m.kind === "attack" || m.kind === "teleport") return m.attack;
  return m.kind;
}

function canUndo() {
  return !!game.undo && !game.state.result && game.undo.state.rng === game.state.rng;
}

// render() replaces the panels' markup. A focused button that goes with it is found again by
// its data-action or data-ui, now or once it is enabled again after the defense phase.
function focusKey(el) {
  if (!el || !el.dataset) return null;
  if (el.dataset.action) return `[data-action="${el.dataset.action}"]`;
  if (el.dataset.ui) return `[data-ui="${el.dataset.ui}"]`;
  return null;
}

function restoreFocus() {
  if (!game.pendingFocus) return;
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) {
    game.pendingFocus = null;
    return;
  }
  if (game.busy) return;
  const wanted = [game.pendingFocus, `[data-action="${game.lastAction}"]`, '[data-action="move"]', '[data-action="end"]'];
  for (const sel of wanted) {
    const el = [...$("play").querySelectorAll(sel)].find((x) => !x.disabled && x.offsetParent !== null);
    if (el) {
      el.focus({ preventScroll: true });
      game.pendingFocus = null;
      return;
    }
  }
}

function render() {
  const had = document.activeElement;
  const key = focusKey(had);
  const st = view();
  const live = !game.busy && !game.state.result;
  board.render(st, live ? marks() : { selected: game.selected });
  $("topbar").innerHTML = P.topBar(st, { phase: game.phase, themeName: S.settings.theme });
  $("status").innerHTML = P.status(st);
  $("inspect").innerHTML = P.inspect(game.selected ? R.describeHex(st, game.selected).text : "");
  game.list = R.actions(game.state);
  game.keys = P.actionKeys(game.list);
  $("actions").innerHTML = P.actions(game.list, { mode: game.busy ? "" : modeId(), busy: game.busy, undo: !game.busy && canUndo() });
  renderHint();
  renderSheet();
  if (key && !had.isConnected) game.pendingFocus = key;
  restoreFocus();
}

function targetName(key) {
  const d = R.describeHex(game.state, key);
  if (d.kaiju) return d.kaiju.name;
  if (d.units.length) return `the ${d.units[0].name.toLowerCase()}`;
  if (d.structure) return `the ${d.structure.name.toLowerCase()}`;
  return d.terrain ? d.terrain.name.toLowerCase() : "that";
}

function renderHint() {
  const el = $("hint");
  const s = game.state;
  const m = game.mode;
  const p = game.preview;
  if (game.busy) {
    el.innerHTML = P.hint({ text: game.busyText || "The defense forces take their turn." });
    return;
  }
  if (s.result) {
    const r = s.result;
    const text = r.grade === "rampage" ? `Last call. ${r.stars} ${r.stars === 1 ? "star" : "stars"}.` : `The mission is over. ${GRADE_LINE[r.grade]}.`;
    el.innerHTML = P.hint({ text, confirm: "Read the papers" });
    return;
  }
  let h = { text: "" };
  if (m.kind === "move") {
    const r = p && R.reach(s)[p];
    if (r) h = { text: `Walk ${r.path.length} ${r.path.length === 1 ? "hex" : "hexes"} for ${r.cost} AP. Tap again to go.`, confirm: "Go", cancel: "Cancel" };
    else if (!candidates().length) h = { text: s.kaiju.ap > 0 ? "Nowhere to walk from here." : "No AP left. End the turn when ready." };
    else h = { text: "Tap a lit hex to see the way and the cost." };
  } else if (m.kind === "face") {
    h = { text: "Face: tap an arrow or a neighbouring hex, or press 1 to 6. Turning is free.", cancel: "Done" };
  } else if (m.kind === "teleport") {
    const a = R.attackOf(s, "kaiju", m.attack);
    h = p
      ? { text: `${a.name} to here: ${a.ap} AP, ${a.energy} energy.`, confirm: "Step through", cancel: "Cancel" }
      : { text: `${a.name}: tap a lit hex within ${a.range}.`, cancel: "Cancel" };
  } else if (m.kind === "attack") {
    const a = R.attackOf(s, "kaiju", m.attack);
    h = { text: p ? `${a.name}: read the forecast, then confirm.` : `${a.name}: tap a target outlined in red.`, cancel: "Cancel" };
  } else if (m.kind === "stomp") {
    h = { text: p ? "Stomp: read the forecast, then confirm." : "Stomp: tap an adjacent target.", cancel: "Cancel" };
  } else if (m.kind === "eat") {
    h = p ? { text: `Eat ${targetName(p)}: 1 AP.`, confirm: "Eat", cancel: "Cancel" } : { text: "Eat: tap something adjacent and edible.", cancel: "Cancel" };
  } else if (m.kind === "withdraw") {
    h = { text: "Leave the map here? The mission ends, and the goal with it.", confirm: "Withdraw", cancel: "Stay" };
  }
  el.innerHTML = P.hint(h);
}

function sheetWanted() {
  const m = game.mode;
  return !game.busy && !game.state.result && !!game.preview && (m.kind === "attack" || m.kind === "stomp");
}

function renderSheet() {
  const sheet = $("sheet");
  if (!sheetWanted()) {
    sheet.hidden = true;
    sheet.innerHTML = "";
    document.body.classList.remove("sheet-open");
    return;
  }
  const s = game.state;
  const m = game.mode;
  const id = m.kind === "stomp" ? "stomp" : m.attack;
  const fc = R.forecast(s, id, game.preview);
  let name = "Stomp";
  let note = "";
  let panic = 0;
  if (m.kind === "attack") {
    const a = R.attackOf(s, "kaiju", m.attack);
    name = a.name;
    panic = a.effects.panic || 0;
    if (a.pattern === "line" || a.pattern === "cone") note = "It strikes everything in the hatched pattern, aimed the way the monster faces. Turn first to aim elsewhere.";
    else if (a.pattern === "rear") note = "It strikes everything in the hatched hexes behind the monster.";
  }
  const opening = sheet.hidden;
  const focused = sheet.contains(document.activeElement) ? focusKey(document.activeElement) : null;
  sheet.innerHTML = P.forecastSheet(fc, { name, note, panic });
  sheet.hidden = false;
  document.body.classList.add("sheet-open");
  if (opening) {
    bringMapIntoView();
    const ok = sheet.querySelector('[data-ui="confirm"]:not(:disabled)') || sheet.querySelector('[data-ui="cancel"]');
    if (ok) ok.focus({ preventScroll: true });
  } else if (focused) {
    const el = sheet.querySelector(focused);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }
}

// On a phone the map sits above the panels; when the player picks an action, show the map.
function bringMapIntoView() {
  if (!stacked()) return;
  const tile = $("map-tile");
  const bar = $("topbar").getBoundingClientRect().height;
  const r = tile.getBoundingClientRect();
  if (r.top >= bar - 1 && r.bottom <= window.innerHeight) return;
  tile.style.scrollMarginTop = `${Math.ceil(bar)}px`;
  tile.scrollIntoView({ block: "start", behavior: S.reducedMotion() ? "auto" : "smooth" });
}

function setMode(mode) {
  game.mode = mode;
  game.preview = null;
  if (mode.kind !== "move") {
    const c = candidates();
    const a = mode.attack ? R.attackOf(game.state, "kaiju", mode.attack) : null;
    if (a && ["line", "cone", "rear"].includes(a.pattern) && c.length) game.preview = c[0];
    else if ((mode.kind === "attack" || mode.kind === "stomp" || mode.kind === "eat") && c.length === 1) game.preview = c[0];
  }
  render();
}

function backToMove() {
  setMode({ kind: "move" });
}

function onAction(id) {
  if (game.busy) return;
  if (id === "undo") return undo();
  const a = game.list.find((x) => x.id === id);
  if (!a || !a.enabled) return;
  if (modeId() === id && id !== "move" && id !== "roar" && id !== "end") return backToMove();
  game.lastAction = id;
  if (id !== "move" && id !== "end" && id !== "roar") bringMapIntoView();
  if (id === "move") backToMove();
  else if (id === "face") setMode({ kind: "face" });
  else if (a.kind === "attack") {
    const att = R.attackOf(game.state, "kaiju", id);
    setMode({ kind: att.pattern === "teleport" ? "teleport" : "attack", attack: id });
  } else if (id === "stomp" || id === "eat" || id === "withdraw") setMode({ kind: id });
  else if (id === "roar") execute({ t: "roar" });
  else if (id === "end") execute({ t: "end" });
}

function onHex(key) {
  if (game.busy) return;
  game.selected = key;
  const s = game.state;
  const m = game.mode;
  if (!s.result) {
    if (m.kind === "face") {
      if (H.distance(s.kaiju.at, key) === 1) return execute({ t: "face", dir: H.directionTo(s.kaiju.at, key) });
    } else if (m.kind !== "withdraw") {
      const c = candidates();
      if (c.includes(key)) {
        const sheet = m.kind === "attack" || m.kind === "stomp";
        if (game.preview === key && !sheet) return confirm();
        game.preview = key;
      } else game.preview = null;
    }
  }
  render();
}

function onFace(dir) {
  if (game.busy || game.state.result) return;
  execute({ t: "face", dir });
}

function confirm() {
  if (game.busy) return;
  const s = game.state;
  const m = game.mode;
  const p = game.preview;
  if (s.result) return showEnd();
  if (m.kind === "move" && p) execute({ t: "move", to: p });
  else if ((m.kind === "attack" || m.kind === "teleport") && p) execute({ t: "attack", attack: m.attack, target: p });
  else if (m.kind === "stomp" && p) execute({ t: "stomp", target: p });
  else if (m.kind === "eat" && p) execute({ t: "eat", target: p });
  else if (m.kind === "withdraw") execute({ t: "withdraw" });
}

function cancel() {
  if (game.busy) return;
  if (game.mode.kind === "move" && !game.preview) game.selected = null;
  backToMove();
}

function cycle(step) {
  const c = candidates().sort((a, b) => {
    const A = H.keyToOffset(a);
    const B = H.keyToOffset(b);
    return A.row - B.row || A.col - B.col;
  });
  if (!c.length) return;
  const i = c.indexOf(game.preview);
  game.preview = c[(i + step + c.length) % c.length];
  game.selected = game.preview;
  render();
}

function undo() {
  if (!canUndo()) return;
  game.state = game.undo.state;
  const log = $("log");
  while (log.children.length > game.undo.logLength) log.lastElementChild.remove();
  game.events.length = game.undo.events;
  addLog({ k: "refuse", text: "The last move is taken back." });
  game.undo = null;
  backToMove();
}

async function execute(cmd) {
  if (game.busy) return;
  const before = game.state;
  const { state, events } = R.step(before, cmd);
  const recorded = game.events.length;
  game.events.push(...events);
  if (state === before) {
    for (const e of events) addLog(e);
    render();
    return;
  }
  game.undo = cmd.t === "move" ? { state: before, logLength: $("log").children.length, events: recorded } : null;
  game.mode = { kind: cmd.t === "face" ? "face" : "move" };
  game.preview = null;
  if (cmd.t === "face" && events.every((e) => e.k === "face")) {
    game.state = state;
    for (const e of events) addLog(e);
    render();
    return;
  }
  await play(before, events, cmd);
  game.state = state;
  game.view = null;
  game.phase = "";
  render();
}

// Patch the drawn board from one event's data, so the defense phase can be shown step by step.
function patch(v, e) {
  const k = e.actor ? v[e.actor] : null;
  const unit = (id) => v.units.find((u) => u.id === id);
  const hitKaiju = (kk, ev) => {
    if (!kk || !ev.part) return;
    kk.parts[ev.part].hp = ev.after.hp;
    if (ev.spill) kk.parts.body.hp = Math.max(0, kk.parts.body.hp - ev.spill);
  };
  switch (e.k) {
    case "phase":
      if (e.phase === "kaiju") v.turn = e.turn;
      break;
    case "move":
      k.at = e.to;
      if (!e.teleport) k.facing = H.directionTo(e.path.length > 1 ? e.path[e.path.length - 2] : e.from, e.to);
      if (e.actor === "kaiju") k.ap = Math.max(0, k.ap - e.cost);
      break;
    case "face":
      k.facing = e.dir;
      break;
    case "umove": {
      const u = unit(e.unit);
      if (u) u.at = e.to;
      break;
    }
    case "reinforce":
      v.units.push({ id: e.unit, type: e.type, at: e.at, hp: UNITS[e.type].hp, panicked: 0, reload: 0 });
      break;
    case "destroyed":
      if (e.what === "unit") v.units = v.units.filter((u) => u.id !== e.unit);
      else if (e.what === "structure" && v.map.hexes[e.at]) {
        v.map.hexes[e.at].structure = null;
        v.map.hexes[e.at].terrain = "rubble";
      }
      break;
    case "attack": {
      const d = e.defender;
      if (d.side === "unit") {
        const u = unit(d.id);
        if (u) u.hp = e.after.hp;
      } else if (d.side === "structure") {
        const st = v.map.hexes[d.id] && v.map.hexes[d.id].structure;
        if (st) st.hp = e.after.hp;
      } else if (e.hit) hitKaiju(v[d.side], e);
      break;
    }
    case "blast":
      if (e.damage !== undefined) hitKaiju(k, e);
      break;
    case "panic":
      if (e.broke && unit(e.unit)) unit(e.unit).panicked = 2;
      break;
    case "energy":
      k.energy = e.energy;
      break;
    case "hunger":
      k.hunger = e.hunger;
      break;
    case "lingering":
      k.lingering = e.lingering;
      break;
    case "hurt":
      k.parts[e.part].hp = e.after.hp;
      break;
    case "heal":
      k.parts[e.part].hp = e.hp;
      break;
    case "withdraw":
      k.withdrawn = true;
      break;
    default:
  }
}

const PAUSE = { umove: 150, reinforce: 260, move: 120, destroyed: 120, crush: 60 };

async function play(before, events, cmd) {
  game.busy = true;
  game.busyText = cmd.t === "end" ? "The defense forces take their turn." : "The monster acts.";
  game.view = structuredClone(before);
  const groups = planScenes(events, S.settings.cutaway);
  const starts = new Map(groups.map((g) => [g.start, g]));
  const ends = new Map(groups.map((g) => [g.end, g]));
  const reduced = S.reducedMotion();
  let snap = null;
  let skipRest = false;
  render();
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (starts.has(i)) snap = structuredClone(game.view);
    if (e.k === "phase") game.phase = e.phase === "defense" ? "Defense" : "";
    if (e.k === "move" && !e.teleport && !reduced && e.path.length > 1) {
      const k = game.view[e.actor];
      let prev = e.from;
      for (const step of e.path.slice(0, -1)) {
        k.at = step;
        k.facing = H.directionTo(prev, step);
        prev = step;
        render();
        await sleep(90);
      }
    }
    patch(game.view, e);
    addLog(e);
    if (PAUSE[e.k] !== undefined || e.k === "attack" || e.k === "phase") {
      render();
      if (!reduced && PAUSE[e.k]) await sleep(PAUSE[e.k]);
    }
    if (ends.has(i) && !skipRest) {
      const scene = buildScene(ends.get(i), snap, game.view, events);
      render();
      skipRest = await cutaway(scene);
    }
  }
  game.busy = false;
}

async function cutaway(scene) {
  const tile = $("map-tile");
  const r = tile.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) tile.scrollIntoView({ block: "nearest", behavior: S.reducedMotion() ? "auto" : "smooth" });
  return playScene($("cutaway"), scene, { reduced: S.reducedMotion() });
}

function addLog(e) {
  if (!e.text) return;
  const li = document.createElement("li");
  const cls = P.logClass(e, game.state ? game.state.kaiju.id : "");
  if (cls) li.className = cls;
  li.textContent = e.text;
  const log = $("log");
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
  $("log-count").textContent = log.children.length;
}

// ---------- end ----------

function scoreRows(s, r) {
  if (r.grade === "rampage") {
    return [
      ["Structures", r.score.structures],
      ["Units", r.score.units],
      [`Turns lasted (${s.turn})`, r.score.survival],
    ];
  }
  return [
    ["Destruction", r.score.destruction],
    ["Units", r.score.units],
    ["Objective", r.score.objective],
    ["Turns left", r.score.time],
    ["Parts intact", r.score.parts],
  ];
}

// The review, set as a page of the magazine. Paragraph 4 opens with the quote and ends with the
// rating; the page sets the quote as a pull-quote and the rating in its own box instead, and the
// copied text keeps both.
function reviewHtml(rv) {
  const rating = ` Rating: ${rv.ratingText}`;
  const quoted = `"${rv.quote}"`;
  const paras = rv.paragraphs.map((p) => (p.endsWith(rating) ? p.slice(0, -rating.length) : p));
  const last = paras.length - 1;
  const cut = rv.quote ? paras[last].indexOf(quoted) : -1;
  if (cut >= 0) paras[last] = paras[last].slice(cut + quoted.length).trim();
  const verdict = rv.ratingText.replace(/^[★☆]+\s*/, "");
  const body = paras.filter(Boolean).map((p, i) => `<p${i === 0 ? ' class="rv-first"' : ""}>${esc(p)}</p>`);
  const quote = rv.quote ? `<blockquote class="rv-quote"><p>${esc(rv.quote)}</p></blockquote>` : "";
  body.splice(Math.min(2, body.length), 0, quote);
  return `<section class="review-wrap" aria-labelledby="t-review"><h2 class="review-label" id="t-review">The review</h2>`
    + `<article class="review">`
    + `<header class="rv-mast"><div class="rv-name">${esc(rv.magazine)}</div><div class="rv-issue"><span>${esc(rv.issue)}</span><span>Software reviews</span></div></header>`
    + `<h3 class="rv-title">${esc(rv.title)}</h3><p class="rv-dek">${esc(rv.dek)}</p><p class="rv-byline">${esc(rv.byline)}</p>`
    + `<div class="rv-body">${body.join("")}</div>`
    + `<div class="rv-rating"><span class="rv-stars" role="img" aria-label="${rv.stars} of 5 stars">${"★".repeat(rv.stars)}<span class="rv-off">${"☆".repeat(5 - rv.stars)}</span></span>`
    + `<span class="rv-verdict">${esc(verdict)}</span></div></article>`
    + `<div class="rv-copy"><button type="button" class="btn" id="copy-review">Copy as text</button><span class="rv-copied" id="copy-note" aria-live="polite"></span></div>`
    + `<textarea class="rv-text" id="review-text" readonly rows="10" aria-label="The review as text" hidden>${esc(rv.text)}</textarea></section>`;
}

async function copyReview() {
  const note = $("copy-note");
  const area = $("review-text");
  try {
    await navigator.clipboard.writeText(area.value);
    note.textContent = "Copied";
  } catch (err) {
    area.hidden = false;
    area.scrollIntoView({ block: "nearest" });
    area.focus({ preventScroll: true });
    area.select();
    note.textContent = "Copy is blocked here. The text is selected below: press Ctrl+C, or long-press and choose Copy.";
  }
}

function showEnd() {
  const s = game.state;
  const r = s.result;
  if (!r) return;
  const k = s.kaiju;
  const def = kaijuDef(k.id, k.variant);
  const states = P.partStates(k);
  const mission = MISSIONS[s.mission];
  const rampage = r.grade === "rampage";
  const lines = [...$("log").children].filter((li) => !["phase", "caption", "refuse"].includes(li.className)).slice(-7).map((li) => `<p class="${li.className}">${esc(li.textContent)}</p>`).join("");
  const rows = scoreRows(s, r).map(([n, v]) => `<tr><th scope="row">${esc(n)}</th><td>${v}</td></tr>`).join("");
  const crushed = s.tally.destroyed.structures.length;
  const killed = s.tally.destroyed.units.length;
  const how = r.death ? DEATH_LINE[r.death] : OUTCOME_LINE[r.outcome];
  const where = rampage ? `on a rampage, playing for ${s.objective.name}` : `in ${mission ? mission.name : s.mission}`;
  const turn = s.turnLimit ? `Turn ${s.turn} of ${s.turnLimit}` : `Turn ${s.turn}`;
  const stars = rampage ? `<p class="score-stars" aria-hidden="true"><span class="rv-stars">${"★".repeat(r.stars)}<span class="rv-off">${"☆".repeat(5 - r.stars)}</span></span></p>` : "";
  let rv = null;
  try {
    rv = review(s, game.events);
  } catch (err) {
    console.warn("No review:", err);
  }
  $("end-body").innerHTML = `<article class="paper">`
    + `<div class="paper-top"><span>Late edition</span><span>${turn}</span><span>Five cents</span></div>`
    + `<h1 class="paper-name">${esc(PAPERS[s.mission] || "The Evening Wire")}</h1>`
    + `<h2 class="headline" tabindex="-1">${esc(r.headline)}</h2>`
    + `<p class="deck">${esc(def.name)} ${esc(where)}. ${esc(how)} ${crushed} ${crushed === 1 ? "structure" : "structures"} and ${killed} ${killed === 1 ? "unit" : "units"} destroyed. Seed ${esc(game.pick.seed)}.</p>`
    + `<div class="paper-cols"><figure class="paper-photo"><div class="pp-art">${portrait(def.look, { parts: states })}${silhouette(def.look, { parts: states })}</div>`
    + `<figcaption>${esc(def.name)}, ${esc(def.epithet)}, as last seen.</figcaption></figure>`
    + `<div class="wire"><h3>From the wire</h3>${lines}</div></div></article>`
    + `<div class="end-side"><div class="stamp grade-${r.grade.replace(" ", "-")}">${esc(GRADE_LINE[r.grade])}</div>`
    + `<section class="tile score-tile"><h2 class="tile-title">${rampage ? `Score: ${esc(s.objective.name)}` : "Score"}</h2><table class="score"><tbody>${rows}</tbody>`
    + `<tfoot><tr><th scope="row">Total</th><td>${r.score.total}</td></tr></tfoot></table>${stars}</section>`
    + `<div class="end-buttons"><button type="button" class="btn primary" data-end="again"><kbd>A</kbd> Again</button>`
    + `<button type="button" class="btn" data-end="new"><kbd>N</kbd> New seed</button>`
    + `<button type="button" class="btn" data-end="change"><kbd>C</kbd> Change monster</button></div></div>`
    + (rv ? reviewHtml(rv) : "");
  show("end");
  $("end-body").querySelector(".headline").focus({ preventScroll: true });
}

function onEnd(what) {
  if (what === "again") deploy(game.pick);
  else if (what === "new") deploy({ ...game.pick, seed: randomSeed() });
  else if (what === "change") {
    game.events = [];
    Object.assign(pick, game.pick);
    renderSetup();
    show("setup");
  }
}

// ---------- settings dialog ----------

function renderSettings() {
  const radios = (name, list, names, current) => list.map((v) => `<label class="choice${v === current ? " on" : ""}"><input type="radio" name="${name}" value="${v}"${v === current ? " checked" : ""}><span class="choice-name">${names[v]}</span></label>`).join("");
  $("settings-body").innerHTML = `<fieldset class="question"><legend>Theme</legend>${radios("theme", S.THEMES, { system: "As the system says", light: "Light: newsprint", dark: "Dark: ink" }, S.settings.theme)}</fieldset>`
    + `<fieldset class="question"><legend>Cutaways</legend>${radios("cutaway", S.CUTAWAYS, S.CUTAWAY_NAMES, S.settings.cutaway)}</fieldset>`;
}

function openSettings() {
  renderSettings();
  const d = $("settings");
  if (d.showModal) d.showModal();
  else d.setAttribute("open", "");
}

// ---------- keys ----------

function onKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest && e.target.closest("input, textarea, select, dialog")) return;
  const screen = document.body.dataset.screen;
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (screen === "end") {
    const what = { A: "again", N: "new", C: "change" }[key];
    if (what) {
      e.preventDefault();
      onEnd(what);
    }
    return;
  }
  if (screen !== "play" || game.busy) return;
  if (key === "Enter") {
    // A focused button keeps its own Enter, except the current action's button while a target
    // is picked: render() puts focus back there after the arrow keys pick one.
    const b = e.target.closest("button");
    if (b && !(game.preview && b.dataset.action === modeId())) return;
    e.preventDefault();
    return confirm();
  }
  if (key === "Escape") return cancel();
  if (game.state.result) return;
  if (game.mode.kind === "face" && /^[1-6]$/.test(key)) return onFace(Number(key) - 1);
  if (key === "ArrowRight" || key === "ArrowDown") {
    e.preventDefault();
    return cycle(1);
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    e.preventDefault();
    return cycle(-1);
  }
  if (key === "U") return undo();
  const id = Object.keys(game.keys).find((a) => game.keys[a] === key);
  if (id) {
    e.preventDefault();
    onAction(id);
  }
}

// ---------- boot ----------

function boot() {
  // The edition is the build: a playtest names it.
  const edition = document.querySelector(".mast-rule span:last-child");
  if (edition) edition.textContent = `Edition ${VERSION}`;
  document.body.insertAdjacentHTML("afterbegin", DEFS);
  S.applyTheme();
  board = createBoard($("board"), { onHex, onFace });
  setupEvents();
  renderSetup();
  $("actions").addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (b) onAction(b.dataset.action);
  });
  document.addEventListener("click", (e) => {
    const ui = e.target.closest("[data-ui]");
    if (ui) {
      const what = ui.dataset.ui;
      if (what === "confirm") confirm();
      else if (what === "cancel") cancel();
      else if (what === "settings") openSettings();
      else if (what === "theme") S.cycleTheme();
      else if (what === "log") {
        const tile = $("log-tile");
        const open = tile.classList.toggle("open");
        ui.setAttribute("aria-expanded", open);
        ui.querySelector(".log-toggle-word").textContent = open ? "Close" : "Open";
        $("log").scrollTop = $("log").scrollHeight;
      }
      return;
    }
    const end = e.target.closest("[data-end]");
    if (end) onEnd(end.dataset.end);
    if (e.target.closest("#copy-review")) copyReview();
  });
  $("settings").addEventListener("change", (e) => {
    const { name, value } = e.target;
    if (name === "theme") S.setTheme(value);
    if (name === "cutaway") S.setCutaway(value);
    renderSettings();
    // The radio was replaced; focus its successor so the arrow keys stay in the group.
    const back = $("settings-body").querySelector(`input[name="${name}"][value="${value}"]`);
    if (back) back.focus();
  });
  $("settings").addEventListener("close", () => {
    const back = document.body.dataset.screen === "play" ? $("topbar").querySelector('[data-ui="settings"]') : null;
    if (back) back.focus({ preventScroll: true });
  });
  $("settings-close").addEventListener("click", () => $("settings").close ? $("settings").close() : $("settings").removeAttribute("open"));
  S.onChange(() => {
    $("theme-setup").title = `Theme: ${S.settings.theme}`;
    $("theme-setup").querySelector(".tb-label").textContent = S.settings.theme;
    if (game.state && document.body.dataset.screen === "play") render();
  });
  $("theme-setup").querySelector(".tb-label").textContent = S.settings.theme;
  document.addEventListener("keydown", onKey);
  // Read-only, for browser tests: the current state and whether events are still playing.
  window.kaiju = { get state() { return game.state; }, get busy() { return game.busy; }, get events() { return game.events.length; } };
  show("setup");
}

boot();
