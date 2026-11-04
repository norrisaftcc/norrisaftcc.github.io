// Axial hex arithmetic for pointy-top hexes. Keys are "q,r"; maps are written in odd-r offset (col, row).

export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const DIR_NAMES = ["east", "north-east", "north-west", "west", "south-west", "south-east"];

const SQRT3 = Math.sqrt(3);

export function key(q, r) {
  return `${q},${r}`;
}

export function parse(k) {
  const i = k.indexOf(",");
  return { q: Number(k.slice(0, i)), r: Number(k.slice(i + 1)) };
}

export function neighbor(k, d) {
  const { q, r } = parse(k);
  const [dq, dr] = DIRS[d];
  return key(q + dq, r + dr);
}

const NEIGHBORS = new Map();

// Six keys in DIRS order. Cached: the rules ask for the same hexes many times a phase.
export function neighbors(k) {
  let ns = NEIGHBORS.get(k);
  if (!ns) {
    const { q, r } = parse(k);
    ns = DIRS.map(([dq, dr]) => key(q + dq, r + dr));
    if (NEIGHBORS.size < 20000) NEIGHBORS.set(k, ns);
  }
  return ns.slice();
}

function axialDistance(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function distance(a, b) {
  const A = parse(a);
  const B = parse(b);
  return axialDistance(A.q, A.r, B.q, B.r);
}

function cubeRound(q, r, s) {
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return key(rq, rr);
}

// Keys from a to b inclusive: a cube lerp, nudged so lines along hex edges round one way.
export function line(a, b) {
  const A = parse(a);
  const B = parse(b);
  const n = axialDistance(A.q, A.r, B.q, B.r);
  if (n === 0) return [a];
  const aq = A.q + 1e-6;
  const ar = A.r + 1e-6;
  const as = -A.q - A.r - 2e-6;
  const bq = B.q + 1e-6;
  const br = B.r + 1e-6;
  const bs = -B.q - B.r - 2e-6;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(cubeRound(aq + (bq - aq) * t, ar + (br - ar) * t, as + (bs - as) * t));
  }
  return out;
}

// The DIRS direction nearest the bearing from a to b. Direction d points at d * 60 degrees,
// counter-clockwise from east. A bearing exactly between two directions goes to the lower
// index, except between 5 and 0, which goes to 5, so every direction owns one boundary.
export function directionTo(a, b) {
  const A = parse(a);
  const B = parse(b);
  const dq = B.q - A.q;
  const dr = B.r - A.r;
  if (dq === 0 && dr === 0) return 0;
  const x = SQRT3 * (dq + dr / 2);
  const y = -1.5 * dr;
  let deg = (Math.atan2(y, x) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  const d = Math.ceil((deg - 30) / 60 - 1e-9);
  return ((d % 6) + 6) % 6;
}

export function ray(k, d, n) {
  const out = [];
  let cur = k;
  for (let i = 0; i < n; i++) {
    cur = neighbor(cur, d);
    out.push(cur);
  }
  return out;
}

export function ring(k, n) {
  if (n === 0) return [k];
  const out = [];
  let cur = k;
  for (let i = 0; i < n; i++) cur = neighbor(cur, 4);
  for (let d = 0; d < 6; d++) {
    for (let i = 0; i < n; i++) {
      out.push(cur);
      cur = neighbor(cur, d);
    }
  }
  return out;
}

// Every key within n of k, k first, then ring by ring.
export function range(k, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(...ring(k, i));
  return out;
}

export function cone(k, d, n) {
  return range(k, n).filter((h) => h !== k && directionTo(k, h) === d);
}

export function offsetToKey(col, row) {
  return key(col - (row - (row & 1)) / 2, row);
}

export function keyToOffset(k) {
  const { q, r } = parse(k);
  return { col: q + (r - (r & 1)) / 2, row: r };
}

export function toPixel(k, size) {
  const { q, r } = parse(k);
  return { x: size * SQRT3 * (q + r / 2), y: size * 1.5 * r };
}

export function corners(x, y, size) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const rad = ((60 * i - 30) * Math.PI) / 180;
    out.push([x + size * Math.cos(rad), y + size * Math.sin(rad)]);
  }
  return out;
}

// Seen from the target, facing `facing`: does the attacker stand in its front or rear arc.
export function arc(facing, from, to) {
  const d = (directionTo(to, from) - facing + 6) % 6;
  return d >= 2 && d <= 4 ? "rear" : "front";
}
