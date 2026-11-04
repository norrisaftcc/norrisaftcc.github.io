// Drawing helpers shared by the kaiju art and the variants' art. Plain string builders:
// they hold no state but the id counter, so a drawing is the same every time.

import { smooth, poly, limb, pt } from "./defs.js";

export const LINE = "#1b1712";
let seq = 0;
export const uid = (p) => `${p}${(++seq).toString(36)}`;

export const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
export const inked = (d, fill, w = 1.4) => `<path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round"/>`;
export const strokeOnly = (d, color, w, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
export const shift = (pts, dx, dy) => pts.map(([x, y, s]) => (s ? [x + dx, y + dy, s] : [x + dx, y + dy]));
export const clipped = (id, d, inner) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;

// Plates or spines along a back line: leaf shapes whose tips lean along the line.
export function spines(line, count, h0, h1, w, side = -1, lean = 0.35) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const f = t * (line.length - 1);
    const k = Math.min(line.length - 2, Math.floor(f));
    const u = f - k;
    const a = line[k], b = line[k + 1];
    const c = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len;
    const nx = side * -ty, ny = side * tx;
    const h = h0 + (h1 - h0) * t;
    const tip = [c[0] + nx * h + tx * h * lean, c[1] + ny * h + ty * h * lean, 1];
    out.push([
      [c[0] - tx * w, c[1] - ty * w, 1],
      [c[0] - tx * w * 0.6 + nx * h * 0.6, c[1] - ty * w * 0.6 + ny * h * 0.6],
      tip,
      [c[0] + tx * w * 0.7 + nx * h * 0.35, c[1] + ty * w * 0.7 + ny * h * 0.35],
      [c[0] + tx * w, c[1] + ty * w, 1],
    ]);
  }
  return out;
}

export function eyeball(x, y, r, slit = true, col = "#e8f03c", pupilColor = "#1b0a14") {
  const pupil = slit
    ? `<ellipse cx="${x}" cy="${y}" rx="${(r * 0.22).toFixed(2)}" ry="${(r * 0.8).toFixed(2)}" fill="${pupilColor}"/>`
    : `<circle cx="${x}" cy="${y}" r="${(r * 0.45).toFixed(2)}" fill="${pupilColor}"/>`;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="${LINE}" stroke-width="${Math.max(0.6, r / 5).toFixed(2)}"/>${pupil}`
    + `<circle cx="${(x - r * 0.35).toFixed(2)}" cy="${(y - r * 0.35).toFixed(2)}" r="${(r * 0.18).toFixed(2)}" fill="#fff"/>`;
}

export function scaleRows(x0, y0, x1, y1, s, color, w = 0.9) {
  let d = "";
  for (let y = y0, row = 0; y < y1; y += s * 0.7, row++) {
    for (let x = x0 + (row % 2) * s / 2; x < x1; x += s) d += `M${(x - s / 2).toFixed(1)} ${y.toFixed(1)}q${s / 2} ${(s * 0.7).toFixed(1)} ${s} 0`;
  }
  return strokeOnly(d, color, w);
}

export function suckers(centre, every, r, color) {
  let out = "";
  for (let i = 1; i < centre.length - 1; i += every) out += `<circle cx="${centre[i][0]}" cy="${centre[i][1]}" r="${r}" fill="${color}" stroke="${LINE}" stroke-width="0.5"/>`;
  return out;
}

export function facetsOf(ring, centre, colors) {
  return ring.map((a, i) => path(poly([a, ring[(i + 1) % ring.length], centre]), colors[i % colors.length])).join("");
}

export function star(x, y, r, color, w = 0.8) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return `<path d="${poly(pts)}" fill="${color}" stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round"/>`;
}
