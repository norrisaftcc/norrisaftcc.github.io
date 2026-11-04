// Shared SVG pieces for the art: the damage patterns, and small drawing helpers
// (smooth outlines, tapered limbs, seeded scribbles for cracks, scorch and sparks).

export const STATES = ["intact", "hurt", "bad", "crippled"];
export const PARTS = ["head", "arms", "body", "legs", "aux"];

// Fills for silhouette parts, by damage state. Pattern as well as colour, so damage
// reads without colour [UI-4]. Fallback colour after the url, for pages without DEFS.
export const STATE_FILL = {
  intact: "url(#pat-intact) #e6dab8",
  hurt: "url(#pat-hurt) #e9c46f",
  bad: "url(#pat-bad) #d9733a",
  crippled: "url(#pat-crippled) #2b201a",
};

export const DEFS = `<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false"><defs>`
  + `<pattern id="pat-intact" width="8" height="8" patternUnits="userSpaceOnUse">`
  + `<rect width="8" height="8" style="fill: var(--part-intact, #e6dab8)"/></pattern>`
  + `<pattern id="pat-hurt" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
  + `<rect width="6" height="6" style="fill: var(--part-hurt, #e9c46f)"/>`
  + `<line x1="1" y1="0" x2="1" y2="6" stroke="#1b1712" stroke-width="1.2" stroke-opacity="0.75"/></pattern>`
  + `<pattern id="pat-bad" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
  + `<rect width="5" height="5" style="fill: var(--part-bad, #d9733a)"/>`
  + `<path d="M1 0V5M0 1H5" stroke="#1b1712" stroke-width="1.3"/></pattern>`
  + `<pattern id="pat-crippled" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">`
  + `<rect width="12" height="12" style="fill: var(--part-crippled, #2b201a)"/>`
  + `<rect x="0" y="4.5" width="12" height="3" style="fill: var(--part-slash, #e2492b)"/></pattern>`
  + `</defs></svg>`;

const r1 = (n) => Math.round(n * 10) / 10;
export const pt = (p) => `${r1(p[0])},${r1(p[1])}`;

// A straight-edged closed path through points.
export function poly(pts) {
  return "M" + pts.map(pt).join("L") + "Z";
}

// A smooth path through points (Catmull-Rom as cubic Beziers). A point written
// [x, y, 1] is a sharp corner. Closed by default.
export function smooth(pts, closed = true, t = 1 / 6) {
  const n = pts.length;
  const at = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = "M" + pt(pts[0]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = p1[2] ? p1 : [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = p2[2] ? p2 : [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += "C" + pt(c1) + " " + pt(c2) + " " + pt(p2);
  }
  return closed ? d + "Z" : d;
}

// A tapered limb along a centre line: width w0 at the root, w1 at the tip.
// Returns the outline points (for smooth); the tip is a sharp point when w1 is 0.
export function limbPoints(centre, w0, w1) {
  const n = centre.length;
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = centre[Math.max(0, i - 1)], b = centre[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    const nx = -dy / len * w, ny = dx / len * w;
    left.push([centre[i][0] + nx, centre[i][1] + ny]);
    right.push([centre[i][0] - nx, centre[i][1] - ny]);
  }
  const tip = w1 === 0 ? [[...centre[n - 1], 1]] : [];
  return [...left.slice(0, w1 === 0 ? n - 1 : n), ...tip, ...right.slice(0, w1 === 0 ? n - 1 : n).reverse()];
}

export function limb(centre, w0, w1) {
  return smooth(limbPoints(centre, w0, w1));
}

// Seeded dice for drawing, so the same drawing comes out every time.
export function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function dice(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A jagged crack from x,y, with a branch or two.
export function crack(x, y, size, seed, color = "#120d0a") {
  const rnd = dice(hash(seed));
  const walk = (sx, sy, ang, len, steps) => {
    const pts = [[sx, sy]];
    let cx = sx, cy = sy;
    for (let i = 0; i < steps; i++) {
      ang += (rnd() - 0.5) * 1.6;
      cx += Math.cos(ang) * len / steps;
      cy += Math.sin(ang) * len / steps;
      pts.push([cx, cy]);
    }
    return pts;
  };
  const a0 = rnd() * Math.PI * 2;
  const main = walk(x, y, a0, size, 4);
  const back = walk(x, y, a0 + Math.PI, size * 0.7, 3);
  const mid = main[2];
  const branch = walk(mid[0], mid[1], a0 + (rnd() < 0.5 ? 1 : -1) * 0.9, size * 0.5, 2);
  const line = (pts, w) => `<path d="M${pts.map(pt).join("L")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return line([...back.reverse(), ...main.slice(1)], Math.max(0.8, size / 9)) + line(branch, Math.max(0.6, size / 14));
}

// A sooty blot.
export function scorch(x, y, r, seed) {
  const rnd = dice(hash(seed));
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rr = r * (0.65 + rnd() * 0.5);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]);
  }
  return `<path d="${smooth(pts)}" fill="#120d0a" fill-opacity="0.55"/>`
    + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.4)}" fill="#120d0a" fill-opacity="0.5"/>`;
}

// A spray of sparks.
export function sparks(x, y, size, seed) {
  const rnd = dice(hash(seed));
  let out = "";
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2;
    const l0 = size * 0.2, l1 = size * (0.55 + rnd() * 0.6);
    out += `<line x1="${r1(x + Math.cos(a) * l0)}" y1="${r1(y + Math.sin(a) * l0)}" x2="${r1(x + Math.cos(a) * l1)}" y2="${r1(y + Math.sin(a) * l1)}"/>`;
  }
  return `<g stroke="#ffd23a" stroke-width="${r1(Math.max(0.8, size / 10))}" stroke-linecap="round">${out}</g>`
    + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(size * 0.22)}" fill="#fff6c8"/>`;
}

// Damage marks for one part in one state, centred on an anchor [x, y, size].
export function damageMarks(state, anchor, seed) {
  if (!anchor || state === "intact" || !state) return "";
  const [x, y, s] = anchor;
  if (state === "hurt") return crack(x, y, s * 0.6, seed + "h", "#120d0a");
  if (state === "bad") return scorch(x + s * 0.15, y + s * 0.1, s * 0.45, seed + "s") + crack(x, y, s, seed + "b");
  return scorch(x, y, s * 0.65, seed + "s") + crack(x - s * 0.2, y, s * 1.2, seed + "c")
    + crack(x + s * 0.3, y + s * 0.2, s * 0.8, seed + "d") + sparks(x + s * 0.25, y - s * 0.2, s * 0.9, seed + "k");
}

// A pale rim around a figure, so dark monsters read on night backdrops and dark pages.
export function rimFilter(id, radius = 1.4) {
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="${radius}" result="grown"/>`
    + `<feFlood flood-color="#f4ecd4" flood-opacity="0.7"/><feComposite in2="grown" operator="in" result="rim"/>`
    + `<feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

export function damageLayer(parts, anchors, seed) {
  if (!parts) return "";
  return PARTS.map((p) => damageMarks(parts[p], anchors[p], seed + p)).join("");
}

export function stateOf(parts, part) {
  const s = parts && parts[part];
  return STATES.includes(s) ? s : "intact";
}
