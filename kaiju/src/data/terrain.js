// Terrain and structures: what each hex costs, hides and is worth.
// cost: the kaiju's AP to enter. ground: a ground unit's cost, or false when it cannot enter.
// infantryOnly: only infantry may enter. water: false, "shallow" or "deep".

export const TERRAIN = {
  open: { id: "open", name: "Open ground", glyph: ".", cost: 1, ground: 1, air: true, deep: false, water: false, blocksLos: false },
  road: { id: "road", name: "Road", glyph: "=", cost: 1, ground: 1, air: true, deep: false, water: false, blocksLos: false },
  park: { id: "park", name: "Park", glyph: '"', cost: 1, ground: 1, air: true, deep: false, water: false, blocksLos: false },
  forest: { id: "forest", name: "Forest", glyph: "f", cost: 2, ground: 2, air: true, deep: false, water: false, blocksLos: false },
  shore: { id: "shore", name: "Shallows", glyph: ",", cost: 1, ground: 1, air: true, deep: false, water: "shallow", blocksLos: false },
  water: { id: "water", name: "Deep water", glyph: "~", cost: 2, ground: false, air: true, deep: true, water: "deep", blocksLos: false },
  mountain: { id: "mountain", name: "Mountain", glyph: "^", cost: 3, ground: 3, infantryOnly: true, air: true, deep: false, water: false, blocksLos: true },
  rubble: { id: "rubble", name: "Rubble", glyph: ":", cost: 1, ground: 2, air: true, deep: false, water: false, blocksLos: false },
};

// blast: [min, max] damage when a power structure goes up under the kaiju, or null.
export const STRUCTURES = {
  low: { id: "low", name: "Low building", glyph: "1", height: 1, hp: 2, points: 10, populated: true, solid: false, power: false, objective: false, blast: null },
  mid: { id: "mid", name: "Office block", glyph: "2", height: 2, hp: 4, points: 25, populated: true, solid: false, power: false, objective: false, blast: null },
  tower: { id: "tower", name: "Tower", glyph: "3", height: 3, hp: 6, points: 50, populated: true, solid: false, power: false, objective: false, blast: null },
  pylon: { id: "pylon", name: "Pylon", glyph: "T", height: 1, hp: 2, points: 15, populated: false, solid: false, power: true, objective: false, blast: [2, 3] },
  plant: { id: "plant", name: "Power plant", glyph: "P", height: 2, hp: 6, points: 150, populated: false, solid: false, power: true, objective: true, blast: [6, 9] },
  lab: { id: "lab", name: "Research lab", glyph: "L", height: 2, hp: 8, points: 150, populated: true, solid: true, power: false, objective: true, blast: null },
  leyline: { id: "leyline", name: "Ley-line nexus", glyph: "Y", height: 1, hp: 6, points: 150, populated: false, solid: true, power: false, objective: true, blast: null },
  bunker: { id: "bunker", name: "Command bunker", glyph: "B", height: 2, hp: 10, points: 200, populated: false, solid: true, power: false, objective: true, blast: null },
  wall: { id: "wall", name: "Fortress wall", glyph: "W", height: 3, hp: 8, points: 20, populated: false, solid: true, power: false, objective: false, blast: null },
};

export const TERRAIN_BY_GLYPH = Object.fromEntries(Object.values(TERRAIN).map((t) => [t.glyph, t.id]));
export const STRUCTURE_BY_GLYPH = Object.fromEntries(Object.values(STRUCTURES).map((s) => [s.glyph, s.id]));
