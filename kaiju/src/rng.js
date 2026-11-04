// The dice: mulberry32, a port of hedge/rng.py. Same seed, same numbers, in Python and here.

const MASK = 0xffffffff;

export class Mulberry32 {
  constructor(seed = 0) {
    this.state = seed >>> 0;
  }

  nextU32() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
    t = (t ^ ((t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0)) >>> 0;
    return (t ^ (t >>> 14)) >>> 0;
  }

  // 1 to sides, one call per die.
  roll(sides) {
    return 1 + (this.nextU32() % sides);
  }

  // low to high, inclusive. One call.
  randint(low, high) {
    return low + (this.nextU32() % (high - low + 1));
  }
}

// The classroom rule: keep the digits, ignore the rest, 32 bits.
export function seedFromText(text) {
  let state = 0;
  for (const ch of String(text)) {
    if (ch >= "0" && ch <= "9") {
      state = ((state * 10 + ch.charCodeAt(0) - 48) & MASK) >>> 0;
    }
  }
  return state;
}
