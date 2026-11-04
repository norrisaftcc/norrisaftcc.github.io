// Defense-force art: a map token and a cutaway figure for each unit type in UNITS.
// Figures face right; count 1..5 draws that many, as Advance Wars shows strength.

import { smooth, poly, limb, rimFilter } from "./defs.js";

let seq = 0;

export const UNIT_IDS = ["infantry", "tank", "artillery", "helicopter", "jet", "missile", "gun", "maser", "scientist"];

const LINE = "#1b1712";
const C = {
  olive: "#66753c", oliveDark: "#3e4823", oliveLight: "#93a05e", steel: "#73787a", steelDark: "#45494c", steelLight: "#b9bfc0",
  cream: "#f1e9d2", skin: "#e2b68c", glass: "#9fd0e0", flash: "#ffd23a", red: "#c8392b",
  jet: "#7b8a97", jetDark: "#4c5965", concrete: "#a29d8b", concreteDark: "#6f6a5b",
  brass: "#c99a3c", brassDark: "#7d5a1c", purple: "#6a3f9e", maser: "#7ff0ff",
  ground: "#4f5c2e", air: "#4f6d8a", weapon: "#2d3644", doctor: "#5c3a8a",
};

const ink = (d, fill, w = 1.4) => `<path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color, w) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const circ = (x, y, r, fill, w = 1.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${LINE}" stroke-width="${w}"/>`;
const rect = (x, y, w, h, fill, sw = 1.2) => ink(`M${x} ${y}h${w}v${h}h${-w}z`, fill, sw);

/* Figures, drawn facing right with the ground at y 0 and the middle at x 0. */

const FIGURES = {
  infantry: {
    width: 44,
    draw() {
      return rect(-12, -6, 9, 6, C.steelDark) + rect(3, -6, 10, 6, C.steelDark)
        + ink(poly([[-11, -30], [11, -30], [12, -6], [3, -6], [0, -18], [-3, -6], [-12, -6]]), C.olive)
        + ink(poly([[-12, -54], [9, -54], [12, -30], [-12, -30]]), C.olive)
        + line("M-12 -33h24", C.oliveDark, 2.4) + line("M-9 -54l14 22", C.oliveDark, 2)
        + rect(-8, -40, 7, 6, C.oliveDark, 1)
        + circ(1, -60, 6.5, C.skin)
        + ink("M-10 -60a10 8.5 0 0 1 20 0l3 1.5h-25z", C.oliveDark)
        + line("M-7 -63q4 -3 8 -1", C.oliveLight, 1.2)
        + `<circle cx="5" cy="-58.5" r="1" fill="${LINE}"/>`
        + ink(poly([[-6, -45], [30, -45], [30, -41], [6, -41], [4, -37], [-8, -37]]), C.steelDark, 1.1)
        + rect(30, -44.5, 6, 2.2, C.steelDark, 0.8)
        + ink(limb([[-4, -50], [6, -46], [14, -43]], 7, 5.5), C.olive, 1.1)
        + circ(15.5, -43, 2.6, C.skin, 0.9);
    },
  },
  tank: {
    width: 100,
    draw() {
      let wheels = "";
      for (const x of [-31, -18, -5, 8, 21, 32]) wheels += circ(x, -7, 5.2, C.steel, 1.1) + `<circle cx="${x}" cy="-7" r="1.6" fill="${C.steelDark}"/>`;
      return ink("M-38 -14h70a7 7 0 0 1 0 14h-70a7 7 0 0 1 0 -14z", C.steelDark) + wheels
        + ink(poly([[-46, -14], [42, -14], [48, -24], [-42, -26]]), C.olive)
        + line("M-42 -18h86", C.oliveDark, 1.4)
        + ink(poly([[-24, -26], [14, -26], [20, -34], [-2, -42], [-22, -40]]), C.oliveLight)
        + ink("M16 -36h40v5h-40z", C.steel, 1.2) + ink("M52 -38h7v9h-7z", C.steelDark, 1.1)
        + ink("M-14 -41h10v-4h-10z", C.olive, 1) + line("M-22 -36h18", C.oliveDark, 1.2)
        + line("M-16 -32l5 -3l5 3", C.cream, 1.6)
        + line("M-36 -20l3 -2M-28 -20l3 -2M30 -20l3 -2", C.oliveDark, 1.2);
    },
  },
  artillery: {
    width: 96,
    draw() {
      return ink(poly([[-46, 0], [-40, -4], [-2, -16], [0, -12], [-38, 2]]), C.oliveDark)
        + `<g transform="translate(2,-28) rotate(-24)">`
        + ink("M-14 -4h62v8h-62z", C.steel) + ink("M44 -5.5h9v11h-9z", C.steelDark, 1.1)
        + ink("M-18 -7h28v14h-28z", C.olive) + line("M-14 -2h22", C.oliveLight, 1.4) + `</g>`
        + ink(poly([[-10, -42], [8, -46], [12, -22], [-10, -18]]), C.olive)
        + line("M-6 -38l12 -3", C.oliveLight, 1.4)
        + circ(-2, -13, 13, C.steelDark, 1.4) + circ(-2, -13, 8, C.steel, 1.1) + circ(-2, -13, 2.6, C.steelDark, 1)
        + ink("M-36 -10h14v10h-14z", C.oliveDark, 1.1) + line("M-34 -5h10", C.flash, 1.6);
    },
  },
  helicopter: {
    width: 104, air: 56, height: 56,
    draw() {
      return ink(poly([[-12, -36], [-52, -41], [-52, -36], [-12, -26]]), C.olive)
        + ink(poly([[-50, -40], [-58, -54], [-51, -54], [-44, -40]]), C.olive, 1.2)
        + `<ellipse cx="-54" cy="-42" rx="2.4" ry="8" fill="${C.steelLight}" opacity="0.6" stroke="${LINE}" stroke-width="0.8"/>`
        + line("M-14 -10h40M-6 -10l2 -10M16 -10l-2 -10", LINE, 2)
        + ink(smooth([[-16, -40], [6, -46], [24, -42], [34, -30, 1], [28, -21], [0, -19], [-16, -26]]), C.olive)
        + ink(poly([[10, -43.5], [24, -41], [32, -30], [14, -30]]), C.glass, 1.1)
        + line("M16 -40l4 7", "#fff", 1.4)
        + ink("M-4 -28h20v5h-20z", C.oliveDark, 1) + ink("M-2 -24h16l-2 4h-12z", C.steelDark, 1)
        + ink("M28 -22h10v3h-10z", C.steelDark, 1)
        + line("M-6 -38q10 -3 20 0", C.oliveLight, 1.4)
        + ink("M0 -46h5v-6h-5z", C.steelDark, 1)
        + `<ellipse cx="2" cy="-53" rx="48" ry="3.2" fill="${C.steelLight}" opacity="0.5"/>`
        + line("M-44 -53.5L48 -52.5", LINE, 2.2);
    },
  },
  jet: {
    width: 120, air: 70, height: 58,
    draw() {
      return ink(poly([[-50, -34], [-70, -31], [-50, -27]]), C.flash, 1) + ink(poly([[-50, -33], [-62, -31], [-50, -28.5]]), "#fff6c8", 0.6)
        + ink(poly([[-44, -34], [-58, -58], [-46, -58], [-28, -36]]), C.jetDark)
        + ink(smooth([[-50, -35, 1], [-10, -39], [28, -39], [56, -32, 1], [28, -26], [-10, -25], [-50, -27, 1]]), C.jet)
        + ink(smooth([[14, -38.5], [22, -45], [34, -38.5, 1]]), C.glass, 1.1)
        + ink(poly([[-6, -31], [16, -31], [-22, -12], [-34, -12]]), C.jetDark)
        + ink(poly([[-46, -30], [-34, -30], [-46, -20], [-54, -20]]), C.jetDark, 1.1)
        + line("M-40 -31h70", C.red, 1.6) + line("M-20 -36l30 0", "#cfd6dc", 1.2)
        + ink("M-14 -18h18l-2 3h-16z", C.steelDark, 1);
    },
  },
  missile: {
    width: 96,
    draw() {
      let missiles = "";
      for (const dy of [-12, -5, 2]) {
        missiles += ink(`M-24 ${dy}h46l8 3l-8 3h-46z`, C.cream, 1.1) + ink(`M22 ${dy}l8 3l-8 3z`, C.red, 1)
          + ink(`M-24 ${dy - 1}l-4 -2v10l4 -2z`, C.steelDark, 0.8);
      }
      return `<g transform="translate(-14,-30) rotate(-28)">${ink("M-28 -16h40v26h-40z", C.oliveDark)}${missiles}</g>`
        + ink("M-44 -24h88v12h-88z", C.oliveDark)
        + ink(poly([[22, -42], [36, -42], [44, -28], [44, -12], [22, -12]]), C.olive)
        + ink(poly([[26, -38], [34, -38], [39, -29], [26, -29]]), C.glass, 1)
        + ink(poly([[-22, -24], [-8, -40], [-2, -40], [-12, -24]]), C.steelDark, 1.1)
        + circ(-30, -8, 8, C.steelDark) + circ(-12, -8, 8, C.steelDark) + circ(28, -8, 8, C.steelDark)
        + circ(-30, -8, 3, C.steel, 0.8) + circ(-12, -8, 3, C.steel, 0.8) + circ(28, -8, 3, C.steel, 0.8);
    },
  },
  gun: {
    width: 96,
    draw() {
      let bags = "";
      for (let x = -40; x < 40; x += 10) bags += `M${x} -10q5 -6 10 0`;
      for (let x = -35; x < 34; x += 10) bags += `M${x} -18q5 -6 10 0`;
      return ink(poly([[-46, 0], [-40, -22], [40, -22], [46, 0]]), C.concrete)
        + line(bags, C.concreteDark, 1.2)
        + `<g transform="translate(10,-36) rotate(-8)">${ink("M0 -6h46v5h-46z", C.steel, 1.1)}${ink("M0 1h46v5h-46z", C.steel, 1.1)}`
        + `${ink("M42 -7.5h7v8h-7zM42 0h7v7.5h-7z", C.steelDark, 1)}</g>`
        + ink("M-26 -22a26 22 0 0 1 52 0z", C.oliveDark)
        + ink("M-4 -38h22v8h-22z", C.olive, 1.2)
        + ink("M-14 -30h24v4h-24z", C.flash, 0.8)
        + line("M-18 -32q8 -8 18 -10", C.oliveLight, 1.6);
    },
  },
  maser: {
    width: 70,
    draw() {
      let braces = "";
      for (let i = 0; i < 4; i++) {
        const y0 = -i * 20, y1 = y0 - 20;
        const w0 = 24 - i * 4.5, w1 = 24 - (i + 1) * 4.5;
        braces += `M${-w0} ${y0}L${w1} ${y1}M${w0} ${y0}L${-w1} ${y1}M${-w1} ${y1}H${w1}`;
      }
      return line("M-24 0L-6 -80M24 0L6 -80", LINE, 3.6) + line("M-24 0L-6 -80M24 0L6 -80", C.steel, 2)
        + line(braces, C.steelDark, 1.4)
        + ink("M-16 -86h32v6h-32z", C.steelDark)
        + ink("M-6 -100h10v14h-10z", C.steel, 1.1)
        + `<circle cx="34" cy="-100" r="11" fill="${C.maser}" opacity="0.3"/><circle cx="34" cy="-100" r="6" fill="${C.maser}" opacity="0.5"/>`
        + ink("M-4 -130Q-26 -100 -4 -70Q8 -100 -4 -130z", C.steelLight, 1.4)
        + ink("M-4 -130Q8 -100 -4 -70Q2 -100 -4 -130z", C.steel, 1.1)
        + line("M0 -116L30 -100M0 -84L30 -100", C.steelDark, 1.6)
        + circ(31, -100, 3.6, C.maser, 1.2) + `<circle cx="31" cy="-100" r="1.4" fill="#fff"/>`
        + line("M-14 -116q-4 16 0 32", "#fff", 1.4);
    },
  },
  scientist: {
    width: 80, air: 52, height: 78,
    draw() {
      let hair = "M-6 -52";
      for (let i = 0; i < 8; i++) hair += `l${i % 2 ? 2.5 : -1} ${i % 2 ? 3 : -4.5}`;
      return line("M2 -60V-74", LINE, 2.2)
        + `<ellipse cx="2" cy="-75" rx="30" ry="3" fill="${C.steelLight}" opacity="0.55"/>`
        + line("M-26 -76L30 -74", LINE, 2) + circ(2, -75, 2.4, C.brass, 1)
        + ink(poly([[-26, -26], [-40, -36], [-34, -22], [-22, -18]]), C.purple, 1.2)
        + circ(-30, -24, 5, "none", 1) + line("M-30 -30v12", C.steelDark, 1.4)
        + circ(4, -48, 7, C.skin, 1.2)
        + ink("M-4 -50q-6 -4 -4 -10q2 4 4 3q-2 -6 3 -9q0 5 3 5q2 -6 7 -6q-2 4 0 6q5 -2 8 2q-4 1 -5 3q4 1 4 6q-5 -2 -8 -2z", C.cream, 1.1)
        + circ(5, -49, 2.6, C.glass, 1) + circ(10, -49, 2.4, C.glass, 1) + line("M7.6 -49h0.4M-2 -49h4", LINE, 1)
        + line("M2 -42q4 2 8 0", LINE, 1)
        + ink("M-6 -40h20l2 12h-24z", C.cream, 1.2) + line("M4 -40v12", "#c9c1aa", 1)
        + ink(limb([[12, -38], [20, -46], [22, -54]], 4.5, 3.5), C.cream, 1) + circ(22.5, -56, 2.6, C.skin, 1)
        + ink(smooth([[-24, -32, 1], [26, -32, 1], [22, -18], [8, -12], [-8, -12], [-20, -18]]), C.brass)
        + line("M-22 -27h46", C.brassDark, 1.4)
        + `<circle cx="-14" cy="-22" r="1.2" fill="${C.brassDark}"/><circle cx="-4" cy="-20" r="1.2" fill="${C.brassDark}"/><circle cx="6" cy="-20" r="1.2" fill="${C.brassDark}"/><circle cx="16" cy="-22" r="1.2" fill="${C.brassDark}"/>`
        + ink("M22 -26h14v4h-14z", C.steelDark, 1) + circ(28, -24, 3.4, "none", 1) + circ(33, -24, 3.4, "none", 1)
        + line("M37 -24l4 -3l2 4l4 -3", C.maser, 1.6)
        + line("M-6 -12l-2 6M8 -12l2 6", LINE, 1.4);
    },
  },
};

const LAYOUTS = {
  1: [[100, 186, 1.15]],
  2: [[70, 170, 0.95], [130, 188, 1]],
  3: [[56, 166, 0.85], [144, 166, 0.85], [100, 188, 0.95]],
  4: [[54, 160, 0.78], [136, 160, 0.78], [70, 188, 0.9], [152, 188, 0.9]],
  5: [[44, 158, 0.72], [100, 158, 0.72], [156, 158, 0.72], [70, 188, 0.86], [130, 188, 0.86]],
};

export function figure(type, { flip = false, count = 1 } = {}) {
  const f = FIGURES[type];
  if (!f) throw new Error(`no art for unit ${type}`);
  const n = Math.max(1, Math.min(5, Math.round(count) || 1));
  const fit = Math.min(1, 104 / f.width);
  let out = "";
  for (const [x, y, s0] of LAYOUTS[n]) {
    const s = s0 * (n === 1 ? fit * 1.2 : fit);
    const lift = f.air ? Math.min(f.air * s * 0.9 + 20, y - 8 - f.height * s) : 0;
    out += `<ellipse cx="${x}" cy="${y}" rx="${(f.width * s * 0.42).toFixed(1)}" ry="${(4 * s).toFixed(1)}" fill="#000" opacity="${f.air ? 0.12 : 0.25}"/>`;
    out += `<g transform="translate(${x},${(y - lift).toFixed(1)}) scale(${s.toFixed(3)})">${f.draw()}</g>`;
  }
  const turn = flip ? ` transform="translate(200,0) scale(-1,1)"` : "";
  const rim = `urim${(++seq).toString(36)}`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${type} figure, ${n}" class="figure">${rimFilter(rim, 1.2)}`
    + `<g${turn}><g filter="url(#${rim})">${out}</g></g></svg>`;
}

/* Tokens: a disc of radius 14 with a bold pictogram, facing right. */

const DISC = { infantry: C.ground, tank: C.ground, artillery: C.ground, missile: C.ground, gun: C.ground, helicopter: C.air, jet: C.air, maser: C.weapon, scientist: C.doctor };
const I = C.cream;

const ICONS = {
  infantry: () => `<path d="M-8 1a8 7 0 0 1 16 0l2 1h-20z" fill="${I}"/><path d="M-5 3h10l-1 4h-8z" fill="${I}"/><path d="M-9 11l3 -4h12l3 4z" fill="${I}"/>`
    + `<path d="M-4 9L11 -6" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/>`,
  tank: () => `<path d="M-11 3h20a3 3 0 0 1 0 6h-20a3 3 0 0 1 0 -6z" fill="${I}"/><path d="M-11 2l2 -5h16l3 5z" fill="${I}"/>`
    + `<path d="M-6 -3l1 -4h8l2 4z" fill="${I}"/><path d="M4 -5.5h10" stroke="${I}" stroke-width="2" stroke-linecap="round"/>`,
  artillery: () => `<circle cx="-2" cy="5" r="4.5" fill="none" stroke="${I}" stroke-width="2"/><path d="M-3 1L11 -8" stroke="${I}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M-4 6L-12 10" stroke="${I}" stroke-width="2" stroke-linecap="round"/><path d="M-5 -3h6v4h-6z" fill="${I}"/>`,
  helicopter: () => `<path d="M-12 -7h24" stroke="${I}" stroke-width="2" stroke-linecap="round"/><path d="M0 -7v3" stroke="${I}" stroke-width="2"/>`
    + `<ellipse cx="2" cy="1" rx="7" ry="4.6" fill="${I}"/><path d="M-4 0L-13 -2v3z" fill="${I}"/><path d="M-6 8h14" stroke="${I}" stroke-width="1.6" stroke-linecap="round"/>`,
  jet: () => `<path d="M-12 1L-6 -1h14l6 2l-6 2h-14z" fill="${I}"/><path d="M-1 0l-7 9h4l8 -9z" fill="${I}"/><path d="M-10 -1l-3 -7h4l4 7z" fill="${I}"/>`,
  missile: () => `<path d="M-10 9h20" stroke="${I}" stroke-width="2.4" stroke-linecap="round"/><g transform="rotate(-35)">`
    + `<path d="M-10 -3h15l5 2l-5 2h-15z" fill="${I}"/><path d="M-10 2.5h15l5 2l-5 2h-15z" fill="${I}"/></g>`,
  gun: () => `<path d="M-11 9l2 -6h18l2 6z" fill="${I}"/><path d="M-7 3a7 6 0 0 1 14 0z" fill="${I}"/>`
    + `<path d="M4 -1L13 -4M4 2L13 -1" stroke="${I}" stroke-width="1.8" stroke-linecap="round"/>`,
  maser: () => `<path d="M-5 11L-1 0M5 11L1 0M-4 7h8" stroke="${I}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M-2 -10Q-10 -3 -2 4Q2 -3 -2 -10z" fill="${I}"/><path d="M0 -3H10" stroke="${C.maser}" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="-3" r="2.2" fill="${C.maser}"/>`,
  scientist: () => `<path d="M-10 -9H10" stroke="${I}" stroke-width="1.8" stroke-linecap="round"/><path d="M0 -9v4" stroke="${I}" stroke-width="1.6"/>`
    + `<circle cx="0" cy="-1" r="3.6" fill="${C.skin}"/><path d="M-4 -2l-2 -3l2 0l0 -3l2 2l2 -3l1 3l3 -2l-1 3l3 1z" fill="#fff"/>`
    + `<path d="M-9 3h18l-3 6h-12z" fill="${C.brass}" stroke="${I}" stroke-width="1"/>`,
};

export function token(type) {
  const icon = ICONS[type];
  if (!icon) throw new Error(`no token for unit ${type}`);
  return `<g class="unit-token" data-unit="${type}"><circle r="14" fill="${DISC[type]}" stroke="${LINE}" stroke-width="1.6"/>`
    + `<circle r="11.6" fill="none" stroke="${I}" stroke-width="0.8" opacity="0.5"/>${icon()}</g>`;
}
