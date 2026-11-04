// Variants (DESIGN §15): another look for a kaiju. A variant lays new names, and sometimes new
// numbers, over a base kaiju. kaijuDef(id, variant) is the one way the rules, the AI, the voice
// and the page read a kaiju. Nothing outside data/ reads KAIJU[...] directly.
//
// A variant may set: name, epithet, blurb, press (what the headlines call it), parts (names, and
// plural), attacks (names), change (numbers, see below), preset (a mutation build).
// change lays over the base, field by field: ap, armor, energy and hunger (whole), passives and
// forbid (whole arrays), parts.<slot>.hp, attacks.<id>.{ap, energy, range, damage, accuracy,
// effects}. It cannot add or remove a part or an attack.

import { KAIJU } from "./kaiju.js";

export const VARIANTS = {
  meowthprrtep: {
    id: "meowthprrtep",
    of: "squamous",
    name: "Meow'thprrtep",
    epithet: "the first drawing",
    blurb:
      "The art department's note on the first drawing of the Squamous One reads: \"The Squamous head reads as a cat (two ear spikes).\" It was redrawn. This look restores it, with paws at the ends of the feelers. The eyes still do not agree.",
    press: "THING",
    parts: {
      head: { name: "Ears", plural: true },
      arms: { name: "Paws", plural: true },
      body: { name: "Coat" },
      legs: { name: "Footing" },
      aux: { name: "The Eye" },
    },
    attacks: {
      grab: { name: "Paw grab" },
      gaze: { name: "The stare" },
      angle: { name: "Wrong angle" },
    },
  },
  mekkasaurus: {
    id: "mekkasaurus",
    of: "radiosaur",
    name: "Mekkasaurus Prime",
    epithet: "the atomic tyrannosaurus, rebuilt",
    blurb:
      "Someone built a copy of the tyrannosaurus out of riveted steel and gave it a battery. It has the same stance and the same plates. It does not eat. The cell drains every turn, and a flat cell slows it. It recharges beside power.",
    press: "ROBOT",
    parts: {
      head: { name: "Sensor head" },
      arms: { name: "Grapples", plural: true },
      body: { name: "Hull" },
      legs: { name: "Legs", plural: true },
      aux: { name: "Tail" },
    },
    attacks: {
      bite: { name: "Steel jaw" },
      tail: { name: "Tail flail" },
      breath: { name: "Reactor beam" },
    },
    change: {
      ap: 5,
      armor: 3,
      energy: { max: 12, start: 12, rule: "battery" },
      hunger: null,
      passives: ["reactorBelly", "noHunger"],
      forbid: ["regen", "gut"],
    },
  },
  colossus: {
    id: "colossus",
    of: "thalassor",
    name: "The Alien Colossus",
    epithet: "from the stars",
    blurb:
      "A chrome giant in a violet shell that fell into the sea and kept walking. It draws its strength from the water, which it uses as coolant. Its flail is a chain of light.",
    press: "VISITOR",
    parts: {
      head: { name: "Crowned dome" },
      arms: { name: "Arms", plural: true },
      body: { name: "Shell" },
      legs: { name: "Legs", plural: true },
      aux: { name: "Energy flail" },
    },
    attacks: {
      fist: { name: "Fist" },
      trident: { name: "Flail cast" },
      surge: { name: "Ion surge" },
    },
  },
  gekido: {
    id: "gekido",
    of: "dairengo",
    name: "Gekido-Oh",
    epithet: "the empire's iron general",
    blurb:
      "The other side's robot: black iron, a horned helm and a red slit for a visor. It comes already armoured and already fed. The empire does not issue a second one.",
    press: "ROBOT",
    parts: {
      head: { name: "Helm" },
      arms: { name: "Arms", plural: true },
      body: { name: "Chassis" },
      legs: { name: "Legs", plural: true },
      aux: { name: "Thrusters", plural: true },
    },
    attacks: {
      punch: { name: "Iron fist" },
      sword: { name: "Dark blade" },
      finish: { name: "Total conquest" },
    },
    preset: ["hide", "bulk"],
  },
};

// Per kaiju, base first, at most four.
export const LOOKS = {
  radiosaur: ["radiosaur", "mekkasaurus"],
  thalassor: ["thalassor", "colossus"],
  squamous: ["squamous", "meowthprrtep"],
  dairengo: ["dairengo", "gekido"],
};

const NUMBER_ATTACK_FIELDS = ["ap", "energy", "range", "damage", "accuracy", "effects"];

function freeze(o) {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) freeze(v);
  }
  return o;
}

// Keyed by kaiju and variant. An entry holds the data object it was built from, so replacing that
// object (a test does) builds the def again. Editing the object in place is not seen: data is static.
const cache = new Map();

// The base def, or the base with the variant laid over it. Frozen. Adds look (the art id) and
// variant (the variant id or null), and for a variant its press word and preset, if it has them.
export function kaijuDef(id, variant = null) {
  const v = variant === undefined ? null : variant;
  // Check the arguments first, so a bad call throws whatever the cache holds.
  if (typeof id !== "string" || !Object.hasOwn(KAIJU, id)) throw new Error(`Unknown kaiju: ${id}`);
  if (v !== null) {
    if (typeof v !== "string" || !Object.hasOwn(VARIANTS, v)) throw new Error(`Unknown variant: ${v}`);
    if (VARIANTS[v].of !== id) throw new Error(`Variant ${v} is not a look of ${id}`);
  }
  // The key has a separator no id can hold, and the cached def is used only for the same data.
  const key = `${id}\0${v === null ? "" : v}`;
  const hit = cache.get(key);
  if (hit && hit.source === (v === null ? KAIJU[id] : VARIANTS[v])) return hit.def;
  const def = structuredClone(KAIJU[id]);
  def.look = id;
  def.variant = null;
  if (v !== null) {
    const x = VARIANTS[v];
    def.name = x.name;
    def.epithet = x.epithet;
    def.blurb = x.blurb;
    def.look = x.id;
    def.variant = x.id;
    if (x.press) def.press = x.press;
    if (x.preset) def.preset = [...x.preset];
    for (const [slot, p] of Object.entries(x.parts || {})) {
      if (!Object.hasOwn(def.parts, slot)) throw new Error(`Variant ${v} has no part ${slot}`);
      def.parts[slot].name = p.name;
      if (p.plural !== undefined) {
        if (p.plural) def.parts[slot].plural = true;
        else delete def.parts[slot].plural;
      }
    }
    for (const [aid, a] of Object.entries(x.attacks || {})) {
      const target = def.attacks.find((b) => b.id === aid);
      if (!target) throw new Error(`Variant ${v} has no attack ${aid}`);
      target.name = a.name;
    }
    const c = x.change || {};
    if (c.ap !== undefined) def.ap = c.ap;
    if (c.armor !== undefined) def.armor = c.armor;
    if (c.energy !== undefined) def.energy = { ...c.energy };
    if (c.hunger !== undefined) def.hunger = c.hunger === null ? null : { ...c.hunger };
    if (c.passives !== undefined) def.passives = [...c.passives];
    if (c.forbid !== undefined) def.forbid = [...c.forbid];
    for (const [slot, p] of Object.entries(c.parts || {})) {
      if (!Object.hasOwn(def.parts, slot)) throw new Error(`Variant ${v} changes no part ${slot}`);
      if (p.hp !== undefined) def.parts[slot].hp = p.hp;
    }
    for (const [aid, a] of Object.entries(c.attacks || {})) {
      const target = def.attacks.find((b) => b.id === aid);
      if (!target) throw new Error(`Variant ${v} changes no attack ${aid}`);
      for (const f of NUMBER_ATTACK_FIELDS) if (a[f] !== undefined) target[f] = structuredClone(a[f]);
    }
  }
  freeze(def);
  cache.set(key, { source: v === null ? KAIJU[id] : VARIANTS[v], def });
  return def;
}
