// The four missions: maps, forces, briefings. resolveMission fills in the map (growing the
// city for the swathe and the rampage) and returns a fresh object for rules.create. Maps are
// 12 columns by 14 rows of glyphs, odd-r offset, row 0 at the top; positions are [col, row].

import { Mulberry32, seedFromText } from "../rng.js";
import { growCity } from "../city.js";
import { offsetToKey, keyToOffset, neighbors, distance } from "../hex.js";

export const COLS = 12;
export const ROWS = 14;

const row = (r) => Array.from({ length: COLS }, (_, c) => [c, r]);
const column = (c, from, to) => Array.from({ length: to - from + 1 }, (_, i) => [c, from + i]);

// The rampage's five objectives, after the original's: weights on what the kaiju destroyed and
// on the turns it lasted. A structure weighs `all`, or `populated` for a populated one when
// given, times its height when `perHeight`; a unit weighs its own type's entry, else `all`.
// stars: the totals for two, three, four and five stars, set with tools/sim.mjs.
export const OBJECTIVES = {
  balanced: {
    id: "balanced",
    name: "Balanced",
    text: "Everything counts: what you break, what you kill, how long you last.",
    structures: { all: 1 },
    units: { all: 1 },
    perTurn: 10,
    stars: [200, 350, 600, 900],
  },
  killer: {
    id: "killer",
    name: "Killer Monster",
    text: "People count. Occupied buildings double, Guard squads triple.",
    structures: { all: 0, populated: 2 },
    units: { all: 0.5, infantry: 3 },
    perTurn: 0,
    stars: [200, 350, 650, 1000],
  },
  combat: {
    id: "combat",
    name: "Combat Machine",
    text: "Only the army counts, at double points.",
    structures: { all: 0 },
    units: { all: 2 },
    perTurn: 0,
    stars: [150, 275, 450, 700],
  },
  destruction: {
    id: "destruction",
    name: "Destruction",
    text: "Only buildings count, and the tall ones count most.",
    structures: { all: 1, perHeight: true },
    units: { all: 0 },
    perTurn: 0,
    stars: [200, 400, 700, 1000],
  },
  survival: {
    id: "survival",
    name: "Survival",
    text: "Only time counts: 100 for every turn you last.",
    structures: { all: 0 },
    units: { all: 0 },
    perTurn: 100,
    stars: [300, 600, 1000, 1500],
  },
};

export const MISSIONS = {
  fortress: {
    id: "fortress",
    name: "The Mountain Fortress",
    tagline: "A wall, a bunker, and a valley with only one way up.",
    briefing: [
      "High in the Kessel range, the army has built a fortress and called it safe.",
      "Guns on the wall. Missiles behind it. A maser cannon on the eastern shoulder, recharging.",
      "The generals say nothing alive could come up that valley.",
      "Something is coming up that valley.",
    ],
    goal: "Destroy the command bunker behind the fortress wall.",
    turns: 14,
    map: {
      terrain: [
        "^^^...=..^^^",
        "^^....=....^",
        "^^...===...^",
        "^......=...^",
        "^.......=..^",
        "^^.....=.^^^",
        "^^^.....=.^^",
        "^^ff...=.^^^",
        "^fff...=..f^",
        "^ff,,..=.ff^",
        "^..,~,.=.ff.",
        "...,~,=..f..",
        "..,~~,.=....",
        "..,~,.=.....",
      ],
      features: [
        "............",
        "............",
        "....B.......",
        "............",
        ".WWWWWWW.WW.",
        "............",
        "............",
        "............",
        "............",
        "............",
        ".1..........",
        "..1.........",
        ".1..........",
        "............",
      ],
    },
    kaijuStart: { at: [6, 13], facing: 1 },
    retreat: row(13),
    units: [
      { type: "missile", at: [3, 1] },
      { type: "missile", at: [8, 1] },
      { type: "gun", at: [5, 3] },
      { type: "gun", at: [9, 3] },
      { type: "gun", at: [7, 3] },
      { type: "maser", at: [9, 6] },
      { type: "infantry", at: [3, 7] },
      { type: "infantry", at: [9, 9] },
      { type: "infantry", at: [2, 11] },
      { type: "infantry", at: [8, 4] },
    ],
    reinforcements: [
      { turn: 3, type: "helicopter", at: [6, 0] },
      { turn: 6, type: "helicopter", at: [11, 12] },
      { turn: 8, type: "jet", at: [0, 13] },
    ],
    objective: { kind: "destroy", at: [4, 2] },
  },

  swathe: {
    id: "swathe",
    name: "The Swathe",
    tagline: "Ashore at the harbour, across the city, to one target of your choosing.",
    briefing: [
      "Port Halloran sleeps beside its harbour, unaware of what sleeps beneath it.",
      "Uptown, the city keeps three things it would rather not lose.",
      "A power plant. A research laboratory. A ring of old stones in the park.",
      "Tonight it will lose at least one, and a good deal in between.",
    ],
    goal: "Destroy the chosen target in the north of the city.",
    turns: 15,
    map: null,
    generator: "city",
    kaijuStart: { at: [5, 12], facing: 1 },
    retreat: row(13),
    units: [],
    reinforcements: [],
    objective: { kind: "chosen" },
    targets: undefined,
    choose: "target",
  },

  coast: {
    id: "coast",
    name: "The Coast",
    tagline: "Two monsters, one shoreline, and not enough room for both.",
    briefing: [
      "Fishermen at Gull Point report a second shape moving in the hills.",
      "The coast road is closed. The pylon line hums. The town has locked its doors.",
      "The Guard is out in force, which is to say, not in much force at all.",
      "Only one monster leaves this beach.",
    ],
    goal: "Destroy the rival monster or drive it off the far edge of the map.",
    turns: 16,
    map: {
      terrain: [
        "~,,.=...ffff",
        "~~,.=...fff.",
        "~~,,.=...ff.",
        "~~~,.=.^^f..",
        "~~~,,.=.....",
        "~~~~,.=.\"...",
        "~~~~,,.=....",
        "~~~~~,.=....",
        "~~~~~,,.=...",
        "~~~~~~,.=.f.",
        "~~~~~~,,.=ff",
        "~~~~~~~,.=ff",
        "~~~~~~~,,.=f",
        "~~~~~~~~,.=.",
      ],
      features: [
        ".......T....",
        "............",
        "........T...",
        "............",
        ".....1.1.T..",
        ".....1.1....",
        "......1.1.T.",
        "........1...",
        ".......1...T",
        "............",
        "............",
        "............",
        "............",
        "............",
      ],
    },
    kaijuStart: { at: [5, 10], facing: 1 },
    rivalStart: { at: [10, 1], facing: 4 },
    retreat: [...row(13).slice(0, 8), ...column(0, 4, 12)],
    rivalRetreat: [...row(0).slice(6), ...column(11, 1, 6)],
    units: [
      { type: "infantry", at: [5, 5] },
      { type: "infantry", at: [7, 8] },
      { type: "infantry", at: [9, 1] },
      { type: "infantry", at: [10, 9] },
      { type: "tank", at: [5, 3] },
      { type: "tank", at: [9, 10] },
    ],
    reinforcements: [{ turn: 4, type: "helicopter", at: [11, 5] }],
    objective: { kind: "rival" },
    choose: "rival",
  },

  rampage: {
    id: "rampage",
    name: "Hex and the City",
    tagline: "Eat and smash what you like, until the hangover hits.",
    briefing: [
      "Port Halloran again, or a city very like it.",
      "No orders this time. No target, and no clock.",
      "The army will keep coming, more of it every hour.",
      "They will get you in the end. The question is what it costs them.",
    ],
    goal: "No goal but the score.",
    turns: null,
    map: null,
    generator: "city",
    kaijuStart: { at: [5, 12], facing: 1 },
    retreat: row(13),
    units: [],
    reinforcements: [],
    objective: { kind: "none" },
    targets: undefined,
    choose: "objective",
    objectives: OBJECTIVES,
    waves: {
      size: { base: 1, growEvery: 3, max: 4 },
      mix: [
        { from: 1, types: ["infantry", "tank"] },
        { from: 3, types: ["helicopter", "artillery"] },
        { from: 6, types: ["jet", "missile"] },
      ],
      scientist: { from: 5, every: 6 },
      edges: ["north", "east", "west"],
      cap: 24,
    },
    lingeringGrows: true,
  },
};

export const TARGETS = ["plant", "lab", "leyline"];

const HARBOUR = [
  ",,=,,,,,,=,,",
  "~~~~~~~~~~~~",
  "~~~~~~~~~~~~",
];

const setAt = (lines, col, r, glyph) => {
  lines[r] = lines[r].slice(0, col) + glyph + lines[r].slice(col + 1);
};

const inMap = (col, r, rows = ROWS) => col >= 0 && col < COLS && r >= 0 && r < rows;

function offsetNeighbors(col, r) {
  return neighbors(offsetToKey(col, r)).map((k) => keyToOffset(k)).filter((o) => inMap(o.col, o.row));
}

function hexDistance(a, b) {
  return distance(offsetToKey(a[0], a[1]), offsetToKey(b[0], b[1]));
}

// The swathe's forces: artillery columns on the top avenue, extra tanks near [col, row] in the
// streets, Guard squad columns above the waterfront, and the turns reinforcements arrive.
export const SWATHE = {
  artillery: [1, 4, 7, 10],
  tanks: [[3, 6], [8, 6], [1, 4], [10, 4]],
  infantry: [1, 4, 7, 10],
  turns: { helicopter: [2, 5], scientist: 4, jet: 7 },
};

// The rampage's lighter forces, placed as the swathe's; the waves bring the rest.
export const RAMPAGE = {
  artillery: [3, 8],
  tanks: [[3, 6], [8, 6]],
  infantry: [1, 4, 7, 10],
};

// The harbour city: a city grown from the seed, a harbour below it, three targets in its top
// third. Returns the map, the targets, and pick(score), which takes the best free street hex.
function buildCity(seed) {
  const city = growCity({ seed, cols: COLS, rows: ROWS - HARBOUR.length });
  const terrain = [...city.terrain, ...HARBOUR];
  const features = [...city.features, ...HARBOUR.map(() => ".".repeat(COLS))];
  const rng = new Mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const isRoad = (c, r) => terrain[r][c] === "=";
  const taken = new Set();
  const take = (c, r) => taken.add(`${c},${r}`);
  const free = (c, r) => inMap(c, r, city.terrain.length) && !isRoad(c, r) && !taken.has(`${c},${r}`);

  // A seeded shuffle of the targets across three bands of columns, in rows 1 to 3.
  const order = [...TARGETS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.randint(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const bands = [[1, 2], [5, 6], [9, 10]];
  const targets = {};
  const freeAround = (c, r) => offsetNeighbors(c, r).filter((o) => free(o.col, o.row)).length;
  order.forEach((id, b) => {
    let spots = [];
    for (let r = 1; r <= 3; r++) for (const c of bands[b]) if (free(c, r)) spots.push([c, r]);
    // The plant wants room beside it for its pylons.
    if (id === "plant" && spots.some(([c, r]) => freeAround(c, r) >= 2)) spots = spots.filter(([c, r]) => freeAround(c, r) >= 2);
    const [c, r] = spots[rng.randint(0, spots.length - 1)];
    targets[id] = [c, r];
    take(c, r);
  });

  for (const id of TARGETS) {
    const [c, r] = targets[id];
    setAt(terrain, c, r, id === "leyline" ? '"' : ".");
    setAt(features, c, r, { plant: "P", lab: "L", leyline: "Y" }[id]);
  }

  // Two pylons beside the plant, on the side the monster comes from where possible; on the
  // street itself if the plant is hemmed in by roads.
  const [pc, pr] = targets.plant;
  const besidePlant = offsetNeighbors(pc, pr).filter((o) => o.row < city.terrain.length && !taken.has(`${o.col},${o.row}`));
  const southFirst = (a, b) => b.row - a.row || Math.abs(a.col - pc) - Math.abs(b.col - pc) || a.col - b.col;
  const pylonSpots = [
    ...besidePlant.filter((o) => free(o.col, o.row)).sort(southFirst),
    ...besidePlant.filter((o) => isRoad(o.col, o.row)).sort(southFirst),
  ];
  for (const o of pylonSpots.slice(0, 2)) {
    if (!isRoad(o.col, o.row)) setAt(terrain, o.col, o.row, ".");
    setAt(features, o.col, o.row, "T");
    take(o.col, o.row);
  }

  // The stones stand in a park: their block is cleared to grass.
  const [lc, lr] = targets.leyline;
  for (const o of offsetNeighbors(lc, lr)) {
    if (!free(o.col, o.row)) continue;
    setAt(terrain, o.col, o.row, '"');
    setAt(features, o.col, o.row, ".");
    take(o.col, o.row);
  }

  const roads = [];
  for (let r = 0; r < city.terrain.length; r++) for (let c = 0; c < COLS; c++) if (isRoad(c, r) && features[r][c] === ".") roads.push([c, r]);
  const arrivals = [[0, 0], [10, 0], [6, 0]];
  const used = new Set(arrivals.map(([c, r]) => `${c},${r}`));
  const pick = (score) => {
    const best = roads.filter(([c, r]) => !used.has(`${c},${r}`)).sort((a, b) => score(a) - score(b) || a[1] - b[1] || a[0] - b[0])[0];
    used.add(`${best[0]},${best[1]}`);
    return best;
  };
  return { map: { terrain, features }, targets, arrivals, pick };
}

const artilleryAt = (pick, c0) => ({ type: "artillery", at: pick(([c, r]) => r * 100 + Math.abs(c - c0)) });
const tankNear = (pick, [c0, r0]) => ({ type: "tank", at: pick(([c, r]) => Math.abs(c - c0) * 3 + Math.abs(r - r0) * 2) });
const guardAt = (pick, c0) => ({ type: "infantry", at: pick(([c, r]) => (r < 6 || r > 9 ? 1000 : 0) + Math.abs(c - c0) * 3 + Math.abs(r - 8)) });

// The swathe's forces in the streets. Artillery on the top avenue; a tank by each target, on its
// south side; Guard squads on the streets above the waterfront; reinforcements from the north.
function buildSwathe(mission, seed, target) {
  const { map, targets, arrivals, pick } = buildCity(seed);
  const units = [];
  for (const c0 of SWATHE.artillery) units.push(artilleryAt(pick, c0));
  for (const id of TARGETS) {
    const t = targets[id];
    units.push({ type: "tank", at: pick((p) => {
      const d = hexDistance(p, t);
      return (d >= 1 && d <= 2 ? 0 : 1000 + d * 10) - p[1] * 2;
    }) });
  }
  for (const at of SWATHE.tanks) units.push(tankNear(pick, at));
  for (const c0 of SWATHE.infantry) units.push(guardAt(pick, c0));
  const lab = targets.lab;
  const t = SWATHE.turns;
  const reinforcements = [
    { turn: t.helicopter[0], type: "helicopter", at: arrivals[0] },
    { turn: t.scientist, type: "scientist", at: pick((p) => hexDistance(p, lab) * 10 + Math.abs(p[0] - lab[0])) },
    { turn: t.helicopter[1], type: "helicopter", at: arrivals[1] },
    { turn: t.jet, type: "jet", at: arrivals[2] },
  ];
  return {
    ...mission,
    map,
    units,
    reinforcements,
    targets,
    objective: { kind: "chosen", at: targets[target] || null },
  };
}

// The rampage: the same city, lighter forces, no target. The waves come in the rules.
function buildRampage(mission, seed) {
  const { map, targets, pick } = buildCity(seed);
  const units = [
    ...RAMPAGE.artillery.map((c0) => artilleryAt(pick, c0)),
    ...RAMPAGE.tanks.map((at) => tankNear(pick, at)),
    ...RAMPAGE.infantry.map((c0) => guardAt(pick, c0)),
  ];
  return { ...mission, map, units, reinforcements: [], targets };
}

// A fresh copy of the mission with its map filled in. opts: {seed, target}; only the swathe
// and the rampage read them. A text seed keeps its digits, as rules.create reads it.
export function resolveMission(id, { seed = 0, target } = {}) {
  if (!Object.hasOwn(MISSIONS, id)) throw new Error(`Unknown mission: ${id}`);
  const mission = structuredClone(MISSIONS[id]);
  const n = typeof seed === "string" ? seedFromText(seed) : (Number(seed) || 0) >>> 0;
  if (mission.generator === "city") return id === "rampage" ? buildRampage(mission, n) : buildSwathe(mission, n, target);
  return mission;
}
