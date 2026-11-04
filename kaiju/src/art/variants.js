// The variants' drawings: another look for a kaiju, with the same contract as the base
// drawings in kaiju.js (a plan with five part outlines, a figure, a portrait, a token),
// built with the same helpers (kit.js). kaiju.js draws them by look id.
// This module must not import kaiju.js: kaiju.js imports this one.

import { smooth, poly, limb, pt } from "./defs.js";
import { LINE, uid, path, inked, strokeOnly, clipped, spines, scaleRows, suckers, eyeball, star } from "./kit.js";

// A paw at the tip of a feeler: a palm, three toes and a pad. `tip` is where the feeler
// ends, `from` the point before it, so the paw points the way the feeler does.
function pawGeometry(tip, from, r) {
  const len = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1;
  const d = [(tip[0] - from[0]) / len, (tip[1] - from[1]) / len];
  const n = [-d[1], d[0]];
  const at = (a, k) => [d[0] * Math.cos(a) * k + n[0] * Math.sin(a) * k, d[1] * Math.cos(a) * k + n[1] * Math.sin(a) * k];
  const centre = [tip[0] + d[0] * r * 0.45, tip[1] + d[1] * r * 0.45];
  const toes = [-0.75, 0, 0.75].map((a) => {
    const o = at(a, r * 0.92);
    return [centre[0] + o[0], centre[1] + o[1], r * 0.42];
  });
  const back = at(Math.PI, r * 0.18);
  return { centre, r, toes, pad: [centre[0] + back[0], centre[1] + back[1]] };
}

const ring = (cx, cy, r, n = 8) => smooth(Array.from({ length: n }, (_, i) => [cx + Math.cos(i * 2 * Math.PI / n) * r, cy + Math.sin(i * 2 * Math.PI / n) * r]));

// The outline of a paw, for the silhouette.
const pawPath = (g) => ring(g.centre[0], g.centre[1], g.r) + g.toes.map(([x, y, r]) => ring(x, y, r, 6)).join("");

// A paw, drawn: toes behind, then the palm, then the pad and (when it is big enough) toe beans.
function pawArt(g, c, w = 1.2) {
  const toes = g.toes.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.fur}" stroke="${LINE}" stroke-width="${w}"/>`).join("");
  const palm = `<circle cx="${g.centre[0].toFixed(1)}" cy="${g.centre[1].toFixed(1)}" r="${g.r.toFixed(1)}" fill="${c.fur}" stroke="${LINE}" stroke-width="${w}"/>`;
  const pad = `<ellipse cx="${g.pad[0].toFixed(1)}" cy="${g.pad[1].toFixed(1)}" rx="${(g.r * 0.5).toFixed(1)}" ry="${(g.r * 0.42).toFixed(1)}" fill="${c.pad}"/>`;
  const beans = g.r < 5 ? "" : g.toes.map(([x, y, r]) => {
    const px = g.centre[0] + (x - g.centre[0]) * 0.74, py = g.centre[1] + (y - g.centre[1]) * 0.74;
    return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.32).toFixed(1)}" fill="${c.pad}"/>`;
  }).join("");
  return toes + palm + pad + beans;
}

/* ------------------------------------------------------------------ */
/* Meow'thprrtep: the Squamous One as first drawn. The head with two ear spikes that
   read as a cat, and a paw at the end of each feeler. Slate mantle, tabby feelers. */

const MEOW = {
  // A grey tabby, light enough that the near-black damage marks read on coat and feet (playtest feedback).
  mantle: "#9aa5b8", dark: "#5f6b82", light: "#cfd7e3", head: "#d9b98a", headLight: "#f2deb8", headDark: "#9a7650",
  fur: "#d98f52", furDark: "#a8622e", pad: "#f2a3b0", sucker: "#f2a3b0",
  eye: "#e8f03c", eyeOdd: "#6fe0d0", pupil: "#1b0a14", red: "#c2283a", white: "#f4efd8",
  bg: "#5aa39a", bg2: "#468a82", frame: "#14302d",
};

// The eyes do not agree: every third one is another colour, and the pupils differ.
const meowEye = (x, y, r, i) => eyeball(x, y, r, i % 3 !== 1, i % 4 === 2 ? MEOW.eyeOdd : MEOW.eye, MEOW.pupil);

function meowPlan() {
  const body = smooth([[16, 100], [13, 74], [20, 50], [30, 34], [42, 28], [56, 32], [66, 42], [72, 56], [74, 74], [70, 96], [64, 112, 1], [57, 103],
    [50, 115, 1], [43, 104], [35, 116, 1], [28, 104], [20, 112, 1]]);
  const head = poly([[56, 36], [62, 24], [66, 10], [70, 21], [78, 14], [80, 5], [84, 18], [93, 26], [96, 40], [90, 50], [80, 54], [70, 58], [62, 50]]);
  const tents = [
    [[[66, 54], [76, 64], [84, 78], [88, 92], [85, 102], [79, 101]], 9],
    [[[60, 58], [63, 76], [68, 94], [75, 108], [85, 113], [91, 107]], 9],
    [[[72, 50], [84, 56], [93, 55], [98, 47], [94, 42]], 7],
  ];
  const paws = tents.map(([c, w]) => pawGeometry(c[c.length - 1], c[c.length - 2], w * 0.78));
  const feet = [
    [[[24, 98], [19, 120], [14, 140], [8, 151], [1, 153]], 14],
    [[[36, 102], [35, 124], [32, 144], [27, 155], [18, 156]], 14],
    [[[49, 102], [51, 126], [51, 146], [57, 155], [66, 155]], 14],
    [[[61, 98], [67, 120], [73, 139], [81, 151], [92, 153]], 13],
  ];
  const stalk = [[30, 38], [27, 26], [31, 16], [38, 11]];
  const orb = smooth(Array.from({ length: 8 }, (_, i) => [43 + Math.cos(i * Math.PI / 4) * 8, 9.5 + Math.sin(i * Math.PI / 4) * 7.5]));
  return {
    order: ["aux", "legs", "body", "head", "arms"],
    paths: {
      head, body,
      arms: tents.map(([c, w]) => limb(c, w, 0)).join("") + paws.map(pawPath).join(""),
      legs: feet.map(([c, w]) => limb(c, w, 0)).join(""),
      aux: limb(stalk, 7, 5) + orb,
    },
    parts: { tents, paws, feet, stalk, orb },
  };
}

const meowthprrtep = {
  pal: MEOW,
  plan: meowPlan,
  figureAnchors: { head: [80, 34, 8], arms: [84, 84, 7], body: [40, 70, 12], legs: [34, 132, 9], aux: [43, 10, 6] },
  figure() {
    const p = meowPlan(), q = p.parts, c = MEOW;
    const bodyId = uid("mb"), headId = uid("mh");
    const feet = q.feet.map(([cl, w]) => inked(limb(cl, w, 0), c.dark, 1.3) + suckers(cl, 1, 1.4, c.sucker)).join("");
    const tents = q.tents.map(([cl, w], i) => inked(limb(cl, w, 0), c.fur, 1.3) + suckers(cl.map(([x, y]) => [x + 1.5, y]), 1, 1.2, c.sucker) + pawArt(q.paws[i], c, 1.2)).join("");
    const facets = path("M62 24L66 10L70 21L74 34Z", c.headLight) + path("M74 34L84 18L93 26L96 40Z", c.headDark)
      + path("M62 50L74 34L80 54L70 58Z", c.headDark) + path("M74 34L96 40L90 50L80 54Z", c.head)
      + path("M56 36L62 24L74 34L62 50Z", c.headLight)
      + path("M64.5 22.5L66 13.5L68.5 20.5Z", c.pad) + path("M80.5 17L80.5 9.5L83 16.5Z", c.pad);
    const lines = strokeOnly("M74 34L62 24M74 34L84 18M74 34L96 40M74 34L80 54M74 34L62 50M70 21L71 30M88 46L78 44", LINE, 0.9);
    const eyes = [[68, 30, 3.4], [82, 30, 2.6], [88, 40, 2], [66, 44, 2.2], [78, 46, 2.8], [60, 37, 1.5], [91, 31, 1.4], [73, 52, 1.5]]
      .map(([x, y, r], i) => meowEye(x, y, r, i)).join("");
    return inked(limb(q.stalk, 7, 5), c.mantle, 1.3)
      + inked(q.orb, c.white, 1.4) + `<circle cx="44.5" cy="9.5" r="4.6" fill="${c.eye}" stroke="${LINE}" stroke-width="0.8"/>`
      + `<ellipse cx="44.5" cy="9.5" rx="3.8" ry="0.9" fill="${c.pupil}"/>`
      + strokeOnly("M36 7l2.5 1M36.5 12.5l2.5 -1M50 5l-2 1.5M50.5 14l-2 -1", c.red, 0.7)
      + feet
      + inked(p.paths.body, c.mantle)
      + clipped(bodyId, p.paths.body, scaleRows(12, 32, 76, 116, 6, c.dark, 0.9)
        + `<ellipse cx="22" cy="80" rx="8" ry="34" fill="${c.dark}" opacity="0.5"/>`
        + strokeOnly("M40 32Q58 36 66 52", c.light, 3, ` opacity="0.6"`)
        + meowEye(30, 64, 1.6, 0) + meowEye(46, 86, 1.3, 1) + meowEye(24, 92, 1.1, 2))
      + inked(p.paths.head, c.head)
      + clipped(headId, p.paths.head, facets + lines)
      + inked(p.paths.head, "none") + eyes
      + strokeOnly("M70 56l1 5l-2 3M76 55l0.5 6l2 3M82 52l1 5", c.fur, 1.6)
      + tents;
  },
  portraitAnchors: { head: [72, 46, 12], arms: [78, 102, 9], body: [24, 104, 12], aux: [22, 24, 8], legs: null },
  portrait() {
    const c = MEOW;
    const head = poly([[34, 48], [44, 26], [50, 6], [58, 22], [70, 12], [77, 1], [82, 18], [100, 28], [108, 50], [100, 66], [86, 74], [66, 80], [46, 72]]);
    const mantle = smooth([[-6, 124, 1], [-2, 92], [12, 72], [32, 62], [56, 70], [90, 72], [112, 86], [126, 104], [126, 124, 1]]);
    const tents = [
      [[[64, 74], [62, 90], [58, 104], [52, 114], [44, 116]], 12],
      [[[74, 76], [78, 92], [80, 108], [86, 118], [96, 118]], 12],
      [[[86, 70], [98, 80], [106, 94], [104, 106], [96, 104]], 11],
      [[[54, 70], [44, 82], [36, 94], [34, 106], [40, 110]], 10],
    ];
    const paws = tents.map(([cl, w]) => pawGeometry(cl[cl.length - 1], cl[cl.length - 2], w * 0.8));
    const stalk = [[14, 72], [10, 54], [14, 38], [20, 30]];
    const headId = uid("mph"), bodyId = uid("mpb");
    const facets = path("M44 26L50 6L58 22L66 42Z", c.headLight) + path("M66 42L77 1L82 18L100 28Z", c.headDark)
      + path("M46 72L66 42L76 78Z", c.headDark) + path("M66 42L100 28L108 50L100 66L86 74L76 78Z", c.head)
      + path("M34 48L44 26L66 42L46 72Z", c.headLight) + path("M58 22L70 12L77 1L66 42Z", c.head)
      + path("M47 24L50 11.5L55 22Z", c.pad) + path("M73 14.5L77 5.5L80 17Z", c.pad);
    const lines = strokeOnly("M66 42L44 26M66 42L58 22M66 42L77 1M66 42L100 28M66 42L46 72M66 42L76 78M70 12L72 30M100 66L88 58L108 50", LINE, 1.2);
    const eyes = [[60, 36, 6], [84, 34, 4.6], [94, 50, 4], [54, 56, 3.4], [76, 58, 5], [44, 42, 2.6], [100, 40, 2.4], [68, 22, 2.6], [88, 64, 2.6], [64, 68, 2]]
      .map(([x, y, r], i) => meowEye(x, y, r, i)).join("");
    let rays = "";
    for (let i = 0; i < 9; i++) rays += `M${-20 + i * 18} 120L60 -10`;
    for (let i = 0; i < 9; i++) rays += `M${-10 + i * 18} 120L140 20`;
    const bg = `<rect width="120" height="120" fill="${c.bg}"/>` + strokeOnly(rays, c.bg2, 1.6)
      + path(poly([[0, 0], [30, 0], [16, 24], [0, 18]]), c.bg2)
      + `<path d="M96 0h24v30l-12 -8z" fill="${c.bg2}"/>`;
    const art = inked(limb(stalk, 10, 8), c.mantle, 1.4)
      + `<circle cx="22" cy="24" r="11" fill="${c.white}" stroke="${LINE}" stroke-width="1.6"/>`
      + `<circle cx="24" cy="24" r="7" fill="${c.eye}" stroke="${LINE}" stroke-width="1"/>`
      + `<ellipse cx="24" cy="24" rx="6" ry="1.5" fill="${c.pupil}"/>`
      + strokeOnly("M12 19l3 1.5M12 29l3 -1.5M30 15l-2 2M31 32l-2 -2", c.red, 1)
      + inked(mantle, c.mantle, 1.6)
      + clipped(bodyId, mantle, scaleRows(-4, 64, 124, 124, 9, c.dark, 1.2)
        + strokeOnly("M14 76Q34 62 56 72", c.light, 4, ` opacity="0.6"`) + meowEye(20, 96, 2.4, 0) + meowEye(108, 104, 2, 2))
      + inked(head, c.head, 1.6)
      + clipped(headId, head, facets + lines)
      + inked(head, "none", 1.6) + eyes
      + tents.map(([cl, w], i) => inked(limb(cl, w, 0), c.fur, 1.4) + suckers(cl.map(([x, y]) => [x + 2, y]), 1, 1.8, c.sucker) + pawArt(paws[i], c, 1.5)).join("");
    return { bg, art };
  },
  token() {
    const c = MEOW;
    const feelers = [[[-4, 4], [-6, 8], [-5, 11]], [[4, 4], [6, 7], [8, 8]]];
    const earL = poly([[-9, -3], [-8, -11], [-5, -16], [-1, -9]]), earR = poly([[0, -9], [5, -14], [8, -6], [10, -3]]);
    const shape = poly([[-12, -2], [-8, -11], [-5, -16], [-1, -9], [5, -14], [8, -6], [13, -3], [11, 5], [2, 8], [-8, 6]]);
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + feelers.map((f) => inked(limb(f, 5, 0), c.fur, 1) + pawArt(pawGeometry(f[f.length - 1], f[f.length - 2], 3.2), c, 0.9)).join("")
      + inked(shape, c.head, 1.3)
      + path("M-12 -2L-8 -11L-5 -16L-1 -2Z", c.headLight) + path("M-1 -2L5 -14L8 -6L13 -3Z", c.headDark)
      + path("M-7.5 -9L-5.2 -13.4L-3 -8.5Z", c.pad) + path("M3.2 -8.8L5.2 -11.6L6.8 -7Z", c.pad)
      + inked(shape, "none", 1.3)
      + meowEye(-4, -3, 2.6, 0) + meowEye(5, -1, 2, 2) + meowEye(0, 4, 1.4, 1) + meowEye(8, 3, 1.2, 3);
  },
};


/* ------------------------------------------------------------------ */
/* Mekkasaurus Prime: a machine copy of our tyrannosaurus. The same stance and plates,
   in riveted steel. A visor where the eye was, the dorsal plates as vents with a glow. */

const MEK = {
  steel: "#8794a6", dark: "#38414f", light: "#c8d2df", under: "#566275", vent: "#262b34",
  glow: "#ff8a3a", hot: "#ffd27a", visor: "#e8352b", tooth: "#dfe5ec", mouth: "#14171d", rivet: "#e9eef5",
  bg: "#31506f", bg2: "#27425d", frame: "#131b26",
};

const rivets = (points, r, c = MEK) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.rivet}" stroke="${LINE}" stroke-width="${(r * 0.4).toFixed(2)}"/>`).join("");

// The same outline as the tyrannosaur it copies.
function mekPlan() {
  const backLine = [[53, 21], [43, 32], [35, 48], [31, 66], [31, 86]];
  const plates = spines(backLine, 6, 14, 8, 4.6, 1, 0.45);
  const head = smooth([[56, 25], [62, 16], [71, 11], [79, 12, 1], [84, 15], [93, 19], [98, 23, 1], [98.5, 28, 1],
    [90, 30], [81, 31.5], [75, 33.5, 1], [85, 35], [93, 36.5], [96, 38.5, 1], [92, 45], [80, 48], [68, 46], [59, 38]]);
  const core = smooth([[52, 23], [63, 33], [68, 46], [75, 57], [77, 72], [72, 88], [63, 100], [50, 105], [37, 100],
    [30, 88], [30, 68], [35, 48], [44, 32]]);
  const body = core + plates.map((p) => smooth(p)).join("");
  const nearLeg = [[46, 84], [62, 84], [71, 96], [71, 111], [65, 124], [70, 139], [78, 147], [89, 151, 1], [89, 156, 1],
    [60, 156, 1], [57, 146], [54, 130], [46, 117], [40, 100]];
  const farLeg = nearLeg.map(([x, y, k]) => (k ? [x - 15, y - 3, k] : [x - 15, y - 3]));
  const nearArm = [[66, 58], [75, 60], [82, 66], [89, 70, 1], [85, 72], [90, 76, 1], [84, 77], [78, 73], [69, 68]];
  const farArm = nearArm.map(([x, y, k]) => (k ? [x - 5, y - 5, k] : [x - 5, y - 5]));
  const tailLine = [[40, 90], [27, 101], [15, 120], [9, 139], [15, 152], [30, 155], [38, 152]];
  return {
    order: ["aux", "legs", "body", "arms", "head"],
    paths: {
      head, body,
      legs: smooth(farLeg) + smooth(nearLeg),
      arms: smooth(farArm) + smooth(nearArm),
      aux: limb(tailLine, 24, 0),
    },
    parts: { backLine, plates, nearLeg, farLeg, nearArm, farArm, tailLine, head, body: core },
  };
}

// Vents: each dorsal plate is dark with a slit of glow along its spine.
function mekVents(plates, c, w, hotW) {
  return plates.map((pl) => {
    const base = pt(pl[0].map((v, i) => (v + pl[4][i]) / 2)), tip = pt(pl[2]);
    return inked(smooth(pl), c.vent, w * 0.85) + strokeOnly(`M${base}L${tip}`, c.glow, w) + strokeOnly(`M${base}L${tip}`, c.hot, hotW);
  }).join("");
}

const mekkasaurus = {
  pal: MEK,
  plan: mekPlan,
  figureAnchors: { head: [80, 26, 9], arms: [80, 68, 6], body: [52, 70, 12], legs: [60, 120, 10], aux: [14, 130, 9] },
  figure() {
    const p = mekPlan(), q = p.parts, c = MEK;
    const bodyId = uid("kb"), headId = uid("kh"), legId = uid("kl"), tailId = uid("kt");
    const halo = q.plates.map((pl) => `<circle cx="${pl[2][0].toFixed(1)}" cy="${pl[2][1].toFixed(1)}" r="7" fill="${c.glow}" opacity="0.28"/>`
      + `<circle cx="${pl[2][0].toFixed(1)}" cy="${pl[2][1].toFixed(1)}" r="3.5" fill="${c.hot}" opacity="0.4"/>`).join("");
    const bellyBand = limb([[64, 40], [72, 54], [74, 70], [69, 86], [60, 98]], 9, 6);
    const ribs = [[64, 46], [70, 56], [72, 66], [70, 76], [66, 86]].map(([x, y]) => strokeOnly(`M${x - 4} ${y - 1}l8 2`, c.dark, 0.9)).join("");
    return halo
      + inked(smooth(q.farLeg), c.dark) + inked(smooth(q.farArm), c.dark, 1.2)
      + inked(p.paths.aux, c.steel)
      + clipped(tailId, p.paths.aux, strokeOnly(smooth(q.tailLine, false), c.dark, 26, ` stroke-dasharray="0.9 6" opacity="0.8"`)
        + strokeOnly(smooth(q.tailLine, false), c.dark, 9, ` opacity="0.4" transform="translate(3,4)"`)
        + strokeOnly(smooth(q.tailLine, false), c.light, 2.5, ` opacity="0.55" transform="translate(-3,-3)"`))
      + rivets([[12, 138], [14, 148], [24, 152], [18, 124]], 1)
      + mekVents(q.plates, c, 1.5, 0.6)
      + inked(q.body, c.steel)
      + clipped(bodyId, q.body, path(bellyBand, c.under) + ribs
        + `<ellipse cx="58" cy="102" rx="22" ry="12" fill="${c.dark}" opacity="0.5"/>`
        + strokeOnly("M36 50Q31 70 33 90", c.light, 3, ` opacity="0.6"`)
        + strokeOnly("M40 44L62 56M34 62L66 68M32 80L66 84", c.dark, 0.9)
        + rivets([[44, 48], [54, 53], [36, 63], [48, 65], [34, 81], [46, 83], [58, 85]], 1))
      + inked(smooth(q.nearLeg), c.steel)
      + clipped(legId, smooth(q.nearLeg), `<ellipse cx="66" cy="108" rx="9" ry="16" fill="${c.dark}" opacity="0.45"/>`
        + strokeOnly("M48 92Q44 104 52 118", c.light, 2.5, ` opacity="0.6"`) + strokeOnly("M50 126l18 -3M54 140l18 -2", c.dark, 1)
        + `<circle cx="62" cy="106" r="6" fill="${c.dark}" stroke="${LINE}" stroke-width="1"/>` + rivets([[62, 106]], 1.6)
        + strokeOnly("M62 150l3 -5M70 151l3 -5M78 152l3 -5", c.dark, 1))
      + strokeOnly("M84.5 151.5l4 3.5M77 151l3.5 4M70 151l3 4.5", c.tooth, 1.8)
      + inked(smooth(q.nearArm), c.steel, 1.2)
      + strokeOnly("M88.8 70.2l1.6 0.4M89.8 76l1.6 0.6", c.tooth, 1.4) + rivets([[72, 62]], 1)
      + inked(q.head, c.steel)
      + clipped(headId, q.head, `<path d="M74 33.5L98 27L98 31L94 36Z" fill="${c.mouth}"/>`
        + `<ellipse cx="88" cy="33.2" rx="8" ry="1.8" fill="${c.glow}" opacity="0.9"/>`
        + `<ellipse cx="80" cy="47" rx="20" ry="6" fill="${c.dark}" opacity="0.55"/>`
        + strokeOnly("M62 20Q72 11 82 14", c.light, 2.5, ` opacity="0.7"`)
        + strokeOnly("M64 30L72 40M71 24L66 36", c.dark, 0.8))
      + strokeOnly("M77 32.4v3M81 31.8v3M85 31.2v3M89 30.6v3M93 30v3", c.tooth, 1.3) + strokeOnly("M80 35v-2.4M84 35.4v-2.6M88 36v-2.6", c.tooth, 1.3)
      + strokeOnly("M75 33.5Q86 36 96 38.5", LINE, 1.1)
      + inked(poly([[67, 17.5], [83, 15.5], [86, 21], [70, 24.5]]), c.visor, 1)
      + strokeOnly("M70 20.8L84 18.6", c.hot, 1.2)
      + strokeOnly("M72 14L69 6", c.light, 1.2) + `<circle cx="69" cy="5.5" r="1.4" fill="${c.glow}"/>`
      + rivets([[63, 28], [66, 36], [90, 24], [70, 42]], 0.9);
  },
  portraitAnchors: { head: [88, 40, 12], arms: [92, 104, 8], body: [44, 96, 14], aux: [14, 100, 9], legs: null },
  portrait() {
    const c = MEK;
    const body = smooth([[-4, 124], [-2, 98], [10, 82], [24, 70], [38, 56], [50, 44], [60, 52], [70, 66], [82, 84], [92, 102], [100, 124]]);
    const backLine = [[52, 34], [38, 48], [24, 62], [10, 76], [0, 90]];
    const plates = spines(backLine, 5, 18, 12, 7, 1, 0.4);
    const head = smooth([[46, 44], [52, 30], [62, 22], [74, 19, 1], [82, 22], [96, 27], [108, 33], [115, 40, 1], [114, 46, 1],
      [104, 50], [90, 54], [76, 58, 1], [88, 60], [102, 60], [110, 61, 1], [106, 72], [90, 79], [72, 78], [58, 70]]);
    const tail = limb([[-6, 112], [6, 104], [14, 94], [12, 84], [4, 80]], 16, 0);
    const arm = smooth([[80, 92], [90, 96], [98, 102], [106, 104, 1], [101, 107], [107, 111, 1], [99, 112], [92, 108], [82, 102]]);
    const headId = uid("kph"), bodyId = uid("kpb");
    const halo = plates.map((pl) => `<circle cx="${pl[2][0].toFixed(1)}" cy="${pl[2][1].toFixed(1)}" r="10" fill="${c.glow}" opacity="0.3"/>`).join("");
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a0 = (i / 12) * Math.PI * 2, a1 = a0 + Math.PI / 12;
      return `M70 40L${(70 + Math.cos(a0) * 140).toFixed(1)} ${(40 + Math.sin(a0) * 140).toFixed(1)}L${(70 + Math.cos(a1) * 140).toFixed(1)} ${(40 + Math.sin(a1) * 140).toFixed(1)}Z`;
    }).join("");
    const bg = `<rect width="120" height="120" fill="${c.bg}"/><path d="${rays}" fill="${c.bg2}"/>`
      + `<circle cx="70" cy="40" r="26" fill="none" stroke="${c.glow}" stroke-width="3" opacity="0.5"/>`
      + `<circle cx="70" cy="40" r="40" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0.3"/>`;
    const art = halo
      + inked(tail, c.steel, 1.6) + strokeOnly("M6 100l9 5M12 92l9 6M10 84l9 6", c.dark, 1.4)
      + mekVents(plates, c, 2.2, 0.9)
      + inked(body, c.steel, 1.6)
      + clipped(bodyId, body, path(limb([[58, 66], [70, 84], [80, 104], [86, 124]], 16, 22), c.under)
        + strokeOnly("M64 76l11 2M70 90l12 2M76 104l12 2", c.dark, 1.2)
        + strokeOnly("M30 70Q16 84 8 104", c.light, 4, ` opacity="0.6"`)
        + strokeOnly("M20 100L44 84M8 90L34 78M30 118L52 96", c.dark, 1)
        + rivets([[24, 98], [36, 86], [14, 90], [30, 76], [44, 62], [46, 98], [36, 112]], 1.6))
      + inked(arm, c.steel, 1.4)
      + strokeOnly("M106 104l3 0.6M107 111l3 0.8", c.tooth, 2)
      + inked(head, c.steel, 1.6)
      + clipped(headId, head, `<path d="M76 58L115 43L114 48L106 60Z" fill="${c.mouth}"/>`
        + `<ellipse cx="96" cy="55.6" rx="13" ry="2.6" fill="${c.glow}" opacity="0.95"/>`
        + `<ellipse cx="88" cy="80" rx="30" ry="10" fill="${c.dark}" opacity="0.55"/>`
        + strokeOnly("M56 34Q70 20 86 24", c.light, 4, ` opacity="0.7"`)
        + strokeOnly("M62 52L74 64M80 40L100 38", c.dark, 1))
      + strokeOnly("M78 53.4v5M83 52.4v5M88 51.4v5M93 50.2v5M98 49v5M103 47.8v5", c.tooth, 2.2)
      + strokeOnly("M84 58.6v-4M90 58.6v-4M96 58.8v-4M102 59v-4", c.tooth, 2.2)
      + strokeOnly("M76 58Q92 60 110 61", LINE, 1.4)
      + inked(poly([[62, 31], [90, 27], [94, 36], [66, 42]]), c.visor, 1.6)
      + strokeOnly("M66 36.5L91 31.8", c.hot, 2.2) + strokeOnly("M66 36.5L91 31.8", "#fff", 0.8)
      + strokeOnly("M70 24L64 12", c.light, 2) + `<circle cx="63.5" cy="11" r="2.4" fill="${c.glow}" stroke="${LINE}" stroke-width="0.8"/>`
      + rivets([[56, 46], [60, 62], [94, 66], [100, 34], [50, 54]], 1.6);
    return { bg, art };
  },
  token() {
    const c = MEK;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + spines([[-2, -12], [-9, -4], [-11, 6]], 3, 8, 6, 3, 1, 0.3).map((pl) => inked(smooth(pl), c.vent, 1) + strokeOnly(`M${pt(pl[0].map((v, i) => (v + pl[4][i]) / 2))}L${pt(pl[2])}`, c.glow, 1.4)).join("")
      + inked(smooth([[-10, 14], [-12, 0], [-6, -10], [2, -13], [9, -11], [15, -6], [15, -2, 1], [4, 0, 1], [13, 2], [12, 7, 1], [2, 9], [-2, 14]]), c.steel, 1.4)
      + inked(poly([[-1, -9.5], [8, -10.5], [9, -6.5], [0, -5.5]]), c.visor, 0.9) + strokeOnly("M0 -7.6L8 -8.4", c.hot, 1)
      + strokeOnly("M6 -1.4v2.6M9 -1.7v2.6M12 -2v2.6", c.tooth, 1.1) + rivets([[-6, 2], [-5, 9]], 0.9);
  },
};

/* ------------------------------------------------------------------ */
/* The Alien Colossus, from the stars. Thalassor's stance: a chrome giant with a domed
   head, a violet shell in place of bronze armour, and a flail on a chain of light. */

const COL = {
  chrome: "#aab6c9", chromeDark: "#58647a", chromeLight: "#e8eef8", vio: "#7b4bd6", vioDark: "#3b2288", vioLight: "#b99cff",
  glow: "#d9c4ff", void: "#150c34", eye: "#f4ecff", star: "#f3ecff", bg: "#1f1a48", bg2: "#2d2468", frame: "#0f0b26",
};

// A ball of spikes: alternating long and short points round a centre.
function spikedBall(x, y, r0, r1, n = 8) {
  return poly(Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r0 : r1;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  }));
}

function colPlan() {
  const head = smooth([[40, 36], [40, 22], [45, 11], [53, 4], [61, 11], [65, 22], [65, 36], [61, 43], [53, 47], [44, 43]]);
  const body = smooth([[46, 41], [56, 41], [60, 43], [72, 46, 1], [75, 52], [71, 60], [66, 72], [64, 86, 1], [70, 104], [73, 112, 1], [66, 108.5, 1], [60, 114, 1],
    [53, 108.5, 1], [46, 114, 1], [39, 108.5, 1], [32, 113, 1], [27, 108, 1], [34, 86, 1], [33, 72], [29, 60], [25, 52], [28, 46, 1], [40, 43]]);
  const fistL = [[13, 96], [25, 95], [27, 104], [21, 110], [13, 106]];
  const fistR = [[81, 58], [92, 57], [94, 66], [86, 70], [80, 67]];
  const armL = limb([[27, 49], [22, 64], [20, 80], [19, 97]], 15, 11);
  const armR = limb([[71, 49], [77, 61], [80, 73]], 14, 11) + limb([[80, 75], [84, 69], [87, 63]], 11, 10);
  const chain = [[88, 62], [95, 50], [97, 36], [92, 24]];
  const ball = [88, 14];
  const legL = smooth([[35, 106, 1], [47, 106, 1], [48, 128], [47, 147], [50, 151], [50.5, 156, 1], [30, 156, 1], [31, 151], [35, 147], [34, 128]]);
  const legR = smooth([[54, 106, 1], [67, 106, 1], [68, 128], [67, 147], [74, 150], [77, 156, 1], [54, 156, 1], [54, 148], [54, 128]]);
  return {
    order: ["legs", "body", "aux", "arms", "head"],
    paths: { head, body, arms: armL + smooth(fistL) + armR + smooth(fistR), legs: legL + legR, aux: limb(chain, 3.4, 2.4) + spikedBall(ball[0], ball[1], 6, 11) },
    parts: { armL, armR, fistL, fistR, legL, legR, chain, ball },
  };
}

const aliencolossus = {
  pal: COL,
  plan: colPlan,
  figureAnchors: { head: [53, 26, 8], arms: [21, 80, 7], body: [48, 66, 12], legs: [42, 130, 9], aux: [90, 20, 7] },
  figure() {
    const p = colPlan(), q = p.parts, c = COL;
    const bodyId = uid("cb"), headId = uid("ch"), legId = uid("cl"), armId = uid("ca");
    const shade = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c.chromeDark}" opacity="0.55"/>`;
    const chain = smooth(q.chain, false);
    const shell = smooth([[29, 49], [40, 42], [62, 42], [73, 49], [72, 70], [62, 88], [38, 88], [28, 70]]);
    const pad = (pts) => inked(smooth(pts), c.vio, 1.2) + strokeOnly(`M${pt(pts[1])}Q${pt(pts[2])} ${pt(pts[4])}`, c.vioLight, 1);
    const shellId = uid("cs");
    return inked(p.paths.legs, c.chrome)
      + clipped(legId, p.paths.legs, shade(46, 130, 4, 30) + shade(66, 130, 4, 30)
        + `<path d="M34 116h13v22h-13zM54 116h13v22h-13z" fill="${c.vio}" opacity="0.85"/>`
        + strokeOnly("M34 122h13M34 132h13M54 122h13M54 132h13", c.vioDark, 1)
        + strokeOnly("M31 151h19M55 151h20", c.chromeDark, 2))
      + inked(p.paths.body, c.chrome)
      + clipped(bodyId, p.paths.body, shade(66, 70, 8, 30) + strokeOnly("M34 94h32M34 99h32M34 104h32", c.chromeDark, 1.2)
        + strokeOnly("M50 90v20", c.vioDark, 1.2))
      + inked(shell, c.vio, 1.4)
      + clipped(shellId, shell, scaleRows(26, 42, 76, 90, 8, c.vioDark, 1) + shade(66, 66, 8, 22)
        + strokeOnly("M34 50Q50 44 66 50", c.vioLight, 2, ` opacity="0.7"`))
      + inked(poly([[50, 58], [56, 65], [50, 74], [44, 65]]), c.glow, 1) + `<circle cx="50" cy="65" r="8" fill="${c.glow}" opacity="0.3"/>`
      + strokeOnly(chain, c.glow, 6, ` opacity="0.35"`) + strokeOnly(chain, c.glow, 3) + strokeOnly(chain, "#fff", 0.8, ` stroke-dasharray="1.6 2.4"`)
      + `<circle cx="${q.ball[0]}" cy="${q.ball[1]}" r="15" fill="${c.glow}" opacity="0.3"/>`
      + inked(spikedBall(q.ball[0], q.ball[1], 6, 11), c.vioDark, 1.2)
      + `<circle cx="${q.ball[0]}" cy="${q.ball[1]}" r="4.6" fill="${c.glow}" stroke="${LINE}" stroke-width="0.8"/>`
      + inked(q.armL, c.chrome) + inked(q.armR, c.chrome)
      + clipped(armId, q.armL + q.armR, shade(26, 80, 4, 24) + shade(82, 66, 3, 10)
        + `<path d="M14 84h13v7h-13z" fill="${c.vio}"/><path d="M76 71l8 -6l3 4l-8 6z" fill="${c.vio}"/>`)
      + inked(smooth(q.fistL), c.chrome, 1.2) + inked(smooth(q.fistR), c.chrome, 1.2)
      + strokeOnly("M16 101h9M16 105h8", c.chromeDark, 0.9)
      + pad([[19, 44], [29, 41], [37, 47], [34, 56], [22, 56]]) + pad([[63, 44], [73, 41], [81, 46], [80, 55], [70, 56]])
      + inked(p.paths.head, c.chrome)
      + clipped(headId, p.paths.head, shade(43, 28, 5, 18) + `<path d="M44 10Q53 2 62 12L62 16Q54 8 44 16z" fill="${c.chromeLight}" opacity="0.7"/>`
        + strokeOnly("M53 4V16", c.vio, 2) + strokeOnly("M42 38h22M44 42h18", c.chromeDark, 1))
      + inked(smooth([[42, 22], [50, 20], [53, 31], [46, 34]]), c.void, 1) + inked(smooth([[64, 22], [56, 20], [53, 31], [60, 34]]), c.void, 1)
      + `<ellipse cx="48.5" cy="27" rx="3" ry="1.2" fill="${c.glow}" transform="rotate(40 48.5 27)"/>`
      + `<ellipse cx="57.5" cy="27" rx="3" ry="1.2" fill="${c.glow}" transform="rotate(-40 57.5 27)"/>`
      + strokeOnly("M50 41h6", c.vioDark, 1.2);
  },
  portraitAnchors: { head: [62, 52, 12], arms: [106, 106, 9], body: [52, 112, 12], aux: [100, 28, 8], legs: null },
  portrait() {
    const c = COL;
    const head = smooth([[34, 64], [33, 40], [42, 18], [62, 6], [82, 18], [91, 40], [90, 64], [82, 82], [62, 92], [44, 82]]);
    const body = smooth([[40, 84], [80, 84], [98, 96], [114, 106], [124, 124, 1], [-4, 124, 1], [4, 106], [20, 94]]);
    const padL = smooth([[-6, 96], [10, 84], [28, 88], [36, 104], [26, 118], [-6, 122]]);
    const padR = smooth([[88, 94], [108, 84], [124, 90], [126, 118], [104, 118], [92, 108]]);
    const headId = uid("cph"), bodyId = uid("cpb"), padId = uid("cpp");
    const stars = [[14, 14, 1.4], [30, 28, 1], [96, 10, 1.2], [50, 12, 1], [8, 58, 1.2], [112, 60, 1], [22, 82, 0.9], [76, 6, 1]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.star}"/>`).join("");
    const bg = `<rect width="120" height="120" fill="${c.bg}"/><circle cx="26" cy="96" r="46" fill="${c.bg2}"/>`
      + `<circle cx="104" cy="34" r="26" fill="none" stroke="${c.bg2}" stroke-width="6"/>` + stars;
    const chain = smooth([[104, 96], [114, 72], [112, 48], [104, 34]], false);
    const art = strokeOnly(chain, c.glow, 7, ` opacity="0.3"`) + strokeOnly(chain, c.glow, 3.4) + strokeOnly(chain, "#fff", 1.2, ` stroke-dasharray="2.4 3.2"`)
      + `<circle cx="100" cy="26" r="24" fill="${c.glow}" opacity="0.3"/>`
      + inked(spikedBall(100, 26, 10, 19), c.vioDark, 1.6) + `<circle cx="100" cy="26" r="7.5" fill="${c.glow}" stroke="${LINE}" stroke-width="1.2"/>`
      + inked(body, c.chrome, 1.6)
      + clipped(bodyId, body, strokeOnly("M40 100h40M36 106h48M30 112h60", c.chromeDark, 1.4)
        + `<ellipse cx="96" cy="112" rx="18" ry="14" fill="${c.chromeDark}" opacity="0.4"/>`)
      + inked(poly([[60, 100], [68, 110], [60, 122], [52, 110]]), c.glow, 1.4)
      + inked(padL, c.vio, 1.6) + inked(padR, c.vio, 1.6)
      + clipped(padId, padL + padR, scaleRows(-8, 82, 128, 124, 10, c.vioDark, 1.3)
        + strokeOnly("M0 98q14 -10 28 -4M96 96q14 -8 26 -2", c.vioLight, 2, ` opacity="0.7"`))
      + inked(head, c.chrome, 1.6)
      + clipped(headId, head, `<ellipse cx="38" cy="58" rx="10" ry="32" fill="${c.chromeDark}" opacity="0.55"/>`
        + `<path d="M40 30Q62 8 82 28L80 22Q62 4 44 24z" fill="${c.chromeLight}" opacity="0.8"/>`
        + strokeOnly("M62 8V34", c.vio, 3.4) + strokeOnly("M44 82q18 10 36 0", c.chromeDark, 1.4)
        + strokeOnly("M52 74v8M62 76v10M72 74v8", c.chromeDark, 1.4))
      + inked(smooth([[35, 42], [50, 38], [61, 54], [46, 66]]), c.void, 1.6) + inked(smooth([[89, 42], [74, 38], [63, 54], [78, 66]]), c.void, 1.6)
      + `<ellipse cx="49" cy="52" rx="6" ry="2.6" fill="${c.glow}" transform="rotate(38 49 52)"/>`
      + `<ellipse cx="75" cy="52" rx="6" ry="2.6" fill="${c.glow}" transform="rotate(-38 75 52)"/>`
      + strokeOnly("M56 70h12", c.vioDark, 1.6);
    return { bg, art };
  },
  token() {
    const c = COL;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + `<circle cx="-11" cy="-9" r="1" fill="${c.star}"/><circle cx="12" cy="-13" r="0.8" fill="${c.star}"/>`
      + `<circle cx="11" cy="-8" r="7" fill="${c.glow}" opacity="0.3"/>` + inked(spikedBall(11, -8, 2.6, 5.4), c.vioDark, 0.9)
      + inked(smooth([[-11, 17], [-12, 8], [-7, 5], [7, 5], [12, 8], [11, 17]]), c.vio, 1.2)
      + inked(smooth([[-9, -4, 0], [-9, -9], [-5, -14], [0, -16], [5, -14], [9, -9], [9, -4], [6, 3], [0, 6], [-6, 3]]), c.chrome, 1.3)
      + `<path d="M-7 -10Q-2 -11 0 -4L-6 -4z" fill="${c.void}"/><path d="M7 -10Q2 -11 0 -4L6 -4z" fill="${c.void}"/>`
      + `<ellipse cx="-3.4" cy="-6.6" rx="1.8" ry="0.8" fill="${c.glow}" transform="rotate(35 -3.4 -6.6)"/><ellipse cx="3.4" cy="-6.6" rx="1.8" ry="0.8" fill="${c.glow}" transform="rotate(-35 3.4 -6.6)"/>`;
  },
};

/* ------------------------------------------------------------------ */
/* Gekido-Oh, the empire's iron general: a sentai robot of the other side. A horned helm,
   a red visor slit, black and gunmetal with gold trim. */

const GEK = {
  black: "#1d1f27", gun: "#5d6374", gunLight: "#8f96a9", gunDark: "#393d4b", gold: "#e2b231", goldDark: "#8d6a14",
  red: "#e02434", redDark: "#8a0f1c", glow: "#ff6a55", bg: "#4b1b3c", bg2: "#3a1330", frame: "#0e0a10",
};

function gekPlan() {
  const podL = [[34, 44], [4, 12], [10, 30], [16, 34], [22, 50]];
  const podR = [[66, 42], [96, 10], [91, 28], [85, 32], [78, 48]];
  const legL = [[36, 106], [48, 106], [48, 124], [50, 128], [50, 146], [52, 150], [52, 157], [28, 157], [30, 150], [33, 146], [33, 128], [35, 124]];
  const legR = [[53, 106], [65, 106], [66, 124], [68, 128], [68, 146], [72, 149], [81, 152], [81, 157], [52, 157], [53, 146], [52, 128], [53, 124]];
  const body = [[38, 40], [62, 40], [74, 46], [72, 74], [64, 84], [62, 96], [70, 104], [68, 110], [32, 110], [30, 104], [38, 96], [36, 84], [28, 74], [26, 46]];
  const armL = [[[14, 42], [22, 37], [34, 40], [36, 54], [30, 58], [16, 58], [12, 50]], [[19, 57], [29, 57], [29, 73], [19, 73]],
    [[15, 72], [32, 72], [33, 94], [16, 94]], [[16, 94], [31, 94], [32, 106], [29, 109], [18, 109], [15, 104]]];
  const armR = [[[64, 40], [76, 37], [86, 42], [88, 50], [84, 58], [70, 58], [64, 54]], [[71, 57], [81, 57], [81, 71], [71, 71]],
    [[68, 70], [86, 70], [88, 92], [70, 92]], [[70, 92], [87, 92], [88, 104], [85, 107], [73, 107], [70, 102]]];
  const head = [[42, 31], [42, 20], [46, 15], [56, 14], [60, 18], [61, 30], [56, 36], [46, 36]];
  const horns = [[[43, 18], [38, 10], [31, 1], [35, 14], [43, 26]], [[60, 18], [65, 10], [72, 1], [68, 14], [60, 26]], [[49, 15], [51.5, 4], [54, 15]]];
  return {
    order: ["aux", "legs", "body", "arms", "head"],
    paths: {
      head: poly(head) + horns.map(poly).join(""), body: poly(body),
      arms: [...armL, ...armR].map(poly).join(""), legs: poly(legL) + poly(legR), aux: poly(podL) + poly(podR),
    },
    parts: { podL, podR, legL, legR, body, armL, armR, head, horns },
  };
}

const gekido = {
  pal: GEK,
  plan: gekPlan,
  figureAnchors: { head: [52, 25, 8], arms: [78, 80, 7], body: [50, 66, 12], legs: [58, 136, 9], aux: [20, 26, 6] },
  figure() {
    const q = gekPlan().parts, c = GEK;
    const box = (pts, fill, w = 1.3) => inked(poly(pts), fill, w);
    const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const pod = (pts) => box(pts, c.gun) + box([mid(pts[0], pts[1], 0.35), pts[1], mid(pts[1], pts[2], 0.5), mid(pts[4], pts[2], 0.35)], c.black, 1.1)
      + strokeOnly(`M${pt(mid(pts[1], pts[2], 0.5))}L${pt(mid(pts[0], pts[4], 0.5))}`, c.gold, 1.2)
      + `<circle cx="${pts[1][0]}" cy="${pts[1][1]}" r="3.2" fill="${c.glow}" opacity="0.5"/><circle cx="${pts[1][0]}" cy="${pts[1][1]}" r="1.6" fill="${c.glow}"/>`;
    const leg = (pts) => box(pts, c.black)
      + box([pts[3], pts[4], pts[9], pts[10]], c.gun)
      + box([[pts[11][0] - 1, 123], [pts[2][0] + 1, 123], [pts[2][0] + 1, 130], [(pts[2][0] + pts[11][0]) / 2, 133], [pts[11][0] - 1, 130]], c.gold, 1.1)
      + box([pts[4], pts[5], pts[6], pts[7], pts[8], pts[9]], c.gunDark)
      + strokeOnly(`M${pts[10][0] + 2} 137h${pts[3][0] - pts[10][0] - 4}M${pts[10][0] + 2} 141h${pts[3][0] - pts[10][0] - 4}`, c.gold, 1.6)
      + strokeOnly(`M${pts[0][0] + 3} 110v10`, c.gunLight, 1.2);
    const cx = 50;
    return pod(q.podL) + pod(q.podR)
      + leg(q.legL) + leg(q.legR)
      + box([[36, 104], [48, 104], [48, 112], [36, 112]], c.black) + box([[53, 104], [65, 104], [65, 112], [53, 112]], c.black)
      + box(q.body, c.gunDark)
      + box([[36, 84], [64, 84], [62, 96], [38, 96]], c.black)
      + strokeOnly("M40 88h20M40 92h20", c.gunLight, 1.2)
      + box([[38, 96], [62, 96], [70, 104], [68, 110], [32, 110], [30, 104]], c.gun)
      + box([[46, 98], [54, 98], [53, 108], [47, 108]], c.gold, 1)
      + box([[28, 74], [36, 84], [64, 84], [72, 74], [66, 70], [34, 70]], c.gun, 1.1)
      + box([[34, 44], [66, 44], [72, 56], [64, 68], [36, 68], [28, 56]], c.black, 1.2)
      + strokeOnly("M30 48l8 -6M70 48l-8 -6", c.gold, 2)
      + `<circle cx="${cx}" cy="57" r="8.5" fill="${c.gold}" stroke="${LINE}" stroke-width="1.2"/>`
      + `<circle cx="${cx}" cy="57" r="6.4" fill="${c.black}" stroke="${LINE}" stroke-width="0.8"/>`
      + inked(poly([[44, 60], [44, 53], [47, 56], [50, 51], [53, 56], [56, 53], [56, 60]]), c.gold, 0.8)
      + q.armL.map((pts, i) => box(pts, [c.gun, c.black, c.gunDark, c.black][i])).join("")
      + q.armR.map((pts, i) => box(pts, [c.gun, c.black, c.gunDark, c.black][i])).join("")
      + strokeOnly("M16 78h16M16 82h16M69 76h18M69 80h18", c.gold, 1.8)
      + strokeOnly("M14 48h21M65 48h22", c.gold, 2)
      + strokeOnly("M19 100h11M73 98h13M19 104h10M73 102h13", c.gunLight, 1)
      + q.horns.map((h) => box(h, c.gold, 1.1)).join("")
      + box(q.head, c.black)
      + box([[43, 20], [60, 19], [60, 24], [44, 26]], c.gunDark, 0.9)
      + inked(poly([[44, 23], [60, 21.5], [60, 26], [44, 28]]), c.red, 0.9)
      + strokeOnly("M46 25.6l13 -1.8", c.glow, 1.2)
      + box([[47, 28], [60, 27], [59, 32], [56, 35], [48, 35]], c.gun, 1)
      + strokeOnly("M50 29.5v4M53 29.3v4.4M56 29v3.6", c.black, 0.9)
      + strokeOnly("M43 17l5 -1M58 16l-5 -1", c.gold, 1);
  },
  portraitAnchors: { head: [66, 50, 12], arms: [108, 104, 8], body: [44, 108, 12], aux: [10, 64, 8], legs: null },
  portrait() {
    const c = GEK;
    const box = (pts, fill, w = 1.6) => inked(poly(pts), fill, w);
    let stripes = "";
    for (let i = -6; i < 12; i++) stripes += `M${i * 14} 0l60 120h7l-60 -120z`;
    const bg = `<rect width="120" height="120" fill="${c.bg}"/><path d="${stripes}" fill="${c.bg2}"/>`
      + `<circle cx="62" cy="46" r="40" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0.4"/>`;
    const art = box([[22, 92], [-8, 30], [0, 62], [8, 96]], c.gun) + box([[8, 62], [-8, 30], [2, 50]], c.gold, 1.4)
      + box([[100, 92], [128, 28], [122, 60], [114, 96]], c.gun) + box([[114, 60], [128, 28], [119, 48]], c.gold, 1.4)
      + box([[48, 76], [80, 76], [82, 92], [46, 92]], c.black)
      + strokeOnly("M50 82h30M50 86h30", c.gunLight, 1.4)
      + box([[10, 96], [40, 86], [86, 86], [112, 96], [124, 126], [-4, 126]], c.gunDark)
      + box([[38, 88], [88, 88], [80, 98], [46, 98]], c.black, 1.3)
      + strokeOnly("M40 92.5h46", c.gold, 1.6)
      + `<circle cx="64" cy="110" r="12" fill="${c.gold}" stroke="${LINE}" stroke-width="1.6"/>`
      + `<circle cx="64" cy="110" r="9.5" fill="${c.black}" stroke="${LINE}" stroke-width="1"/>`
      + inked(poly([[57, 114], [57, 105], [61, 109], [64, 103], [67, 109], [71, 105], [71, 114]]), c.gold, 0.9)
      + box([[-6, 92], [14, 84], [32, 92], [30, 116], [-6, 120]], c.gun) + strokeOnly("M-4 100l34 -2", c.gold, 3)
      + box([[94, 92], [112, 84], [126, 90], [126, 116], [98, 116]], c.gun) + strokeOnly("M96 100l30 -2", c.gold, 3)
      + box([[48, 22], [46, 6], [56, 6], [64, 22]].map(([x, y]) => [x + 6, y]), c.gold, 1.4)
      + box([[34, 40], [30, 20], [24, 4], [20, -2], [34, 8], [44, 24]], c.gold, 1.4) + box([[92, 40], [96, 20], [102, 4], [106, -2], [92, 8], [82, 24]], c.gold, 1.4)
      + box([[30, 62], [30, 36], [38, 24], [52, 18], [74, 18], [84, 24], [92, 36], [92, 58], [86, 70], [74, 78], [46, 78], [34, 72]], c.black)
      + `<path d="M34 36l6 -10l12 -6l20 0l-6 8l-26 4z" fill="#fff" opacity="0.18"/>`
      + box([[34, 42], [92, 40], [93, 53], [36, 55]], c.gunDark, 1.4)
      + inked(poly([[36, 45], [91, 43.4], [92, 51], [37, 52.6]]), c.red, 1.2)
      + strokeOnly("M40 48.6l48 -1.6", c.glow, 2.4) + strokeOnly("M40 48.6l48 -1.6", "#fff", 0.8)
      + box([[48, 58], [90, 56], [86, 68], [74, 76], [52, 76]], c.gun, 1.4)
      + strokeOnly("M60 62v8M66 61.6v10M72 61.3v9M78 61v7", c.black, 1.4)
      + strokeOnly("M30 36L36 22M92 36L86 22M52 24h22", c.gold, 1.8);
    return { bg, art };
  },
  token() {
    const c = GEK;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + inked(poly([[-3, -9], [0, -16], [3, -9]]), c.gold, 1.1)
      + inked(poly([[-8, -8], [-13, -13], [-16, -17], [-12, -7], [-7, -3]]), c.gold, 1) + inked(poly([[8, -8], [13, -13], [16, -17], [12, -7], [7, -3]]), c.gold, 1)
      + inked(poly([[-11, 6], [-11, -4], [-7, -9], [7, -9], [11, -4], [11, 6], [6, 12], [-6, 12]]), c.black, 1.4)
      + inked(poly([[-10, -3], [10, -3], [10, 2], [-10, 2]]), c.red, 1)
      + strokeOnly("M-8 -0.5h16", c.glow, 1.4)
      + inked(poly([[-6, 3], [6, 3], [5, 9], [-5, 9]]), c.gun, 1) + strokeOnly("M-9 -6h18", c.gold, 1);
  },
};

export const VARIANT_ART = { meowthprrtep, mekkasaurus, colossus: aliencolossus, gekido };
export const VARIANT_IDS = Object.keys(VARIANT_ART);
