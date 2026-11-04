// The defense forces. attack: [min, max] damage. edible: hunger a meal removes, or null.
// reload 2: after firing, the unit skips its next fire. effect: "indirect" ignores line of sight;
// "lingering" adds 1 to the kaiju's lingering on each hit. morale 99 never panics.

export const UNITS = {
  infantry: { id: "infantry", name: "National Guard", weapon: "rifles", hp: 2, armor: 0, move: 2, range: 1, minRange: 1, attack: [1, 2], accuracy: 60, morale: 5, points: 10, air: false, edible: 4, reload: null, effect: null, radio: "GUARD" },
  tank: { id: "tank", name: "Tank", weapon: "main gun", hp: 4, armor: 1, move: 3, range: 2, minRange: 1, attack: [2, 4], accuracy: 65, morale: 7, points: 30, air: false, edible: 1, reload: null, effect: null, radio: "ARMOR" },
  artillery: { id: "artillery", name: "Artillery", weapon: "shells", hp: 3, armor: 0, move: 1, range: 6, minRange: 2, attack: [3, 5], accuracy: 65, morale: 6, points: 40, air: false, edible: 1, reload: null, effect: "indirect", radio: "BATTERY" },
  helicopter: { id: "helicopter", name: "Attack helicopter", weapon: "rockets", hp: 3, armor: 0, move: 5, range: 2, minRange: 1, attack: [2, 4], accuracy: 65, morale: 6, points: 40, air: true, edible: null, reload: null, effect: null, radio: "ROTOR" },
  jet: { id: "jet", name: "Jet", weapon: "missiles", hp: 3, armor: 0, move: 8, range: 1, minRange: 1, attack: [3, 5], accuracy: 70, morale: 8, points: 60, air: true, edible: null, reload: null, effect: null, radio: "FLIGHT" },
  missile: { id: "missile", name: "Missile battery", weapon: "missiles", hp: 3, armor: 1, move: 1, range: 5, minRange: 2, attack: [3, 5], accuracy: 60, morale: 8, points: 50, air: false, edible: null, reload: null, effect: "indirect", radio: "LAUNCHER" },
  gun: { id: "gun", name: "Gun emplacement", weapon: "guns", hp: 5, armor: 2, move: 0, range: 4, minRange: 1, attack: [2, 4], accuracy: 60, morale: 10, points: 50, air: false, edible: null, reload: null, effect: null, radio: "GUNNERY" },
  maser: { id: "maser", name: "Maser cannon", weapon: "maser beam", hp: 8, armor: 2, move: 0, range: 6, minRange: 1, attack: [5, 7], accuracy: 75, morale: 99, points: 150, air: false, edible: null, reload: 2, effect: null, radio: "MASER" },
  scientist: { id: "scientist", name: "Mad scientist", weapon: "ray", hp: 2, armor: 0, move: 6, range: 2, minRange: 1, attack: [1, 1], accuracy: 70, morale: 99, points: 100, air: true, edible: null, reload: null, effect: "lingering", radio: "DOCTOR" },
};
