// Terrain art: hex tiles and structures for the board, backdrops for the cutaway.
// Theme colours come from CSS custom properties (--t-<terrain>, --s-*, --sky-*), with fallbacks.

import { dice, hash, smooth, poly, crack } from "./defs.js";

export const TERRAIN_IDS = ["open", "road", "park", "forest", "shore", "water", "mountain", "rubble"];
export const STRUCTURE_IDS = ["low", "mid", "tower", "pylon", "plant", "lab", "leyline", "bunker", "wall"];

const T_FALLBACK = {
  open: "#d9cf9e", road: "#b7ae98", park: "#a9c27a", forest: "#6f9a5a",
  shore: "#9fcfc4", water: "#4f86a6", mountain: "#a4917a", rubble: "#b9a58c",
};
const S_FALLBACK = {
  face: "#ddd2b5", side: "#a99d80", roof: "#6f6656", glass: "#39495a", light: "#f2d36b", line: "#1b1712",
};
const SKY_FALLBACK = { top: "#e9c77c", mid: "#f1d99a", low: "#f6e8bf", sun: "#fff4d2", far: "#b9ad8f" };

const tv = (t) => `var(--t-${t}, ${T_FALLBACK[t] || T_FALLBACK.open})`;
const sv = (k) => `var(--s-${k}, ${S_FALLBACK[k]})`;
const skyv = (k) => (k === "far" ? `var(--far, ${SKY_FALLBACK.far})` : `var(--sky-${k}, ${SKY_FALLBACK[k]})`);
const DARK = "rgba(20,16,10,0.32)";
const DEEP = "rgba(20,16,10,0.5)";
const LIGHT = "rgba(255,255,255,0.38)";
const LINE = sv("line");

const f1 = (n) => Math.round(n * 10) / 10;
const fillS = (fill, w = 1, stroke = LINE) => `style="fill: ${fill}; stroke: ${stroke}" stroke-width="${w}" stroke-linejoin="round"`;
const shape = (d, fill, w = 1) => `<path d="${d}" ${fillS(fill, w)}/>`;
const plain = (d, fill, extra = "") => `<path d="${d}" style="fill: ${fill}"${extra}/>`;
const stroke = (d, color, w, extra = "") => `<path d="${d}" fill="none" style="stroke: ${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

export function hexCorners(size = 24) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return [size * Math.cos(a), size * Math.sin(a)];
  });
}

/* ------------------------------------------------------------------ */
/* Hex tiles */

function tree(x, y, r) {
  return `<circle cx="${f1(x)}" cy="${f1(y + r * 0.5)}" r="${f1(r)}" style="fill: ${DEEP}"/>`
    + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" style="fill: ${tv("forest")}; stroke: ${DEEP}" stroke-width="0.8"/>`
    + `<circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.3)}" r="${f1(r * 0.35)}" style="fill: ${LIGHT}"/>`;
}

function conifer(x, y, h) {
  const w = h * 0.42;
  return `<path d="M${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}L${f1(x - w)} ${f1(y)}Z" style="fill: ${DEEP}; stroke: rgba(20,16,10,0.6)" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path d="M${f1(x)} ${f1(y - h)}L${f1(x - w)} ${f1(y)}L${f1(x)} ${f1(y)}Z" style="fill: ${LIGHT}" opacity="0.5"/>`;
}

const TILE_DECOR = {
  open(k) {
    return stroke(`M${-9 * k} ${6 * k}l1 -3l1 3M${7 * k} ${-8 * k}l1 -3l1 3M${4 * k} ${10 * k}l1 -3l1 3M${-12 * k} ${-6 * k}l1 -3l1 3`, DARK, 0.9);
  },
  road(k) {
    const lane = [0, 60, 120].map((a) => {
      const r = (a * Math.PI) / 180, x = Math.cos(r) * 19 * k, y = Math.sin(r) * 19 * k;
      return `M${f1(-x)} ${f1(-y)}L${f1(x)} ${f1(y)}`;
    }).join("");
    return `<path d="${lane}" fill="none" style="stroke: ${LIGHT}" stroke-width="${f1(1.3 * k)}" stroke-dasharray="${f1(3.5 * k)} ${f1(3 * k)}"/>`
      + `<circle r="${f1(3.2 * k)}" style="fill: ${DARK}; stroke: ${LIGHT}" stroke-width="${f1(0.8 * k)}"/>`;
  },
  park(k) {
    return stroke(`M${-14 * k} ${8 * k}Q0 ${2 * k} ${14 * k} ${10 * k}`, LIGHT, 2.2 * k) + tree(-7 * k, -5 * k, 5 * k) + tree(8 * k, -2 * k, 4 * k) + tree(-1 * k, 12 * k, 3.5 * k);
  },
  forest(k) {
    return conifer(-8 * k, -2 * k, 12 * k) + conifer(6 * k, -6 * k, 13 * k) + conifer(-1 * k, 10 * k, 12 * k) + conifer(11 * k, 9 * k, 10 * k) + conifer(-13 * k, 12 * k, 9 * k);
  },
  shore(k) {
    return stroke(`M${-13 * k} ${-4 * k}q3 -3 6 0t6 0M${1 * k} ${6 * k}q3 -3 6 0t6 0M${-8 * k} ${12 * k}q3 -3 6 0`, LIGHT, 1.4 * k)
      + `<circle cx="${8 * k}" cy="${-10 * k}" r="${f1(0.9 * k)}" style="fill: ${DARK}"/><circle cx="${-4 * k}" cy="${-13 * k}" r="${f1(0.8 * k)}" style="fill: ${DARK}"/>`;
  },
  water(k) {
    return stroke(`M${-15 * k} ${-6 * k}q3.5 -3 7 0t7 0t7 0M${-8 * k} ${4 * k}q3.5 -3 7 0t7 0t7 0M${-14 * k} ${13 * k}q3.5 -3 7 0t7 0`, LIGHT, 1.5 * k)
      + stroke(`M${-11 * k} ${-1 * k}q3.5 -3 7 0M${6 * k} ${9 * k}q3.5 -3 7 0`, DARK, 1 * k);
  },
  mountain(k) {
    const peak = (x, y, h, w) => `<path d="M${f1(x - w)} ${f1(y)}L${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}Z" style="fill: ${DARK}; stroke: rgba(20,16,10,0.65)" stroke-width="${f1(0.9 * k)}" stroke-linejoin="round"/>`
      + `<path d="M${f1(x)} ${f1(y - h)}L${f1(x - w)} ${f1(y)}L${f1(x - w * 0.15)} ${f1(y)}Z" style="fill: ${LIGHT}"/>`
      + `<path d="M${f1(x - w * 0.3)} ${f1(y - h * 0.7)}L${f1(x)} ${f1(y - h)}L${f1(x + w * 0.3)} ${f1(y - h * 0.7)}L${f1(x + w * 0.1)} ${f1(y - h * 0.62)}Z" style="fill: rgba(255,255,255,0.75)"/>`;
    return peak(-6 * k, 8 * k, 20 * k, 11 * k) + peak(8 * k, 12 * k, 14 * k, 9 * k);
  },
  rubble(k) {
    const rnd = dice(hash("rubble"));
    let out = "";
    for (let i = 0; i < 7; i++) {
      const x = (rnd() - 0.5) * 26 * k, y = (rnd() - 0.5) * 26 * k, s = (2 + rnd() * 3) * k;
      out += `<path d="${poly([[x - s, y + s * 0.6], [x - s * 0.3, y - s * 0.8], [x + s, y - s * 0.2], [x + s * 0.6, y + s * 0.7]])}" style="fill: ${i % 2 ? DARK : LIGHT}; stroke: rgba(20,16,10,0.55)" stroke-width="0.7"/>`;
    }
    return out + stroke(`M${-4 * k} ${-2 * k}l6 2M${3 * k} ${8 * k}l5 -3`, DEEP, 1.4 * k);
  },
};

export function hexTile(terrain, size = 24) {
  const t = TILE_DECOR[terrain] ? terrain : "open";
  const k = size / 24;
  return `<g class="hex-tile" data-terrain="${t}"><path d="${poly(hexCorners(size))}" style="fill: ${tv(t)}; stroke: var(--t-edge, #8d8268)" stroke-width="${f1(0.9 * k)}" stroke-linejoin="round"/>`
    + TILE_DECOR[t](k) + `</g>`;
}

/* ------------------------------------------------------------------ */
/* Structures, drawn in a light oblique view inside a hex of size 24. */

// A block: front face, side face, roof. With broken set, the top is jagged and the roof gone.
function block(x, base, w, h, d, { windows = true, broken = false, seed = "b", roof = sv("roof") } = {}) {
  const dy = d * 0.6;
  let top = [[x, base - h], [x + w, base - h]];
  if (broken) {
    const rnd = dice(hash(seed));
    top = [[x, base - h * (0.55 + rnd() * 0.2)]];
    const n = 4;
    for (let i = 1; i < n; i++) top.push([x + (w * i) / n, base - h * (i % 2 ? 0.75 + rnd() * 0.2 : 0.45 + rnd() * 0.2)]);
    top.push([x + w, base - h * (0.6 + rnd() * 0.2)]);
  }
  const front = [[x, base], [x + w, base], ...top.slice().reverse()];
  const rt = top[top.length - 1];
  const side = [[x + w, base], [x + w + d, base - dy], [x + w + d, rt[1] - dy + (broken ? 3 : 0)], rt];
  let out = shape(poly(side), sv("side"), 0.9) + shape(poly(front), sv("face"), 0.9);
  if (!broken) out += shape(poly([[x, base - h], [x + w, base - h], [x + w + d, base - h - dy], [x + d, base - h - dy]]), roof, 0.9);
  if (windows) {
    const cols = Math.max(1, Math.floor(w / 4.5)), rows = Math.max(1, Math.floor(h / 6));
    const cw = w / cols;
    const rnd = dice(hash(seed + "w"));
    for (let r = 0; r < rows; r++) {
      const wy = base - h + 3 + r * ((h - 4) / rows);
      if (broken && wy < base - h * 0.5) continue;
      for (let c = 0; c < cols; c++) {
        const lit = rnd() < 0.3;
        out += `<rect x="${f1(x + c * cw + cw * 0.25)}" y="${f1(wy)}" width="${f1(cw * 0.5)}" height="${f1(Math.min(3, (h - 4) / rows * 0.55))}" style="fill: ${lit ? sv("light") : sv("glass")}"/>`;
      }
    }
  }
  return out;
}

function smoke(x, y, s, seed) {
  const rnd = dice(hash(seed));
  let out = "";
  for (let i = 0; i < 3; i++) {
    out += `<circle cx="${f1(x + (rnd() - 0.5) * 4 * s + i * 1.5 * s)}" cy="${f1(y - i * 4 * s)}" r="${f1((2.4 + i * 0.9) * s)}" style="fill: rgba(60,54,48,${(0.75 - i * 0.18).toFixed(2)})"/>`;
  }
  return out;
}

function chunks(x, y, w, seed) {
  const rnd = dice(hash(seed));
  let out = "";
  for (let i = 0; i < 5; i++) {
    const cx = x + rnd() * w, s = 1.5 + rnd() * 2;
    out += `<path d="${poly([[cx - s, y], [cx - s * 0.2, y - s * 1.2], [cx + s, y - s * 0.3], [cx + s * 0.6, y + 0.6]])}" ${fillS(i % 2 ? sv("side") : sv("face"), 0.7)}/>`;
  }
  return out;
}

const STRUCT = {
  low(h, dmg) {
    const ht = 9 + (h - 1) * 8;
    return block(-16, 8, 15, ht, 4, { broken: dmg, seed: "low1" }) + block(0, 14, 14, ht - 2, 4, { broken: dmg, seed: "low2" });
  },
  mid(h, dmg) {
    const ht = 13 + (h - 1) * 7;
    return block(-12, 13, 18, ht, 6, { broken: dmg, seed: "mid" });
  },
  tower(h, dmg) {
    const ht = 14 + (h - 1) * 8;
    return block(-8, 13, 12, ht, 6, { broken: dmg, seed: "tower" })
      + (dmg ? "" : stroke(`M1 ${13 - ht - 4}v-6`, LINE, 1) + `<circle cx="1" cy="${13 - ht - 10}" r="1.2" style="fill: #e2492b"/>`);
  },
  pylon(h, dmg) {
    const lean = dmg ? ` transform="rotate(14 0 12)"` : "";
    return `<g${lean}>` + stroke("M-7 12L-1.5 -16M7 12L1.5 -16M-6 6L5 0M6 6L-5 0M-4 -2L3 -8M4 -2L-3 -8", LINE, 1.3)
      + stroke("M-10 -10H10M-7 -15H7", LINE, 1.6)
      + `<circle cx="-10" cy="-8.5" r="1.2" style="fill: ${sv("light")}"/><circle cx="10" cy="-8.5" r="1.2" style="fill: ${sv("light")}"/></g>`
      + stroke("M-20 -5Q-15 -3 -10 -9M10 -9Q15 -3 20 -5", LINE, 0.6, ` opacity="0.7"`);
  },
  plant(h, dmg) {
    const tower = shape("M-15 12C-13 4 -13 -2 -11 -10H-1C1 -2 1 4 3 12Z", sv("face"), 1)
      + stroke("M-13 -2H1", sv("side"), 1.2) + plain("M-9 12C-8 4 -8 -2 -6 -10H-1C1 -2 1 4 3 12Z", "rgba(20,16,10,0.18)");
    const steam = dmg ? "" : `<circle cx="-6" cy="-14" r="4" style="fill: ${LIGHT}"/><circle cx="-2" cy="-18" r="3" style="fill: ${LIGHT}"/>`;
    return tower + steam + block(2, 14, 12, 9, 4, { broken: dmg, seed: "plant", windows: false })
      + `<path d="M5 9h6l-3 -5z" style="fill: #f2c230; stroke: ${LINE}" stroke-width="0.7"/>`
      + shape(`M10 ${dmg ? 2 : -12}h3v${dmg ? 4 : 18}h-3z`, sv("side"), 0.8);
  },
  lab(h, dmg) {
    return block(-15, 12, 22, 9, 5, { broken: dmg, seed: "lab" })
      + (dmg ? shape("M-8 3a7 7 0 0 1 8 -6l-2 4l3 2z", sv("face"), 1)
        : shape("M-12 3a8 8 0 0 1 16 0z", sv("face"), 1) + plain("M-4 -5v8h-2v-8z", sv("glass")) + stroke("M-9 -1a5 5 0 0 1 3 -3", LIGHT, 1.2))
      + stroke(`M9 3V-12`, LINE, 1) + stroke("M6 -12l3 -3l3 3", LINE, 1);
  },
  leyline(h, dmg) {
    const glow = dmg ? "" : `<ellipse cx="0" cy="3" rx="15" ry="7" style="fill: none; stroke: #b98cff" stroke-width="2.4" opacity="0.8"/>`
      + stroke("M-20 6L20 0M-4 -10L4 16", "#b98cff", 1.2, ` opacity="0.7"`);
    const stones = [[-13, 2], [-6, -3], [4, -3], [12, 2], [6, 9], [-6, 9]];
    let out = glow;
    stones.forEach(([x, y], i) => {
      const fallen = dmg && i % 2 === 0;
      out += fallen
        ? shape(`M${x - 4} ${y + 2}h8v-3h-8z`, sv("side"), 0.8)
        : shape(`M${x - 2} ${y + 2}V${y - 7}l2 -1.5l2 1.5V${y + 2}Z`, sv("face"), 0.8);
    });
    return out;
  },
  bunker(h, dmg) {
    return shape("M-17 12L-13 0H13L17 12Z", sv("side"), 1)
      + shape(dmg ? "M-12 0L-10 -6L-4 -4L0 -9L5 -5L10 -7L12 0Z" : "M-12 0L-9 -8H9L12 0Z", sv("face"), 1)
      + (dmg ? "" : plain("M-6 -4h12v2h-12z", sv("line")))
      + stroke("M7 -8V-15M5 -15h4", LINE, 1)
      + stroke("M-15 9q2 -2 4 0q2 -2 4 0q2 -2 4 0q2 -2 4 0q2 -2 4 0q2 -2 4 0q2 -2 4 0", "rgba(20,16,10,0.4)", 0.8);
  },
  wall(h, dmg) {
    const top = -6 - (h - 1) * 3;
    let crenels = "";
    for (let x = -20; x < 20; x += 8) crenels += `h4v-4h4v4`;
    const front = dmg
      ? `M-21 12V${top + 4}l6 3l5 -6l6 7l7 -4l5 5l6 -3l7 4V12Z`
      : `M-21 12V${top}${crenels.replace(/h4v4$/, "")}h1V12Z`;
    return `<g transform="scale(0.84) translate(0,2)">` + shape(`M-21 12l3 -3V${top - 2}l-3 2Z`, sv("side"), 0.8)
      + shape(front, sv("face"), 1)
      + stroke(`M-21 ${top + 7}H21M-21 ${top + 13}H21M-12 ${top}V${top + 7}M2 ${top}V${top + 7}M-5 ${top + 7}V${top + 13}M10 ${top + 7}V${top + 13}`, "rgba(20,16,10,0.35)", 0.8)
      + plain(`M-2 ${top + 15}h5v2h-5z`, sv("line")) + `</g>`;
  },
};

export function structure(type, height, { damaged = false } = {}) {
  const draw = STRUCT[type];
  if (!draw) throw new Error(`no art for structure ${type}`);
  const h = Math.max(1, Math.min(3, Math.round(height) || 1));
  let out = draw(h, damaged);
  if (damaged) out += chunks(-14, 15, 26, type) + smoke(5, -6, 1, type) + crack(-4, 4, 7, type, "rgba(20,16,10,0.8)");
  return `<g class="structure${damaged ? " damaged" : ""}" data-structure="${type}">${out}</g>`;
}

/* ------------------------------------------------------------------ */
/* Backdrops for the cutaway: 400 x 240, horizon near y 150. */

const HORIZON = 150;

function sky() {
  return `<rect width="400" height="240" style="fill: ${skyv("top")}"/>`
    + `<rect y="60" width="400" height="50" style="fill: ${skyv("mid")}"/>`
    + `<rect y="110" width="400" height="${HORIZON - 110 + 2}" style="fill: ${skyv("low")}"/>`
    + `<circle cx="310" cy="58" r="26" style="fill: ${skyv("sun")}"/>`
    + `<path d="M0 60H400M0 110H400" style="stroke: ${skyv("sun")}" stroke-width="1.2" opacity="0.5"/>`;
}

function ground(t, top = HORIZON) {
  return `<rect y="${top}" width="400" height="${240 - top}" style="fill: ${tv(t)}"/>`
    + `<rect y="${top}" width="400" height="3" style="fill: ${DARK}"/>`
    + `<rect y="${top + 60}" width="400" height="${240 - top - 60}" style="fill: rgba(20,16,10,0.12)"/>`;
}

function hills(y, amp, seed, fill) {
  const rnd = dice(hash(seed));
  const pts = [[-10, 240, 1], [-10, y]];
  for (let x = 0; x <= 410; x += 50) pts.push([x, y - rnd() * amp]);
  pts.push([410, 240, 1]);
  return plain(smooth(pts), fill);
}

function peaks(y, seed, fill, snow = true, big = 1) {
  const rnd = dice(hash(seed));
  let out = "";
  for (let x = -40; x < 440; x += 70 + rnd() * 40) {
    const h = (50 + rnd() * 50) * big, w = (50 + rnd() * 30) * big;
    out += plain(`M${f1(x - w)} ${y}L${f1(x)} ${f1(y - h)}L${f1(x + w)} ${y}Z`, fill);
    out += plain(`M${f1(x)} ${f1(y - h)}L${f1(x + w)} ${y}L${f1(x + w * 0.2)} ${y}Z`, "rgba(20,16,10,0.18)");
    if (snow) out += plain(`M${f1(x - w * 0.28)} ${f1(y - h * 0.72)}L${f1(x)} ${f1(y - h)}L${f1(x + w * 0.28)} ${f1(y - h * 0.72)}L${f1(x + w * 0.08)} ${f1(y - h * 0.64)}L${f1(x - w * 0.08)} ${f1(y - h * 0.74)}Z`, "rgba(255,255,255,0.8)");
  }
  return out;
}

function skyline(y, seed, { count = 14, minH = 20, maxH = 70, fill = skyv("far"), lit = 0.25, wmin = 18, wmax = 34, broken = false } = {}) {
  const rnd = dice(hash(seed));
  let out = "", x = -10;
  for (let i = 0; i < count && x < 410; i++) {
    const w = wmin + rnd() * (wmax - wmin), h = minH + rnd() * (maxH - minH);
    const roofline = broken ? `l${f1(w * 0.2)} 7l${f1(w * 0.25)} -10l${f1(w * 0.2)} 6l${f1(w * 0.35)} -4` : `h${f1(w)}`;
    out += plain(`M${f1(x)} ${y}V${f1(y - h)}${roofline}V${y}Z`, fill);
    if (rnd() < 0.3) out += stroke(`M${f1(x + w / 2)} ${f1(y - h)}v-10`, fill, 1.5);
    for (let wy = y - h + 6; wy < y - 6; wy += 8) {
      for (let wx = x + 4; wx < x + w - 4; wx += 7) {
        if (rnd() < lit) out += `<rect x="${f1(wx)}" y="${f1(wy)}" width="3" height="4" style="fill: ${sv("light")}"/>`;
      }
    }
    x += w + rnd() * 6;
  }
  return out;
}

function tufts(seed, n = 18, top = HORIZON + 10) {
  const rnd = dice(hash(seed));
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = rnd() * 400, y = top + rnd() * (230 - top);
    d += `M${f1(x)} ${f1(y)}l2 -5l2 5l2 -4`;
  }
  return stroke(d, DARK, 1.2);
}

function roundTree(x, y, r) {
  return stroke(`M${x} ${y}v${f1(r * 1.2)}`, DEEP, f1(r * 0.25))
    + `<circle cx="${x}" cy="${f1(y - r * 0.2)}" r="${r}" style="fill: ${tv("forest")}; stroke: ${DEEP}" stroke-width="1"/>`
    + `<circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.5)}" r="${f1(r * 0.35)}" style="fill: ${LIGHT}"/>`;
}

function pine(x, y, h, fill = tv("forest")) {
  const w = h * 0.36;
  return `<path d="M${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}H${f1(x - w)}Z" style="fill: ${fill}; stroke: ${DEEP}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="M${f1(x)} ${f1(y - h)}L${f1(x - w)} ${f1(y)}H${f1(x)}Z" style="fill: rgba(20,16,10,0.2)"/>`;
}

function waves(top, bottom, seed, color = LIGHT) {
  const rnd = dice(hash(seed));
  let d = "";
  for (let y = top + 8; y < bottom; y += 14) {
    for (let i = 0; i < 6; i++) {
      const x = rnd() * 400, w = 10 + (y - top) * 0.2;
      d += `M${f1(x)} ${f1(y)}q${f1(w / 2)} -4 ${f1(w)} 0`;
    }
  }
  return stroke(d, color, 1.6);
}

function pylonAt(x, y, s) {
  return stroke(`M${f1(x - 6 * s)} ${y}L${f1(x)} ${f1(y - 40 * s)}L${f1(x + 6 * s)} ${y}M${f1(x - 10 * s)} ${f1(y - 32 * s)}H${f1(x + 10 * s)}M${f1(x - 7 * s)} ${f1(y - 24 * s)}H${f1(x + 7 * s)}M${f1(x - 4 * s)} ${f1(y - 12 * s)}L${f1(x + 4 * s)} ${f1(y - 20 * s)}`, LINE, f1(1.6 * s));
}

function coolingTower(x, y, s) {
  return shape(`M${f1(x - 20 * s)} ${y}C${f1(x - 14 * s)} ${f1(y - 25 * s)} ${f1(x - 14 * s)} ${f1(y - 40 * s)} ${f1(x - 12 * s)} ${f1(y - 55 * s)}H${f1(x + 12 * s)}C${f1(x + 14 * s)} ${f1(y - 40 * s)} ${f1(x + 14 * s)} ${f1(y - 25 * s)} ${f1(x + 20 * s)} ${y}Z`, sv("face"), 1.4)
    + plain(`M${f1(x + 2 * s)} ${y}C${f1(x + 5 * s)} ${f1(y - 25 * s)} ${f1(x + 5 * s)} ${f1(y - 40 * s)} ${f1(x + 4 * s)} ${f1(y - 55 * s)}H${f1(x + 12 * s)}C${f1(x + 14 * s)} ${f1(y - 40 * s)} ${f1(x + 14 * s)} ${f1(y - 25 * s)} ${f1(x + 20 * s)} ${y}Z`, "rgba(20,16,10,0.18)")
    + stroke(`M${f1(x - 14 * s)} ${f1(y - 30 * s)}H${f1(x + 14 * s)}`, sv("side"), f1(2 * s))
    + `<circle cx="${f1(x - 4 * s)}" cy="${f1(y - 64 * s)}" r="${f1(12 * s)}" style="fill: ${LIGHT}"/><circle cx="${f1(x + 8 * s)}" cy="${f1(y - 74 * s)}" r="${f1(9 * s)}" style="fill: ${LIGHT}"/>`
    + `<circle cx="${f1(x + 18 * s)}" cy="${f1(y - 86 * s)}" r="${f1(7 * s)}" style="fill: ${LIGHT}"/>`;
}

const SCENES = {
  open: () => [hills(HORIZON, 26, "open-h", skyv("far")), ground("open") + tufts("open-t")
    + stroke("M0 186H400M30 176v18M110 176v18M190 176v18M270 176v18M350 176v18M0 180H400", DEEP, 2)],
  road: () => [skyline(HORIZON, "road-s", { maxH: 40, lit: 0.1 }), ground("open")
    + plain(`M176 ${HORIZON}H224L330 240H70Z`, tv("road"))
    + stroke(`M200 ${HORIZON + 6}V160M200 172V186M200 200V222`, LIGHT, 3)
    + stroke(`M176 ${HORIZON}L70 240M224 ${HORIZON}L330 240`, DARK, 2)
    + pylonAt(120, 196, 1.1) + pylonAt(300, 196, 1.1) + stroke("M60 158Q120 168 168 160M232 160Q290 168 360 158", LINE, 0.8)],
  park: () => [hills(HORIZON, 10, "park-h", skyv("far")), ground("park")
    + [30, 70, 120, 280, 330, 375].map((x, i) => roundTree(x, HORIZON + 2, 16 + (i % 3) * 4)).join("")
    + stroke("M150 240Q200 190 260 152", LIGHT, 14) + stroke("M150 240Q200 190 260 152", DARK, 1)
    + stroke("M330 200V160M322 160h16", LINE, 2) + `<circle cx="330" cy="156" r="4" style="fill: ${sv("light")}; stroke: ${LINE}" stroke-width="1"/>`],
  forest: () => [[...Array(14)].map((_, i) => pine(i * 31 - 6, HORIZON + 4, 50 + (i % 3) * 14, skyv("far"))).join(""), ground("forest")
    + [...Array(9)].map((_, i) => pine(i * 50 + 10, 200 + (i % 2) * 14, 70 + (i % 3) * 16)).join("")],
  shore: () => ["", `<rect y="${HORIZON - 14}" width="400" height="40" style="fill: ${tv("water")}"/>` + waves(HORIZON - 14, HORIZON + 26, "shore-w")
    + plain(`M0 ${HORIZON + 26}Q120 ${HORIZON + 14} 240 ${HORIZON + 28}T400 ${HORIZON + 22}V240H0Z`, tv("shore"))
    + stroke(`M0 ${HORIZON + 26}Q120 ${HORIZON + 14} 240 ${HORIZON + 28}T400 ${HORIZON + 22}`, LIGHT, 3)
    + plain(`M0 196Q140 186 260 200T400 190V240H0Z`, tv("open")) + tufts("shore-t", 8, 200)],
  water: () => ["", `<rect y="${HORIZON - 10}" width="400" height="${250 - HORIZON}" style="fill: ${tv("water")}"/>`
    + `<rect y="${HORIZON + 50}" width="400" height="60" style="fill: rgba(20,16,10,0.15)"/>`
    + waves(HORIZON - 10, 236, "water-w")
    + shape(`M52 ${HORIZON - 10}l4 6h24l5 -6z`, sv("side"), 1) + stroke(`M66 ${HORIZON - 10}v-12l8 9`, LINE, 1.2)],
  mountain: () => [peaks(HORIZON, "mtn-far", skyv("far"), true, 1.1), ground("mountain")
    + peaks(HORIZON + 30, "mtn-near", tv("mountain"), false, 0.6) + plain(`M0 ${HORIZON + 30}H400V240H0Z`, tv("mountain"))
    + stroke("M40 200l18 -6l12 8M220 214l14 -8l16 4M320 190l10 -4l8 6", DEEP, 2)],
  rubble: () => [skyline(HORIZON, "rubble-s", { maxH: 60, lit: 0.04, broken: true })
    + `<circle cx="120" cy="80" r="22" style="fill: rgba(60,54,48,0.45)"/><circle cx="140" cy="56" r="16" style="fill: rgba(60,54,48,0.35)"/>`,
    ground("rubble") + [...Array(10)].map((_, i) => {
      const x = i * 42 + 6, y = 190 + (i % 3) * 14;
      return shape(`M${x} ${y}l10 -14l8 6l12 -4l6 12z`, i % 2 ? sv("side") : sv("face"), 1);
    }).join("")],
};

const STRUCT_SCENES = {
  low: () => skyline(HORIZON, "low-c", { maxH: 34, minH: 14, wmin: 26, wmax: 44, lit: 0.3 }),
  mid: () => skyline(HORIZON, "mid-f", { maxH: 80, lit: 0.1 }) + skyline(HORIZON + 2, "mid-c", { maxH: 60, minH: 30, fill: sv("side"), lit: 0.3, count: 10 }),
  tower: () => skyline(HORIZON, "tower-f", { maxH: 110, minH: 50, lit: 0.1 }) + skyline(HORIZON + 2, "tower-c", { maxH: 130, minH: 70, fill: sv("side"), lit: 0.35, count: 8, wmin: 26, wmax: 40 }),
  pylon: () => [60, 160, 260, 360].map((x, i) => pylonAt(x, HORIZON + 4 + i * 2, 1.4 - i * 0.15)).join("")
    + stroke(`M0 ${HORIZON - 40}Q30 ${HORIZON - 30} 60 ${HORIZON - 42}T160 ${HORIZON - 36}T260 ${HORIZON - 28}T360 ${HORIZON - 26}T420 ${HORIZON - 20}`, LINE, 0.8),
  plant: () => coolingTower(90, HORIZON + 2, 1.3) + coolingTower(160, HORIZON + 2, 1.1)
    + shape(`M220 ${HORIZON + 2}V${HORIZON - 40}h70V${HORIZON + 2}Z`, sv("face"), 1.4)
    + shape(`M300 ${HORIZON + 2}V${HORIZON - 96}h8V${HORIZON + 2}Z`, sv("side"), 1.2)
    + stroke(`M300 ${HORIZON - 80}h8M300 ${HORIZON - 70}h8`, "#c8392b", 3)
    + shape(`M246 ${HORIZON - 26}l9 -16l9 16z`, "#f2c230", 1.2) + pylonAt(350, HORIZON + 4, 1.2),
  lab: () => shape(`M120 ${HORIZON + 2}V${HORIZON - 34}H300V${HORIZON + 2}Z`, sv("face"), 1.4)
    + [...Array(8)].map((_, i) => `<rect x="${130 + i * 21}" y="${HORIZON - 24}" width="10" height="8" style="fill: ${i % 3 ? sv("glass") : sv("light")}"/>`).join("")
    + shape(`M170 ${HORIZON - 34}a40 40 0 0 1 80 0z`, sv("face"), 1.4)
    + plain(`M206 ${HORIZON - 72}v38h8v-38z`, sv("glass"))
    + stroke(`M180 ${HORIZON - 50}a30 30 0 0 1 14 -14`, LIGHT, 3)
    + stroke(`M280 ${HORIZON - 34}V${HORIZON - 100}M272 ${HORIZON - 100}h16M274 ${HORIZON - 88}h12`, LINE, 2)
    + stroke(`M282 ${HORIZON - 104}l8 -10l-4 0l8 -12`, "#7ff0ff", 2.4),
  leyline: () => hills(HORIZON, 8, "ley-h", skyv("far"))
    + stroke("M0 70Q100 40 200 72T400 60", "#b98cff", 6, ` opacity="0.35"`) + stroke("M0 70Q100 40 200 72T400 60", "#b98cff", 2, ` opacity="0.7"`)
    + [100, 140, 180, 220, 260, 300].map((x, i) => shape(`M${x - 9} ${HORIZON + 2}V${HORIZON - 34 - (i % 2) * 10}l9 -6l9 6V${HORIZON + 2}Z`, sv("face"), 1.4)
      + plain(`M${x + 2} ${HORIZON + 2}V${HORIZON - 34 - (i % 2) * 10}l7 -2V${HORIZON + 2}Z`, "rgba(20,16,10,0.2)")).join("")
    + shape(`M128 ${HORIZON - 44}H272V${HORIZON - 36}H128Z`, sv("side"), 1.2)
    + `<ellipse cx="200" cy="${HORIZON + 6}" rx="120" ry="10" style="fill: none; stroke: #b98cff" stroke-width="2" opacity="0.7"/>`,
  bunker: () => [peaks(HORIZON, "fort-m", skyv("far"), true, 1.1) + fortress(), bunkerFront()],
  wall: () => peaks(HORIZON, "fort-m", skyv("far"), true, 1.1) + fortress(),
};

function bunkerFront() {
  return shape(`M120 ${HORIZON + 34}L144 ${HORIZON + 4}H256L280 ${HORIZON + 34}Z`, sv("side"), 1.6)
    + shape(`M144 ${HORIZON + 4}L150 ${HORIZON - 4}H250L256 ${HORIZON + 4}Z`, sv("face"), 1.4)
    + plain(`M168 ${HORIZON + 14}h64v6h-64z`, sv("line"))
    + stroke(`M240 ${HORIZON - 4}V${HORIZON - 30}M230 ${HORIZON - 30}h20`, LINE, 2)
    + stroke(`M124 ${HORIZON + 36}q6 -6 12 0q6 -6 12 0q6 -6 12 0M240 ${HORIZON + 36}q6 -6 12 0q6 -6 12 0q6 -6 12 0`, DEEP, 2);
}

function fortress() {
  let crenels = "";
  for (let x = 20; x < 380; x += 24) crenels += `<rect x="${x}" y="${HORIZON - 64}" width="12" height="10" ${fillS(sv("face"), 1.2)}/>`;
  const beams = `<path d="M90 ${HORIZON - 80}L30 0H70Z" style="fill: ${skyv("sun")}" opacity="0.35"/><path d="M310 ${HORIZON - 80}L360 0H400Z" style="fill: ${skyv("sun")}" opacity="0.35"/>`;
  return beams + crenels
    + shape(`M10 ${HORIZON + 2}V${HORIZON - 55}H390V${HORIZON + 2}Z`, sv("face"), 1.4)
    + stroke(`M10 ${HORIZON - 36}H390M10 ${HORIZON - 18}H390`, "rgba(20,16,10,0.25)", 1.2)
    + [60, 140, 260, 340].map((x) => plain(`M${x} ${HORIZON - 30}h16v4h-16z`, sv("line"))).join("")
    + shape(`M84 ${HORIZON - 80}h12v26h-12z`, sv("side"), 1.2) + shape(`M304 ${HORIZON - 80}h12v26h-12z`, sv("side"), 1.2);
}

export function backdrop(terrain, { structure: s } = {}) {
  const t = SCENES[terrain] ? terrain : "open";
  const [far, near] = SCENES[t]();
  const known = s && STRUCT_SCENES[s] ? s : null; // only a known id reaches the markup
  const extra = known ? [].concat(STRUCT_SCENES[known]()) : [far];
  const scene = sky() + extra[0] + near + (extra[1] || "");
  return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${t}${known ? " with " + known : ""} backdrop" class="backdrop" preserveAspectRatio="xMidYMid slice">${scene}</svg>`;
}
