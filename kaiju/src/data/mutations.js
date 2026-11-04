// Mutations bought before a mission. apply is data the rules read: numbers add to the stat,
// except passive (added to the kaiju's passives) and hungerEvery (set). Unspent points: +1 body hp each.

export const BUDGET = 3;

export const MUTATIONS = {
  hide: { id: "hide", name: "Thick hide", cost: 2, text: "+1 armor.", apply: { armor: 1 } },
  legs: { id: "legs", name: "Long stride", cost: 2, text: "+1 AP every turn.", apply: { ap: 1 } },
  regen: { id: "regen", name: "Regeneration", cost: 2, text: "Heals 1 on the worst part each turn.", apply: { passive: "regen" } },
  reach: { id: "reach", name: "Long reach", cost: 1, text: "+1 range to ranged and special attacks that reach past 1.", apply: { range: 1 } },
  voice: { id: "voice", name: "Terrible voice", cost: 1, text: "Roar reaches 2 hexes further and frightens more.", apply: { roarRadius: 2, roarPressure: 1 } },
  gut: { id: "gut", name: "Iron gut", cost: 1, text: "Hunger rises only on even turns.", apply: { hungerEvery: 2 } },
  reserves: { id: "reserves", name: "Deep reserves", cost: 1, text: "+3 energy capacity, +2 to start.", apply: { energyMax: 3, energyStart: 2 } },
  bulk: { id: "bulk", name: "Bulk", cost: 1, text: "+3 body hp.", apply: { body: 3 } },
};
