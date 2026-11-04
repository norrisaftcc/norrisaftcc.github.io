// The words: one line for every rules event, the newspaper headline at the end, and the
// magazine review of the whole game.
// LINES holds the templates, one table per event kind (most split by variant). A variant may have
// a sharper table for one attack or one unit type, keyed "variant.id"; it is used when present,
// and a building (a populated structure) falls back to the plain structure lines.
// VARS turns an event's data into the placeholders. The pick is lines[(turn * 7 + n) % length],
// never the game's dice, so changing a line never changes a replay.
// Placeholders: {Name} the acting kaiju, {Target} the kaiju struck, {part} a part, {is}/{takes}
// agree with the part, {unit} a unit noun, {aUnit} with its article, {thing} a unit or structure
// noun, {aThing} with its article, {ground} the terrain struck, {weapon} a unit's weapon.

import { kaijuDef, LOOKS } from "./data/variants.js";
import { STRUCTURES, TERRAIN } from "./data/terrain.js";
import { UNITS } from "./data/units.js";
import { MUTATIONS, BUDGET } from "./data/mutations.js";
import { DIR_NAMES, distance } from "./hex.js";
import { VERSION, TITLE } from "./version.js";

// How the log names each unit type.
export const NOUNS = {
  infantry: "Guard squad",
  tank: "tank",
  artillery: "artillery battery",
  helicopter: "attack helicopter",
  jet: "jet",
  missile: "missile battery",
  gun: "gun emplacement",
  maser: "maser cannon",
  scientist: "mad scientist",
};

export const LINES = {
  refuse: ["{why}"],
  phase: {
    kaiju: [
      "Turn {turn}. The monster has the initiative.",
      "Turn {turn}. Barometer falling.",
      "Turn {turn}. The sirens have not stopped.",
      "Turn {turn}. Wind from the south, and something in it.",
    ],
    defense: ["The army answers.", "Control gives its orders.", "The defense forces take their turn.", "The guns have their turn."],
  },
  move: {
    walk: [
      "{Name} comes on, {walked}. {cost} AP.",
      "{Name} moves {walked}. Traffic is diverted. {cost} AP.",
      "{Name} advances {walked}. {cost} AP.",
      "{Name} crosses {walked}, unhurried. {cost} AP.",
    ],
    step: ["{Name} takes one step. {cost} AP.", "{Name} shifts one hex. The ground notices. {cost} AP.", "One step from {Name}. {cost} AP."],
    teleport: [
      "{Name} steps through an angle that is not there and stands {hexes} off.",
      "{Name} is elsewhere, {hexes} off. Witnesses disagree on how.",
      "The air folds. {Name} is {hexes} away.",
    ],
  },
  face: ["{Name} turns {dir}.", "{Name} faces {dir}.", "{Name} looks {dir}."],
  crush: {
    unit: [
      "{ATHING} was in the way. It is now part of the {ground}.",
      "{Name} steps on {aThing}.",
      "{ATHING} goes under {Name}'s foot.",
      "{Name} walks over {aThing}. It does not come up.",
    ],
    structure: [
      "{Name} walks through the {thing}.",
      "The {thing} was in the way, and then it was not.",
      "{Name} goes through the {thing} as a storm goes through a fence.",
      "{Name} wades into the {thing}. Brick, glass, dust.",
    ],
    power: ["{Name} walks into the {thing}. The wires go taut, then slack.", "{Name} steps on the {thing}."],
  },
  attack: {
    kaijuHitsUnit: [
      "{Attack}. The {thing} takes {damage}.",
      "{Name}'s {attack} catches the {thing}. {damage} damage.",
      "{Attack} on the {thing}: {damage}.",
      "{Name} finds the {thing}. {Attack}, {damage} damage.",
    ],
    "kaijuHitsUnit.breath": [
      "Atomic breath. The {thing} is briefly the brightest thing in the state. {damage} damage.",
      "Atomic breath across the {ground}. The {thing} takes {damage}.",
    ],
    "kaijuHitsUnit.breath.alt": [
      "{Attack}. The {thing} is briefly the brightest thing in the state. {damage} damage.",
      "{Attack} across the {ground}. The {thing} takes {damage}.",
    ],
    "kaijuHitsUnit.surge": ["The sea comes in over the {ground}. The {thing} takes {damage}.", "Tidal surge. The {thing} is under water, then under {damage} damage."],
    "kaijuHitsUnit.surge.alt": ["The surge comes in over the {ground}. The {thing} takes {damage}.", "{Attack}. The {thing} takes {damage}, all at once."],
    "kaijuHitsUnit.stomp": ["{Name} stamps on the {thing}. {damage} damage.", "Stomp. The {thing} takes {damage}."],
    "kaijuHitsUnit.finish": ["Final formation. The {thing} takes {damage}. It was not the intended audience."],
    "kaijuHitsUnit.finish.alt": ["{Attack}. The {thing} takes {damage}. It was not the intended audience."],
    kaijuMissesUnit: ["{Attack} misses the {thing}.", "{Attack}. The {thing} is not where it was.", "{Attack} goes wide of the {thing}."],
    kaijuHitsStructure: ["{Attack} into the {thing}. {damage} damage.", "{Attack}. The {thing} takes {damage}.", "{Name} sets about the {thing}. {Attack}, {damage} damage."],
    kaijuHitsBuilding: [
      "{Attack} into the {thing}. {damage} damage.",
      "{Attack}. The {thing} takes {damage}.",
      "{Attack} on the {thing}. Plaster falls. {damage} damage.",
    ],
    "kaijuHitsBuilding.breath": ["Atomic breath. Every window in the {thing} goes at once. {damage} damage.", "Atomic breath. The {thing} glows, then smokes. {damage} damage."],
    "kaijuHitsBuilding.breath.alt": ["{Attack}. Every window in the {thing} goes at once. {damage} damage.", "{Attack}. The {thing} glows, then smokes. {damage} damage."],
    "kaijuHitsStructure.breath": ["Atomic breath. The {thing} glows, then smokes. {damage} damage.", "Atomic breath across the {thing}. {damage} damage."],
    "kaijuHitsStructure.breath.alt": ["{Attack}. The {thing} glows, then smokes. {damage} damage.", "{Attack} across the {thing}. {damage} damage."],
    "kaijuHitsStructure.surge": ["The sea goes through the {thing}. {damage} damage.", "Tidal surge. The {thing} takes {damage} and a great deal of water."],
    "kaijuHitsStructure.surge.alt": ["The surge goes through the {thing}. {damage} damage.", "{Attack}. The {thing} takes {damage} and a great deal of noise."],
    "kaijuHitsStructure.stomp": ["{Name} stamps on the {thing}. {damage} damage.", "Stomp. The {thing} takes {damage}."],
    kaijuHitsKaiju: [
      "{Attack} lands on {Target}'s {part}. {damage} damage{rear}.",
      "{Attack}. {Target} takes {damage} on the {part}{rear}.",
      "{Name} reaches {Target}. {Attack}, {damage} on the {part}{rear}.",
    ],
    "kaijuHitsKaiju.breath": ["Atomic breath full on {Target}. {damage} on the {part}{rear}.", "Atomic breath. {Target}'s {part} {takes} {damage}{rear}."],
    "kaijuHitsKaiju.breath.alt": ["{Attack} full on {Target}. {damage} on the {part}{rear}.", "{Attack}. {Target}'s {part} {takes} {damage}{rear}."],
    "kaijuHitsKaiju.finish": ["Final formation. Five machines become one blow. {Target} takes {damage} on the {part}{rear}."],
    "kaijuHitsKaiju.finish.alt": ["{Attack}. All of it in one blow. {Target} takes {damage} on the {part}{rear}."],
    "kaijuHitsKaiju.grab": ["Tentacles find {Target}'s {part}. {damage} damage{rear}.", "Tentacle grab. {Target}'s {part} is held, and hurt. {damage} damage{rear}."],
    "kaijuHitsKaiju.grab.alt": ["{Attack} finds {Target}'s {part}. {damage} damage{rear}.", "{Attack}. {Target}'s {part} is held, and hurt. {damage} damage{rear}."],
    kaijuMissesKaiju: ["{Attack} misses {Target}.", "{Target} sways clear of the {attack}.", "{Attack}. {Target} is not there to receive it."],
    gaze: ["{Name} looks at the {thing}.", "The {thing} meets {Name}'s gaze.", "{Name}'s gaze rests on the {thing}."],
    unitHitsKaiju: [
      "The {unit} fires. {damage} on {Target}'s {part}{rear}.",
      "The {unit} hits {Target}'s {part}. {damage} damage{rear}.",
      "{Weapon} from the {unit}. {Target}'s {part} takes {damage}{rear}.",
    ],
    "unitHitsKaiju.maser": [
      "The maser cannon fires. The air smells of hot tin. {damage} on {Target}'s {part}{rear}.",
      "Maser beam. {Target}'s {part} takes {damage}{rear}.",
    ],
    "unitHitsKaiju.scientist": [
      "The mad scientist's ray touches {Target}'s {part}. {damage} damage{rear}, and something slower.",
      "A thin green ray from the mad scientist. {Target}'s {part}, {damage}{rear}. It lingers.",
    ],
    "unitHitsKaiju.gun": ["The gun emplacement fires. {damage} on {Target}'s {part}{rear}.", "Fire from the wall. {Target}'s {part} takes {damage}{rear}."],
    "unitHitsKaiju.jet": ["The jet comes in low. {damage} on {Target}'s {part}{rear}.", "Missiles from the jet. {Target}'s {part} takes {damage}{rear}."],
    unitMissesKaiju: ["The {unit} fires at {Target} and misses.", "The {unit} fires its {weapon}. A miss.", "The {unit} misses. {Target} does not notice."],
  },
  destroyed: {
    unit: ["The {thing} is destroyed.", "One {thing} fewer.", "The {thing} is out of the war.", "Scratch one {thing}."],
    structure: ["The {thing} comes down.", "The {thing} is rubble.", "Where the {thing} stood there is dust.", "The {thing} folds into the street."],
    kaiju: ["{Name} falls and does not get up.", "{Name} goes down. The ground shakes for some time.", "{Name} is down. The weather is clearing."],
  },
  blast: {
    damage: [
      "The {thing} goes up with {Name} inside it. {damage} on the {part}.",
      "The {thing} explodes under {Name}. {damage} on the {part}.",
      "A flash, then the sound. The {thing} is gone and {Name} takes {damage} on the {part}.",
    ],
    energy: ["The {thing} goes up. {Name} drinks the fire.", "The {thing} explodes. {Name} seems to enjoy it.", "The {thing} burns. {Name} stands in it and grows warm."],
  },
  panic: {
    broke: [
      "The {unit} recalls urgent business elsewhere.",
      "The {unit} breaks and runs.",
      "The {unit} leaves. It does not say where.",
      "The {unit} falls back without orders.",
    ],
    held: ["The {unit} holds.", "The {unit} stays. Nobody asks how.", "The {unit} does not run. Not yet."],
  },
  eat: {
    unit: [
      "{Name} eats the {thing}. Hunger {hunger}.",
      "{Name} has {aThing} for lunch. Hunger {hunger}.",
      "{Name} eats. The {thing} is not seen again. Hunger {hunger}.",
    ],
    structure: [
      "{Name} eats the {thing}, occupants and all. Hunger {hunger}.",
      "{Name} bites the top off the {thing}. Hunger {hunger}.",
      "{Name} feeds on the {thing}. Nobody comes out. Hunger {hunger}.",
    ],
    power: ["{Name} eats the {thing}, wires and all.", "{Name} chews through the {thing}. Sparks, then quiet."],
  },
  energy: {
    gain: ["{Why} feeds {Name}. Energy {energy}, up {change}.", "{Name} gains {change} energy from {why}. Energy {energy}.", "{Name}: energy {energy}, up {change}, from {why}."],
    drain: ["{Name}'s battery runs down. Energy {energy}.", "{Name} draws on its battery. Energy {energy}.", "{Name}: battery at {energy}."],
    loss: ["{Name} loses {change} energy to {why}. Energy {energy}."],
  },
  hunger: {
    normal: ["{Name}: hunger {hunger} of {max}.", "{Name} is hungry. Hunger {hunger} of {max}.", "{Name} has not eaten lately. Hunger {hunger} of {max}."],
    high: [
      "{Name} is very hungry. Hunger {hunger} of {max}.",
      "{Name} has started looking at people. Hunger {hunger} of {max}.",
      "Hunger {hunger} of {max}. {Name} is thinking about lunch.",
    ],
  },
  part: {
    intact: ["{Name}'s {part} {is} whole again.", "{Name}'s {part} {has} knitted."],
    hurt: ["{Name}'s {part} {is} hurt.", "{Name}'s {part} {takes} a dent.", "{Name}'s {part} {shows} the damage."],
    bad: ["{Name}'s {part} {is} badly hurt.", "{Name}'s {part} {is} in poor shape.", "{Name}'s {part} {is} close to giving out."],
    crippled: ["{Name}'s {part} {is} crippled.", "{Name}'s {part} {stops} working.", "{Name}'s {part} {is} finished."],
  },
  heal: ["{Name}'s {part} {heals} to {hp} of {max}.", "{Name} mends. The {part}: {hp} of {max}.", "{Name}'s {part} {closes}. {hp} of {max}."],
  roar: [
    "{Name} roars. Everything within {radius} hexes hears it.",
    "{Name} roars. Windows go first, for {radius} hexes.",
    "{Name} roars. Car alarms answer for {radius} hexes.",
  ],
  berserk: ["{Name} is too hungry to take orders. It goes looking for food.", "{Name} stops listening. It is lunchtime.", "Hunger has {Name} now. It goes where the food is."],
  reinforce: ["{AUNIT} arrives.", "Reinforcements: {aUnit}.", "{AUNIT} joins the defense."],
  umove: {
    one: ["The {unit} moves one hex.", "The {unit} shifts position.", "The {unit} edges over."],
    many: ["The {unit} moves {walked}.", "The {unit} repositions, {walked}.", "The {unit} changes ground, {walked}."],
    pulled: ["{Name} drags the {unit} in.", "The {unit} is pulled closer by something it would rather not describe."],
  },
  withdraw: ["{Name} leaves the map.", "{Name} walks away. Nobody follows.", "{Name} goes back where it came from. For now."],
  lingering: [
    "The paralysis spreads. {Name} is slower again. Lingering {lingering}.",
    "{Name} moves as if through glue. Lingering {lingering}.",
    "Something in {Name} is setting like plaster. Lingering {lingering}.",
  ],
  hurt: {
    lingering: [
      "The paralysis reaches {Name}'s {part}. {damage} damage.",
      "{Name} cannot move what it cannot feel. {damage} on the {part}.",
      "The mad scientist's ray is still at work. {Name}'s {part} {takes} {damage}.",
    ],
  },
  radio: {
    arrive: ["{CALLSIGN} TO CONTROL. ON STATION.", "{CALLSIGN} ARRIVING. VISUAL ON THE TARGET.", "{CALLSIGN} CHECKING IN. AWAITING TARGET."],
    break: [
      "{CALLSIGN} TO CONTROL. WE ARE FALLING BACK.",
      "{CALLSIGN} TO CONTROL. REQUEST PERMISSION TO BE ELSEWHERE.",
      "{CALLSIGN}. CANNOT HOLD. CANNOT HOLD.",
      "CONTROL, {CALLSIGN}. IT LOOKED AT US.",
    ],
    fire: [
      "{CALLSIGN}. ENGAGING.",
      "{CALLSIGN} TO CONTROL. TARGET HAS TURNED. REQUEST INSTRUCTIONS.",
      "{CALLSIGN} TO CONTROL. FIRING FOR EFFECT.",
      "{CALLSIGN}. TARGET IN SIGHT. IT IS VERY LARGE.",
    ],
    wave: [
      "{CALLSIGN} TO ALL STATIONS. MORE UNITS FROM THE {EDGE}.",
      "{CALLSIGN}. FRESH UNITS INBOUND, {EDGE} SIDE.",
      "{CALLSIGN} TO ALL STATIONS. KEEP IT BUSY. HELP IS COMING FROM THE {EDGE}.",
      "{CALLSIGN}. EVERYTHING WE HAVE IS ON THE WAY.",
    ],
    "wave-wide": [
      "{CALLSIGN}. EVERYTHING WE HAVE IS ON THE WAY.",
      "{CALLSIGN} TO ALL STATIONS. FRESH UNITS INBOUND. KEEP IT BUSY.",
    ],
  },
  over: {
    goal: ["The objective is met. {grade}. Score {total}.", "It is done. {grade}. Score {total}.", "The job is finished. {grade}. Score {total}."],
    time: ["Time is up. {grade}. Score {total}.", "The clock has run out. {grade}. Score {total}.", "Dawn. Nothing is settled. {grade}. Score {total}."],
    withdrawn: ["The monster has withdrawn. {grade}. Score {total}.", "The monster is gone. {grade}. Score {total}."],
    fallen: ["The monster has fallen. {grade}. Score {total}.", "The monster is down. {grade}. Score {total}.", "Silence where the monster was. {grade}. Score {total}."],
    "rampage-cuts": [
      "A thousand cuts. The monster is down after {turns}. {Objective} score {total}, {stars}.",
      "No one shot did it. All of them did. Down after {turns}. {Objective} score {total}, {stars}.",
    ],
    "rampage-sudden": [
      "The sudden death. The power went up and took the monster with it, after {turns}. {Objective} score {total}, {stars}.",
      "The sudden death. The monster stood too near the power, and the power won. {Objective} score {total}, {stars}.",
    ],
    "rampage-lingering": [
      "The lingering death. The monster stiffens and falls, after {turns}. {Objective} score {total}, {stars}.",
      "The lingering death. The ray did its slow work. Down after {turns}. {Objective} score {total}, {stars}.",
    ],
    "rampage-withdrawn": [
      "The monster has gone back to sea after {turns}. {Objective} score {total}, {stars}.",
      "The monster is gone, after {turns}. The army counts its losses. {Objective} score {total}, {stars}.",
    ],
  },
};

// Headlines by grade: newspaper caps, a semicolon, a quoted official. Each grade has lines fitted
// to a mission, and lines for any other. {TARGET} is the objective, {NAME} the player's kaiju,
// {NOUN} what the papers call it, {PLACE} the town. "-driven": the rival withdrew.
export const HEADLINES = {
  "total victory": {
    any: ["{TARGET} GONE; GENERAL 'REVIEWING OPTIONS'", "{NOUN} TAKES {TARGET}, WALKS AWAY; OFFICIALS 'DEEPLY CONCERNED'"],
    fortress: [
      "{NAME} OVER THE WALL; GENERAL 'REVIEWING OPTIONS'",
      "KESSEL BUNKER FLATTENED; ARMY 'WE NEVER SAID SAFE'",
      "BUNKER GONE, {NOUN} UNMARKED; COLONEL 'WE HIT IT, WE ARE SURE'",
    ],
    swathe: [
      "{TARGET} LOST, {NOUN} UNHURT; MAYOR 'WE WILL REBUILD'",
      "{PLACE} CUT IN TWO; POLICE 'STAY INDOORS'",
      "{NOUN} TAKES {TARGET}, WALKS BACK TO SEA; MAYOR 'DEEPLY CONCERNED'",
    ],
    coast: ["{TARGET} BEATEN ON THE BEACH; FISHERMEN 'WE SAW IT ALL'", "{NAME} KEEPS {PLACE}; COASTGUARD 'ONE MONSTER IS PLENTY'"],
  },
  victory: {
    any: ["{TARGET} FALLS; GENERAL 'IT WAS LIMPING'", "{TARGET} LOST; GENERAL 'IT WAS BLEEDING'"],
    fortress: ["BUNKER LOST, {NOUN} HURT; COLONEL 'WE NEARLY HAD IT'", "{NAME} TAKES FORTRESS AT A PRICE; GENERAL 'SMALL COMFORT'"],
    swathe: [
      "{TARGET} DOWN, {NOUN} BLEEDING; PROFESSOR 'IT WILL BE BACK'",
      "{PLACE} LOSES ITS {TARGET}; MAYOR 'IT LOOKED TIRED'",
      "{TARGET} FALLS, {NOUN} LIMPS TO SEA; HARBOURMASTER 'WATCH THE TIDE'",
    ],
    coast: ["{NAME} WINS AT {PLACE}, BARELY; COASTGUARD 'BOTH OF THEM BLED'", "{TARGET} DEAD ON THE SAND; VET 'THE WINNER LOOKS NO BETTER'"],
  },
  "total victory-driven": {
    any: ["{TARGET} DRIVEN INTO THE HILLS; MAYOR 'WE DID NOT ASK {NAME} TO STAY'", "{TARGET} FLEES {PLACE}; FISHERMEN 'THE BIG ONE CHASED IT OFF'"],
  },
  "victory-driven": {
    any: ["{TARGET} DRIVEN OFF; DOCTOR '{NAME} NEEDS REST'", "{TARGET} GONE INLAND; COASTGUARD 'THE OTHER ONE STAYED'"],
  },
  "draw-time": {
    any: ["{NOUN} STILL AT LARGE; GENERAL '{TARGET} IS SECURE'", "ARMY HOLDS {TARGET}; GENERAL 'A GOOD NIGHT OF WORK'"],
    fortress: ["FORTRESS HOLDS; GENERAL 'NOTHING ALIVE COULD COME UP THAT VALLEY'", "{NOUN} STILL IN VALLEY; COLONEL 'BUNKER SECURE'"],
    swathe: ["{TARGET} SURVIVES THE NIGHT; MAYOR 'BUSINESS AS USUAL'", "{NOUN} STILL IN {PLACE}; POLICE 'STAY INDOORS'"],
    coast: ["TWO MONSTERS, NO WINNER; MAYOR 'PLEASE GO HOME'", "STALEMATE AT {PLACE}; COASTGUARD 'THEY ARE STILL OUT THERE'"],
  },
  "draw-withdrawn": {
    any: ["{NAME} WITHDRAWS; MAYOR 'SWEEP UP AND CARRY ON'", "{NOUN} LEAVES {PLACE}; GENERAL '{TARGET} NEVER IN DANGER'"],
    fortress: ["{NOUN} TURNS BACK; GENERAL 'AS EXPECTED'", "{NAME} LEAVES VALLEY; COLONEL 'BUNKER NEVER IN DANGER'"],
    swathe: ["{NOUN} RETURNS TO SEA; HARBOURMASTER 'IT WILL BE BACK'", "{TARGET} SPARED; MAYOR 'THE SEA CAN KEEP IT'"],
    coast: ["{NAME} GIVES UP THE BEACH; COASTGUARD 'THE OTHER ONE IS STILL HERE'", "{NOUN} BACK TO SEA; FISHERMEN 'WE ARE NOT GOING OUT TOMORROW'"],
  },
  defeat: {
    any: ["{NOUN} DOWN AT {PLACE}; MAYOR 'CLEAN-UP TO TAKE YEARS'", "{NAME} FELLED AT {PLACE}; GENERAL 'NOT SURPRISED'"],
    fortress: [
      "VALLEY HOLDS; GENERAL 'NOTHING ALIVE COULD COME UP IT'",
      "{NAME} DIES BELOW THE WALL; ARMY 'AS PLANNED'",
      "{NOUN} DOWN AT {PLACE}; COLONEL 'CLEAN-UP TO TAKE YEARS'",
    ],
    swathe: ["{NAME} DIES IN THE STREETS; MAYOR 'OPEN MONDAY'", "{NOUN} DOWN IN {PLACE}; PROFESSOR 'WE WOULD LIKE THE BODY'"],
    coast: ["{TARGET} KEEPS THE BEACH; COASTGUARD 'ONE DOWN, ONE TO GO'", "{NOUN} FALLS AT {PLACE}; FISHERMEN 'THE OTHER ONE ATE WELL'"],
  },
  "rampage-cuts": {
    any: [
      "{NOUN} DIES OF A THOUSAND CUTS; GENERAL 'WE KEPT AT IT'",
      "{PLACE} WEARS DOWN {NAME} IN {TURNS} TURNS; ARMY 'EVERY SHELL COUNTED'",
      "ARMY FELLS {NOUN} AT LAST; MAYOR 'IT FELT LIKE A YEAR'",
    ],
  },
  "rampage-sudden": {
    any: [
      "{NOUN} DIES IN POWER BLAST; ENGINEER 'IT WALKED RIGHT IN'",
      "LIGHTS OUT FOR {NAME}; POWER COMPANY 'SERVICE RESUMES MONDAY'",
      "{NOUN} GOES UP WITH THE GRID; GENERAL 'NOT OUR DOING, BUT WE WILL TAKE IT'",
    ],
  },
  "rampage-lingering": {
    any: [
      "MYSTERY PARALYSIS FELLS {NOUN}; DOCTOR 'PROGRESSIVE AND FATAL'",
      "{NAME} STIFFENS AND FALLS; PROFESSOR 'I DID TELL THEM'",
      "SLOW RAY FINISHES {NOUN}; ARMY 'THE SCIENTIST WAS NOT OURS'",
    ],
  },
  "rampage-withdrawn": {
    any: [
      "{NOUN} BACK TO SEA AFTER {TURNS} TURNS; MAYOR 'COUNT THE COST'",
      "{PLACE} LEFT IN RUINS; HARBOURMASTER 'IT WILL BE BACK'",
      "{NAME} WALKS OFF, ARMY STILL STANDING; GENERAL 'WE CALL THAT A WIN'",
    ],
  },
};

// What the papers call each kaiju, and the town each mission happens to.
const PRESS = { radiosaur: "LIZARD", thalassor: "STATUE", squamous: "THING", dairengo: "ROBOT" };
const PLACES = { fortress: "KESSEL", swathe: "PORT HALLORAN", coast: "GULL POINT", rampage: "PORT HALLORAN" };

const ENERGY_WHY = { eat: "the meal", water: "the sea", panic: "fear", drain: "the drain", charge: "the grid", reactor: "the reactor" };

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lower = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const article = (noun) => `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
const hexes = (n) => `${n} ${n === 1 ? "hex" : "hexes"}`;
// The def for a kaiju id and variant, or null for an id the voice does not know.
const defOf = (id, variant = null) => (typeof id === "string" && Object.hasOwn(LOOKS, id) ? kaijuDef(id, variant) : null);
const kaijuName = (id, variant = null) => (defOf(id, variant) ? defOf(id, variant).name : "the monster");
const unitNoun = (type) => NOUNS[type] || type;
const structureNoun = (type) => (STRUCTURES[type] ? STRUCTURES[type].name.toLowerCase() : type);
const groundName = (id) => (TERRAIN[id] ? TERRAIN[id].name.toLowerCase() : "ground");

function partVars(id, variant, part) {
  const def = defOf(id, variant);
  const p = def && def.parts[part];
  const plural = !!(p && p.plural);
  return {
    part: p ? p.name.toLowerCase().replace(/^the /, "") : part,
    is: plural ? "are" : "is",
    has: plural ? "have" : "has",
    takes: plural ? "take" : "takes",
    stops: plural ? "stop" : "stops",
    heals: plural ? "heal" : "heals",
    closes: plural ? "close" : "closes",
    shows: plural ? "show" : "shows",
  };
}

function thingVars(what, type, variant = null) {
  const thing = what === "unit" ? unitNoun(type) : what === "kaiju" ? kaijuName(type, variant) : structureNoun(type);
  return { thing, aThing: article(thing), ATHING: cap(article(thing)) };
}

function unitVars(type) {
  const unit = unitNoun(type);
  return { unit, aUnit: article(unit), AUNIT: cap(article(unit)) };
}

const isPower = (d) => d.what === "structure" && !!STRUCTURES[d.type] && STRUCTURES[d.type].power;

function bodyName(id, variant = null) {
  return defOf(id, variant) ? defOf(id, variant).parts.body.name.toLowerCase() : "body";
}

const VARS = {
  refuse: (d) => ({ vars: { why: d.why || d.text || "That cannot be done." } }),
  phase: (d) => ({ variant: d.phase, vars: { turn: d.turn } }),
  move: (d) => ({
    variant: d.teleport ? "teleport" : d.path && d.path.length === 1 ? "step" : "walk",
    vars: { Name: kaijuName(d.who, d.variant), walked: hexes(d.path ? d.path.length : 0), cost: d.cost, hexes: hexes(d.from && d.to ? distance(d.from, d.to) : 0) },
  }),
  face: (d) => ({ vars: { Name: kaijuName(d.who, d.variant), dir: DIR_NAMES[d.dir] } }),
  crush: (d) => ({ variant: isPower(d) ? "power" : d.what, vars: { Name: kaijuName(d.who, d.variant), ground: "ground", ...thingVars(d.what, d.type, d.variant) } }),
  attack: (d) => {
    const a = d.attacker;
    const t = d.defender;
    const onKaiju = t.side === "kaiju" || t.side === "rival";
    const weapon = a.side === "unit" && UNITS[a.type] ? UNITS[a.type].weapon : d.attack.name;
    const vars = {
      Attack: cap(d.attack.name),
      attack: lower(d.attack.name),
      Weapon: cap(weapon),
      weapon,
      damage: d.damage,
      rear: d.rear ? ", from behind" : "",
      ground: groundName(d.terrain),
      Target: onKaiju ? kaijuName(t.type, t.variant) : "",
      Name: a.side === "unit" ? "" : kaijuName(a.type, a.variant),
      ...(onKaiju ? partVars(t.type, t.variant, d.part) : thingVars(t.side, t.type)),
      ...(a.side === "unit" ? unitVars(a.type) : {}),
    };
    let kinds;
    if (a.side === "unit") kinds = [d.hit ? "unitHitsKaiju" : "unitMissesKaiju"];
    else if (t.side === "structure") kinds = STRUCTURES[t.type] && STRUCTURES[t.type].populated ? ["kaijuHitsBuilding", "kaijuHitsStructure"] : ["kaijuHitsStructure"];
    else if (t.side === "unit") kinds = [d.zero ? "gaze" : d.hit ? "kaijuHitsUnit" : "kaijuMissesUnit"];
    else kinds = [d.hit ? "kaijuHitsKaiju" : "kaijuMissesKaiju"];
    const id = a.side === "unit" ? a.type : d.attack.id;
    const tail = onKaiju && d.hit && d.spill > 0 ? ` ${d.spill} goes through to the ${bodyName(t.type, t.variant)}.` : "";
    // A look gets the ".alt" lines first: they name the blow by its attack, not the base kaiju's word for it.
    const alt = a.side !== "unit" && !!a.variant;
    return { variants: kinds.flatMap((v) => [...(alt ? [`${v}.${id}.alt`] : []), `${v}.${id}`, v]), vars, tail };
  },
  destroyed: (d) => ({ variant: d.what, vars: { Name: kaijuName(d.type, d.variant), ...thingVars(d.what, d.type, d.variant) } }),
  blast: (d) => ({
    variant: d.energy ? "energy" : "damage",
    vars: { Name: kaijuName(d.who, d.variant), ...thingVars("structure", d.type), damage: d.damage, ...partVars(d.who, d.variant, d.part) },
    tail: d.spill > 0 ? ` ${d.spill} goes through to the ${bodyName(d.who, d.variant)}.` : "",
  }),
  panic: (d) => ({ variant: d.broke ? "broke" : "held", vars: unitVars(d.type) }),
  eat: (d) => ({
    variant: isPower(d) ? "power" : d.what,
    vars: { Name: kaijuName(d.who, d.variant), ...thingVars(d.what, d.type, d.variant), hunger: d.hunger },
  }),
  energy: (d) => {
    const why = ENERGY_WHY[d.why] || d.why;
    return {
      variant: d.change >= 0 ? "gain" : d.why === "drain" ? "drain" : "loss",
      vars: { Name: kaijuName(d.who, d.variant), change: Math.abs(d.change), energy: d.energy, why, Why: cap(why) },
    };
  },
  hunger: (d) => ({ variant: d.hunger >= 0.7 * d.max ? "high" : "normal", vars: { Name: kaijuName(d.who, d.variant), hunger: d.hunger, max: d.max } }),
  part: (d) => ({ variant: d.state, vars: { Name: kaijuName(d.who, d.variant), ...partVars(d.who, d.variant, d.part) } }),
  heal: (d) => ({ vars: { Name: kaijuName(d.who, d.variant), ...partVars(d.who, d.variant, d.part), hp: d.hp, max: d.max } }),
  roar: (d) => ({ vars: { Name: kaijuName(d.who, d.variant), radius: d.radius } }),
  berserk: (d) => ({ vars: { Name: kaijuName(d.who, d.variant) } }),
  reinforce: (d) => ({ vars: unitVars(d.type) }),
  umove: (d) => ({
    variant: d.pulled ? "pulled" : d.path && d.path.length === 1 ? "one" : "many",
    vars: { ...unitVars(d.type), walked: hexes(d.path ? d.path.length : 0), Name: kaijuName(d.who, d.variant) },
  }),
  withdraw: (d) => ({ vars: { Name: kaijuName(d.who, d.variant) } }),
  radio: (d) => ({ variant: d.about === "wave" && d.edge === null ? "wave-wide" : d.about || "fire", vars: { CALLSIGN: d.callsign, EDGE: String(d.edge || "north").toUpperCase() } }),
  lingering: (d) => ({ vars: { Name: kaijuName(d.who, d.variant), lingering: d.lingering } }),
  hurt: (d) => ({ variant: d.why, vars: { Name: kaijuName(d.who, d.variant), damage: d.damage, ...partVars(d.who, d.variant, d.part) } }),
  over: (d) => {
    const r = d.result;
    const vars = { grade: cap(r.grade), total: r.score.total, turns: count(d.turn, "turn"), Objective: d.objective || "", stars: count(r.stars, "star") };
    if (r.grade !== "rampage") return { variant: r.outcome, vars };
    return { variants: [`rampage-${r.death || "withdrawn"}`, r.outcome], vars };
  },
};

function smallHash(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) % 9973;
  return n;
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? "" : String(vars[name])));
}

export function pick(lines, turn, n) {
  return lines[(turn * 7 + n) % lines.length];
}

// The log line for an event. data is the event's data; turn and n (if present) steer the pick.
export function say(k, data = {}) {
  const table = LINES[k];
  const make = VARS[k];
  if (!table || !make) return "";
  const { variant, variants = [variant], vars, tail = "" } = make(data);
  const found = Array.isArray(table) ? table : variants.map((v) => table[v]).find(Boolean);
  const lines = found || Object.values(table)[0];
  const n = data.n !== undefined ? data.n : smallHash(`${data.at || data.to || ""}${data.type || ""}${data.unit || ""}${data.part || ""}`);
  return cap((fill(pick(lines, data.turn || 0, n), vars) + fill(tail, vars)).trim());
}

export function headline(result, state) {
  let target = "THE TARGET";
  const rivalGoal = !!(state && state.objective && state.objective.kind === "rival");
  if (state && state.objective) {
    if (rivalGoal && state.rival) target = kaijuName(state.rival.id, state.rival.variant).toUpperCase();
    else if (state.objective.type && STRUCTURES[state.objective.type]) target = STRUCTURES[state.objective.type].name.toUpperCase();
  }
  const id = state && state.kaiju ? state.kaiju.id : null;
  const variant = state && state.kaiju ? state.kaiju.variant : null;
  const def = defOf(id, variant);
  const vars = {
    TARGET: target,
    NAME: def ? def.name.toUpperCase() : "CREATURE",
    NOUN: (def && def.press) || (Object.hasOwn(PRESS, id) ? PRESS[id] : "CREATURE"),
    PLACE: (state && PLACES[state.mission]) || (state && placeFromTerrain(state)) || "TOWN",
  };
  vars.TURNS = state ? state.turn : 0;
  let key = result.grade === "draw" ? `draw-${result.outcome === "withdrawn" ? "withdrawn" : "time"}` : result.grade;
  if (result.grade === "rampage") key = `rampage-${result.death || "withdrawn"}`;
  if (rivalGoal && result.outcome === "goal" && state.rival && state.rival.withdrawn) key += "-driven";
  const table = HEADLINES[key] || HEADLINES.defeat;
  const lines = (state && table[state.mission]) || table.any;
  return fill(pick(lines, state ? state.turn : 0, result.score ? result.score.total : 0), vars).toUpperCase();
}

function placeFromTerrain(state) {
  const hex = state.kaiju && state.map && state.map.hexes[state.kaiju.at];
  if (!hex) return null;
  if (TERRAIN[hex.terrain] && TERRAIN[hex.terrain].water) return "THE HARBOUR";
  return hex.structure ? "THE CITY" : null;
}

// ---------- the review ----------
// A 1981 games column about the game just played, drawn from the final state and every event.
// Variety comes from the events themselves, never the dice: the same game reads the same way.

export const MAGAZINE = "Cassette & Disk Monthly";
const MODEL = "Crush, Crumble and Chomp!";

const NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const TIMES = ["never", "once", "twice"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WRITERS = ["Hollis Varne", "Edith Marrable", "Owen Tasker", "R. J. Quillon", "Margery Stoat", "Ned Pellow"];

const STRUCTURE_WORDS = {
  low: ["low building", "low buildings"],
  mid: ["office block", "office blocks"],
  tower: ["tower", "towers"],
  pylon: ["pylon", "pylons"],
  plant: ["power plant", "power plants"],
  lab: ["research lab", "research labs"],
  leyline: ["ring of standing stones", "rings of standing stones"],
  bunker: ["command bunker", "command bunkers"],
  wall: ["stretch of fortress wall", "stretches of fortress wall"],
};

// Each mission's place, said four ways: in a sentence, in a title, where the monster goes on
// leaving, and what the dek says it does there.
const SETTINGS = {
  fortress: { place: "the Kessel range", title: "Kessel", away: "back down the valley", does: "climbs the Kessel valley" },
  swathe: { place: "Port Halloran", title: "Port Halloran", away: "back into the harbour", does: "comes ashore at Port Halloran" },
  coast: { place: "Gull Point", title: "Gull Point", away: "back into the sea", does: "comes ashore at Gull Point" },
  rampage: { place: "Port Halloran", title: "Port Halloran", away: "back into the harbour", does: "takes Port Halloran apart", idle: "comes ashore at Port Halloran" },
};
const SOMEWHERE = { place: "the map", title: "Town", away: "off the map", does: "goes to work" };

const TITLES = {
  cuts: ["A Thousand Cuts", "{Name} Against the Army", "The Army Always Wins"],
  sudden: ["Lights Out for {Name}", "Mind the Power Plant", "{Name} and the Grid"],
  lingering: ["The Slow Ray", "{Name} and the Mad Scientist", "A Lingering End"],
  withdrawn: ["{Name} Goes Home", "Hit and Run in {Place}", "{Name} Walks Away"],
  goal: ["{Name} Gets Its Way", "One Monster, One Job", "{Name} Takes {Place}"],
  time: ["Not Quite Enough", "The Clock Wins", "{Name} Runs Out of Night"],
  unfinished: ["{Name}, So Far"],
};

const RATINGS = {
  1: "The army will hardly need to file a report.",
  2: "The city will mend sooner than it fears.",
  3: "A solid night's work for a monster.",
  4: "A fine night's work. Show it to your friends.",
  5: "A rampage the papers will run for a week.",
};

const GRADE_STARS = { "total victory": 5, victory: 4, draw: 3 };

const numberWord = (n) => (n >= 0 && n < NUMBERS.length ? NUMBERS[n] : thousands(n));
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const timesWord = (n) => (n < TIMES.length ? TIMES[n] : `${numberWord(n)} times`);
const pluralOf = (noun) => (/[^aeiou]y$/.test(noun) ? `${noun.slice(0, -1)}ies` : `${noun}s`);
const words = (n, [one, many], the = false) => (n === 1 ? (the ? `the ${one}` : article(one)) : `${numberWord(n)} ${many}`);
// The one-of-a-kind structures a mission is built around take "the".
const unique = (type) => !!STRUCTURES[type] && STRUCTURES[type].objective;

function count(n, noun) {
  return `${numberWord(n)} ${n === 1 ? noun : pluralOf(noun)}`;
}

function listing(items) {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const structureWords = (type) => STRUCTURE_WORDS[type] || [structureNoun(type), pluralOf(structureNoun(type))];
const unitWords = (type) => [unitNoun(type), pluralOf(unitNoun(type))];
const attackWord = (name) => lower(name).replace(/^the /, "");
const tally = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);
// A table entry for a key read off the state, never an inherited name like "constructor".
const own = (table, key, fallback) => (Object.hasOwn(table, key) ? table[key] : fallback);

// Everything the column needs to know, read off the events in order.
function gather(events) {
  const f = {
    structures: new Map(), units: new Map(), crushed: 0, eaten: 0, best: null, uses: new Map(),
    harm: new Map(), harmers: new Map(), harmTotal: 0, rays: 0, broke: 0, berserk: 0, blast: null, radio: null, last: null, dealt: 0, reinforced: 0,
  };
  for (const e of events) {
    if (e.k !== "refuse" && e.text) f.last = e;
    if (e.k === "destroyed" && e.points > 0) tally(e.what === "structure" ? f.structures : f.units, e.type);
    // Only units are kills; the rules also raise crush and eat for structures.
    else if (e.k === "crush" && e.actor === "kaiju" && e.what === "unit") f.crushed += 1;
    else if (e.k === "eat" && e.actor === "kaiju" && e.what === "unit") f.eaten += 1;
    else if (e.k === "move" && e.teleport && e.actor === "kaiju") {
      // A teleport attack raises a move, not an attack, but it is still a use.
      const a = defOf(e.who, e.variant)?.attacks.find((x) => x.id === e.attack);
      if (a) tally(f.uses, a.name);
    }
    else if (e.k === "attack" && e.attacker.side === "kaiju") {
      // An area attack raises one event per victim; only the first of them is a use.
      if (e.first) tally(f.uses, e.attack.name);
      if (e.hit && e.damage > 0) {
        f.dealt += e.damage;
        if (!f.best || e.damage > f.best.damage) f.best = e;
      }
    } else if (e.k === "attack" && e.defender.side === "kaiju" && e.hit && e.damage > 0) {
      const who = e.attacker.side === "unit" ? e.attacker.type : "rival";
      tally(f.harm, who, e.damage);
      if (!f.harmers.has(who)) f.harmers.set(who, new Set());
      f.harmers.get(who).add(e.attacker.id);
      f.harmTotal += e.damage;
      if (e.attacker.type === "scientist") f.rays += 1;
    } else if (e.k === "blast" && e.actor === "kaiju") {
      f.blast = e;
      f.harmTotal += e.damage || 0;
    } else if (e.k === "hurt" && e.actor === "kaiju") f.harmTotal += e.damage;
    else if (e.k === "panic" && e.broke) f.broke += 1;
    else if (e.k === "berserk" && e.actor === "kaiju") f.berserk += 1;
    else if (e.k === "radio") f.radio = e;
    else if (e.k === "reinforce") f.reinforced += 1;
  }
  return f;
}

// The largest entry of a tally; ties to the first counted.
function top(map) {
  let out = null;
  for (const [key, n] of map) if (!out || n > out.n) out = { key, n };
  return out;
}

// How the game ended, as one word: a death, or an outcome, or "unfinished".
function endingOf(state) {
  const r = state.result;
  if (!r) return "unfinished";
  if (r.outcome === "fallen") return r.death || "cuts";
  return r.outcome;
}

function starsOf(state) {
  const r = state.result;
  if (!r) return 3;
  if (r.grade === "rampage") return r.stars;
  if (Object.hasOwn(GRADE_STARS, r.grade)) return GRADE_STARS[r.grade];
  return r.score.total > 500 ? 2 : 1;
}

function targetWord(state) {
  return state.objective && state.objective.type ? structureWords(state.objective.type)[0] : "objective";
}

function setupParagraph(state, v) {
  const k = state.kaiju;
  const def = kaijuDef(k.id, k.variant);
  const body = def.parts.body.name.toLowerCase();
  const spent = k.mutations.reduce((n, m) => n + MUTATIONS[m].cost, 0);
  const spare = BUDGET - spent;
  let muts = `with no mutations at all, so all ${count(BUDGET, "point")} went into its ${body}`;
  if (k.mutations.length) {
    muts = `with ${listing(k.mutations.map((m) => lower(MUTATIONS[m].name)))}`;
    if (spare > 0) muts += `, and ${count(spare, "point")} left over for its ${body}`;
  }
  const who = `${def.name}, ${def.epithet}`;
  const out = [
    v([
      `Anyone who played ${MODEL} will know the shape of this: one monster, one city, and an army that grows desperate.`,
      `The model is plainly ${MODEL}, and it shows in the best way: a monster, a city, and a great many people in its way.`,
      `This is a monster game in the line of ${MODEL}, played a turn at a time on a map of hexes, with the log doing most of the talking.`,
    ], 1),
    v([`I took ${who}, ${muts}.`, `My monster was ${who}, ${muts}.`, `I chose ${who}, ${muts}.`], 2),
  ];
  const o = state.objective;
  if (state.mission === "rampage") {
    out.push("The mission was Hex and the City: Port Halloran, no target, no clock, and an army that keeps coming.");
    out.push(`I played it under the ${o.name} rules. ${o.text}`);
  } else if (state.mission === "swathe") {
    out.push(`The mission was The Swathe: ashore at Port Halloran and across the city to the ${targetWord(state)}.`);
  } else if (state.mission === "fortress") {
    out.push("The mission was The Mountain Fortress: up a valley in the Kessel range to a command bunker behind a wall.");
  } else if (state.mission === "coast" && state.rival) {
    const r = kaijuDef(state.rival.id, state.rival.variant);
    out.push(`The mission was The Coast: Gull Point, one beach, and ${r.name}, ${r.epithet}, coming the other way.`);
  } else if (state.goal) {
    out.push(`The brief: ${lower(state.goal)}`);
  }
  const city = state.mission === "swathe" || state.mission === "rampage";
  out.push(city ? `The city grew from seed ${state.seed}, for anyone who wants the same streets.` : `The seed was ${state.seed}, for anyone who wants the same dice.`);
  return out.join(" ");
}

function blowTarget(e) {
  const d = e.defender;
  if (d.side === "unit") return article(unitNoun(d.type));
  if (d.side === "structure") return words(1, structureWords(d.type), unique(d.type));
  return `${kaijuName(d.type, d.variant)}'s ${partVars(d.type, d.variant, e.part).part}`;
}

function didParagraph(state, f, v) {
  const sCount = [...f.structures.values()].reduce((a, b) => a + b, 0);
  const uCount = [...f.units.values()].reduce((a, b) => a + b, 0);
  const out = [];
  if (!sCount && !uCount) {
    out.push(v(["It did very little. Not one building fell to it, and not one unit.", "Little came of it. The city lost nothing to speak of, and the army lost nobody."], 3));
  }
  if (sCount) {
    const byCount = [...f.structures].sort((a, b) => b[1] - a[1] || STRUCTURES[b[0]].points - STRUCTURES[a[0]].points);
    const list = listing(byCount.map(([type, n]) => words(n, structureWords(type), unique(type))));
    const lost = `The city lost ${count(sCount, "structure")} to it: ${list}.`;
    if (byCount.length === 1) out.push(`${cap(list)} came down.`);
    else out.push(sCount > 12 ? lost : v([`${cap(numberWord(sCount))} structures came down: ${list}.`, lost], 4));
    const tallest = byCount.map(([type]) => type).filter((t) => STRUCTURES[t].populated).sort((a, b) => STRUCTURES[b].height - STRUCTURES[a].height)[0];
    if (sCount > 1 && tallest && STRUCTURES[tallest].height >= 2) {
      const h = STRUCTURES[tallest].height;
      out.push(v([`The tallest was ${article(structureWords(tallest)[0])}, ${count(h, "storey")} of it.`, `The biggest thing it felled was ${article(structureWords(tallest)[0])}.`], 5));
    }
  }
  if (uCount) {
    const list = listing([...f.units].sort((a, b) => b[1] - a[1] || UNITS[b[0]].points - UNITS[a[0]].points).map(([type, n]) => words(n, unitWords(type))));
    out.push(f.units.size === 1 ? `The army lost ${list} to it.` : v([`It destroyed ${count(uCount, "unit")}: ${list}.`, `The army lost ${list}.`], 6));
  }
  const o = state.objective;
  if (o && o.kind === "none") {
    const none = (w) => w.all === 0 && Object.values(w).every((x) => !x);
    const rules = `the ${o.name} rules`;
    if (none(o.weights.structures) && none(o.weights.units) && (sCount || uCount)) out.push(`None of it counted under ${rules}, which pay only for time.`);
    else if (none(o.weights.structures) && sCount) out.push(`Under ${rules} the buildings counted for nothing.`);
    else if (none(o.weights.units) && uCount) out.push(`Under ${rules} the army counted for nothing.`);
  }
  if (f.crushed && f.eaten) {
    out.push(v([`Of its kills, ${numberWord(f.crushed)} went under its feet and ${numberWord(f.eaten)} into its mouth.`, `It walked over ${numberWord(f.crushed)} of its kills and ate ${numberWord(f.eaten)}.`], 7));
  } else if (f.crushed) {
    out.push(v([`Of its kills, ${numberWord(f.crushed)} went under its feet.`, `It walked over ${numberWord(f.crushed)} of its kills without breaking stride.`], 7));
  } else if (f.eaten) {
    out.push(`Of its kills, ${numberWord(f.eaten)} went into its mouth.`);
  }
  if (f.best) {
    const a = attackWord(f.best.attack.name);
    const t = blowTarget(f.best);
    out.push(v([
      `Its best blow was ${article(a)} on ${t}, for ${numberWord(f.best.damage)} damage, on turn ${f.best.turn}.`,
      `The hardest it hit anything was ${numberWord(f.best.damage)}, ${article(a)} on ${t} on turn ${f.best.turn}.`,
    ], 8));
  }
  const most = top(f.uses);
  if (most && most.n >= 2) {
    const a = attackWord(most.key);
    out.push(v([`It used its ${a} ${timesWord(most.n)}, more than anything else.`, `Its ${a} did most of the work, used ${timesWord(most.n)}.`], 9));
  }
  if (f.broke === 1) out.push("One unit broke and ran.");
  else if (f.broke) out.push(v([`Units broke and ran ${timesWord(f.broke)}.`, `The army lost its nerve ${timesWord(f.broke)}.`], 10));
  if (f.berserk) out.push(`${cap(timesWord(f.berserk))} hunger took the controls, and it went looking for food.`);
  return out.join(" ");
}

function stoppedParagraph(state, f, v) {
  const t = state.turn;
  const where = own(SETTINGS, state.mission, SOMEWHERE);
  const rival = state.rival ? kaijuName(state.rival.id, state.rival.variant) : "the rival";
  const out = [];
  const ending = endingOf(state);
  if (ending === "cuts") {
    out.push(v([
      "It died the death of a thousand cuts. No one shot did it; all of them did.",
      "In the end it was a thousand cuts, as it was always going to be.",
      "The army got it in the end, by a thousand cuts.",
    ], 11));
  } else if (ending === "sudden") {
    const what = f.blast ? structureWords(f.blast.type)[0] : "power plant";
    out.push(v([
      `It died the sudden death: ${article(what)} went up under it on turn ${f.blast ? f.blast.turn : t}.`,
      `It died the sudden death. It got too close to ${article(what)}, and the ${what} went up.`,
    ], 11));
  } else if (ending === "lingering") {
    out.push(v([
      `It died the lingering death. The mad scientist's ray found it ${timesWord(f.rays)}, and the paralysis did the rest.`,
      "It died the lingering death. A touch of the mad scientist's ray, and turn by turn it slowed until it stopped.",
    ], 11));
  } else if (ending === "withdrawn") {
    out.push(v([
      `On turn ${t} it walked ${where.away}, alive, which in this game is a kind of wisdom.`,
      `It left on turn ${t}, ${where.away}, before the army could finish the job.`,
    ], 11));
  } else if (ending === "goal") {
    if (state.objective.kind === "rival") {
      out.push(state.rival && state.rival.withdrawn ? `${rival} gave up the beach on turn ${t}, and that was the mission.` : `${rival} went down on turn ${t}, and that was the mission.`);
    } else {
      out.push(`The ${targetWord(state)} fell on turn ${t}, and that was the mission.`);
    }
    out.push(state.result.grade === "total victory" ? "It finished in good shape." : "It did not finish in good shape.");
  } else if (ending === "time") {
    const standing = state.objective.kind === "rival" ? `${rival} still on its feet` : `the ${targetWord(state)} still standing`;
    out.push(`The clock ran out on turn ${t} with ${standing}.`);
  } else {
    out.push(`I stopped on turn ${t} with the monster still on its feet.`);
  }
  const worst = top(f.harm);
  if (worst) {
    const many = f.harmers.get(worst.key).size > 1;
    const who = worst.key === "rival" ? rival : many ? `the ${unitWords(worst.key)[1]}` : `a single ${unitWords(worst.key)[0]}`;
    out.push(v([
      `${cap(who)} hurt it most: ${numberWord(worst.n)} of the ${numberWord(f.harmTotal)} points of damage it took.`,
      `Of the ${numberWord(f.harmTotal)} points of damage it took, ${who} dealt ${numberWord(worst.n)}.`,
    ], 12));
  } else if (!f.harmTotal) {
    out.push("Nothing the army fired at it did any harm.");
  }
  if (f.reinforced > 3) out.push(v([`The army fed in ${numberWord(f.reinforced)} more units as the night went on.`, `Reinforcements kept coming: ${count(f.reinforced, "unit")} in all.`], 15));
  else if (f.reinforced) out.push(`The army sent ${numberWord(f.reinforced)} more ${f.reinforced === 1 ? "unit" : "units"}.`);
  if (state.mission === "rampage" || ending === "cuts" || ending === "sudden" || ending === "lingering" || ending === "withdrawn") {
    const lasted = state.turnLimit ? `It lasted ${numberWord(t)} of the ${numberWord(state.turnLimit)} turns.` : `It lasted ${count(t, "turn")}.`;
    let verdict = "";
    if (!state.turnLimit) verdict = t < 8 ? " A short night." : t < 16 ? " A fair stretch." : ` A long night for ${where.place}.`;
    out.push(lasted + verdict);
  }
  return out.join(" ");
}

function verdictParagraph(state, f, quote, ratingText, v) {
  const out = [];
  if (quote && f.best) {
    out.push(v([
      `The log keeps a dry newsreel voice throughout, and it had the line of the night: "${quote}"`,
      `The game's own log put it best: "${quote}"`,
      `I will let the log have the last word on that blow: "${quote}"`,
    ], 13));
  } else if (quote && f.radio) {
    out.push(v([`The last word on the radio was the army's: "${quote}"`, `The radio had the last word: "${quote}"`], 13));
  } else if (quote) {
    out.push(`The log closed on this: "${quote}"`);
  }
  const r = state.result;
  if (r && r.grade === "rampage") out.push(`Under the ${state.objective.name} rules that came to ${thousands(r.score.total)} points.`);
  else if (r) out.push(`It scored ${thousands(r.score.total)}, ${article(r.grade)}.`);
  out.push(`Rating: ${ratingText}`);
  return out.join(" ");
}

// The review of a finished game: a pure function of the final state and every event, in order.
// One plain line under the copied review: the build and the setup, in the balance bot's own
// terms, so a playtest can be set up again. Outside the fiction, after a rule.
export function setupLine(state) {
  const k = state.kaiju;
  const build = k.mutations.length ? ` + ${k.mutations.join("+")}` : "";
  let mission = state.mission;
  if (state.target) mission += `:${state.target}`;
  if (state.objective && state.objective.kind === "none" && state.objective.id) mission += `:${state.objective.id}`;
  // A chosen rival is part of the setup; one left to chance is not, since choosing it skips a die.
  if (state.rival && !state.rivalByChance) mission += `:${state.rival.id}`;
  const chance = state.rival && state.rivalByChance ? ` (rival left to chance: ${state.rival.id})` : "";
  const who = k.variant ? `${k.id}:${k.variant}` : k.id;
  return `${TITLE} ${VERSION}. Setup: ${who}${build}, ${mission}, seed ${state.seed}${chance}.`;
}

export function review(state, events = []) {
  const f = gather(events);
  const k = state.kaiju;
  const name = kaijuName(k.id, k.variant);
  const where = own(SETTINGS, state.mission, SOMEWHERE);
  const ending = endingOf(state);
  const n = smallHash(`${state.seed}:${state.turn}:${events.length}:${f.dealt}:${f.crushed}:${f.eaten}:${f.harmTotal}`);
  const v = (lines, salt) => lines[(n + salt * 7) % lines.length];

  const stars = starsOf(state);
  const ratingText = `${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${RATINGS[stars]}`;
  const quote = f.best ? f.best.text : f.radio ? f.radio.text : f.last ? f.last.text : "";
  const title = fill(v(own(TITLES, ending, TITLES.unfinished), 0), { Name: name, Place: where.title });

  const ends = {
    cuts: `falls to a thousand cuts on turn ${state.turn}`,
    sudden: `dies the sudden death on turn ${state.turn}`,
    lingering: `dies the lingering death on turn ${state.turn}`,
    withdrawn: `walks away on turn ${state.turn}`,
    goal: `gets what it came for on turn ${state.turn}`,
    time: `runs out of time on turn ${state.turn}`,
    unfinished: `is still going on turn ${state.turn}`,
  };
  const idle = !f.structures.size && where.idle;
  const does = state.mission === "coast" && state.rival ? `meets ${kaijuName(state.rival.id, state.rival.variant)} at Gull Point` : idle || where.does;
  const rules = state.objective && state.objective.kind === "none" ? ` under the ${state.objective.name} rules` : "";
  const dek = `${name}, ${kaijuDef(k.id, k.variant).epithet}, ${does}${rules}, and ${own(ends, ending, ends.unfinished)}.`;
  const byline = `By ${v(WRITERS, 14)}`;
  const issue = `Issue ${20 + (state.seed % 40)}, ${MONTHS[(state.seed + state.turn) % 12]} ${1981 + (state.seed % 2)}`;

  const paragraphs = [
    setupParagraph(state, v),
    didParagraph(state, f, v),
    stoppedParagraph(state, f, v),
    verdictParagraph(state, f, quote, ratingText, v),
  ];
  const text = [`${MAGAZINE.toUpperCase()}. ${issue}.`, "", title, dek, byline, "", paragraphs.join("\n\n"), "", "---", setupLine(state)].join("\n");
  return { magazine: MAGAZINE, issue, title, dek, byline, paragraphs, quote, stars, ratingText, text };
}
