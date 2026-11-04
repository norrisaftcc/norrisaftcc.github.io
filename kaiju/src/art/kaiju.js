// Kaiju art: portrait, silhouette, figure and map token for each of the four starters,
// and for the variants' looks (their drawings are in variants.js; every function here
// takes a look id). Each look has a body plan in a 100 x 160 box (one outline per part);
// the silhouette is that plan, the figure is the plan dressed in colour and detail.

import { STATE_FILL, PARTS, smooth, poly, limb, pt, damageLayer, stateOf, rimFilter } from "./defs.js";
import { LINE, uid, path, inked, strokeOnly, shift, clipped, spines, eyeball, scaleRows, suckers, facetsOf, star } from "./kit.js";
import { VARIANT_ART, VARIANT_IDS } from "./variants.js";

export const KAIJU_IDS = ["radiosaur", "thalassor", "squamous", "dairengo"];
// Every look: the four base kaiju, then the variants' drawings (src/art/variants.js).
export const LOOK_IDS = [...KAIJU_IDS, ...VARIANT_IDS];




/* ------------------------------------------------------------------ */
/* Radiosaur: the atomic tyrannosaurus. Umber hide, uranium-glass plates. */

const RAD = {
  hide: "#6a3a24", dark: "#3e2016", light: "#94573a", belly: "#c9a066",
  plate: "#c4ee3a", glow: "#f2ff9e", eye: "#ffd23a", tooth: "#f4ecd4", mouth: "#2b0e08",
  bg: "#e0a93a", bg2: "#c98a26", frame: "#3e2016",
};

const radiosaur = {
  pal: RAD,
  plan() {
    const backLine = [[53, 21], [43, 32], [35, 48], [31, 66], [31, 86]];
    const plates = spines(backLine, 6, 14, 8, 4.6, 1, 0.45);
    const head = smooth([[56, 25], [62, 16], [71, 11], [79, 12, 1], [84, 15], [93, 19], [98, 23, 1], [98.5, 28, 1],
      [90, 30], [81, 31.5], [75, 33.5, 1], [85, 35], [93, 36.5], [96, 38.5, 1], [92, 45], [80, 48], [68, 46], [59, 38]]);
    const core = smooth([[52, 23], [63, 33], [68, 46], [75, 57], [77, 72], [72, 88], [63, 100], [50, 105], [37, 100],
      [30, 88], [30, 68], [35, 48], [44, 32]]);
    const body = core + plates.map((p) => smooth(p)).join("");
    const nearLeg = [[46, 84], [62, 84], [71, 96], [71, 111], [65, 124], [70, 139], [78, 147], [89, 151, 1], [89, 156, 1],
      [60, 156, 1], [57, 146], [54, 130], [46, 117], [40, 100]];
    const farLeg = shift(nearLeg, -15, -3);
    const nearArm = [[66, 58], [75, 60], [82, 66], [89, 70, 1], [85, 72], [90, 76, 1], [84, 77], [78, 73], [69, 68]];
    const farArm = shift(nearArm, -5, -5);
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
  },
  figureAnchors: { head: [80, 26, 9], arms: [80, 68, 6], body: [52, 70, 12], legs: [60, 120, 10], aux: [14, 130, 9] },
  figure(parts) {
    const p = this.plan(), q = p.parts, c = RAD;
    const bodyId = uid("rb"), headId = uid("rh"), legId = uid("rl"), tailId = uid("rt");
    const glow = q.plates.map((pl) => path(smooth(pl), c.glow, ` opacity="0.35" transform="translate(-1.5,-1.5)"`)).join("");
    const halo = q.plates.map((pl) => {
      const tip = pl[2];
      return `<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="7" fill="${c.glow}" opacity="0.3"/>`
        + `<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="3.5" fill="${c.glow}" opacity="0.45"/>`;
    }).join("");
    const plates = q.plates.map((pl) => inked(smooth(pl), c.plate, 1.1)
      + strokeOnly(`M${pt(pl[0].map((v, i) => (v + pl[4][i]) / 2))}L${pt(pl[2])}`, c.glow, 1.2)).join("");
    const scales = [[38, 60], [44, 74], [36, 80], [48, 88], [42, 52], [55, 62], [58, 80]]
      .map(([x, y]) => strokeOnly(`M${x} ${y}q3 -3 6 0`, c.dark, 1)).join("");
    const bellyBand = [[64, 40], [72, 54], [74, 70], [69, 86], [60, 98]];
    const belly = limb(bellyBand, 9, 6);
    const bellyLines = [0.25, 0.45, 0.65, 0.85].map((t) => {
      const i = Math.floor(t * 4), u = t * 4 - i, a = bellyBand[i], b = bellyBand[i + 1];
      const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
      return strokeOnly(`M${(x - 4).toFixed(1)} ${(y - 1.5).toFixed(1)}q4 3 8 0`, c.dark, 0.8);
    }).join("");
    const teethUp = [[77, 32.4], [81, 31.8], [85, 31.2], [89, 30.6], [93, 30]].map(([x, y]) => `M${x} ${y}l1.4 3l1.4 -3.2`).join("");
    const teethLow = [[80, 35], [84, 35.4], [88, 36]].map(([x, y]) => `M${x} ${y}l1.3 -2.6l1.3 2.8`).join("");
    return halo + glow
      + inked(smooth(q.farLeg), c.dark) + inked(smooth(q.farArm), c.dark, 1.2)
      + inked(p.paths.aux, c.hide)
      + clipped(tailId, p.paths.aux, strokeOnly(smooth(q.tailLine, false), c.dark, 9, ` opacity="0.45" transform="translate(3,4)"`)
        + strokeOnly(smooth(q.tailLine, false), c.light, 2.5, ` opacity="0.6" transform="translate(-3,-3)"`))
      + plates
      + inked(q.body, c.hide)
      + clipped(bodyId, q.body, path(belly, c.belly) + bellyLines
        + `<ellipse cx="58" cy="102" rx="22" ry="12" fill="${c.dark}" opacity="0.5"/>`
        + strokeOnly("M36 50Q31 70 33 90", c.light, 3, ` opacity="0.6"`) + scales)
      + inked(smooth(q.nearLeg), c.hide)
      + clipped(legId, smooth(q.nearLeg), `<ellipse cx="66" cy="108" rx="9" ry="16" fill="${c.dark}" opacity="0.45"/>`
        + strokeOnly("M48 92Q44 104 52 118", c.light, 2.5, ` opacity="0.6"`) + strokeOnly("M62 150l3 -5M70 151l3 -5M78 152l3 -5", c.dark, 1))
      + strokeOnly("M84.5 151.5l4 3.5M77 151l3.5 4M70 151l3 4.5", c.tooth, 1.6)
      + inked(smooth(q.nearArm), c.hide, 1.2)
      + strokeOnly("M88.8 70.2l1.6 0.4M89.8 76l1.6 0.6", c.tooth, 1.2)
      + inked(q.head, c.hide)
      + clipped(headId, q.head, `<path d="M74 33.5L98 27L98 31L94 36Z" fill="${c.mouth}"/>`
        + `<ellipse cx="86" cy="33.5" rx="9" ry="2" fill="${c.plate}" opacity="0.8"/>`
        + `<ellipse cx="80" cy="47" rx="20" ry="6" fill="${c.dark}" opacity="0.55"/>`
        + strokeOnly("M62 20Q72 11 82 14", c.light, 2.5, ` opacity="0.7"`))
      + strokeOnly(teethUp, c.tooth, 0.9) + strokeOnly(teethLow, c.tooth, 0.9)
      + strokeOnly("M75 33.5Q86 36 96 38.5", LINE, 1.1)
      + path("M70 17Q77 13 84 18L80 20Q76 18 71 20Z", c.dark)
      + `<ellipse cx="77" cy="20.5" rx="2.6" ry="2" fill="${c.eye}" stroke="${LINE}" stroke-width="0.8"/>`
      + `<path d="M77.4 18.8v3.4" stroke="${LINE}" stroke-width="1"/>`
      + `<circle cx="94" cy="22" r="0.9" fill="${LINE}"/>`
      + strokeOnly("M64 40q4 3 9 3", c.dark, 1);
  },
  portraitAnchors: { head: [88, 40, 12], arms: [92, 104, 8], body: [44, 96, 14], aux: [14, 100, 9], legs: null },
  portrait() {
    const c = RAD;
    const neck = [[-4, 124], [-2, 98], [10, 82], [24, 70], [38, 56], [50, 44], [60, 52], [70, 66], [82, 84], [92, 102], [100, 124]];
    const body = smooth(neck);
    const backLine = [[52, 34], [38, 48], [24, 62], [10, 76], [0, 90]];
    const plates = spines(backLine, 5, 18, 12, 7, 1, 0.4);
    const head = smooth([[46, 44], [52, 30], [62, 22], [74, 19, 1], [82, 22], [96, 27], [108, 33], [115, 40, 1], [114, 46, 1],
      [104, 50], [90, 54], [76, 58, 1], [88, 60], [102, 60], [110, 61, 1], [106, 72], [90, 79], [72, 78], [58, 70]]);
    const tail = limb([[-6, 112], [6, 104], [14, 94], [12, 84], [4, 80]], 16, 0);
    const arm = smooth([[80, 92], [90, 96], [98, 102], [106, 104, 1], [101, 107], [107, 111, 1], [99, 112], [92, 108], [82, 102]]);
    const headId = uid("rph"), bodyId = uid("rpb");
    const halo = plates.map((pl) => `<circle cx="${pl[2][0].toFixed(1)}" cy="${pl[2][1].toFixed(1)}" r="10" fill="${c.glow}" opacity="0.35"/>`).join("");
    const teethUp = [[78, 56.6], [83, 55.6], [88, 54.6], [93, 53.4], [98, 52.2], [103, 50.8]].map(([x, y]) => `M${x} ${y}l2 4.2l2 -4.4`).join("");
    const teethLow = [[84, 60], [90, 60], [96, 60.2], [102, 60.6]].map(([x, y]) => `M${x} ${y}l2 -3.6l2 3.8`).join("");
    const art = halo
      + inked(tail, c.hide, 1.6)
      + plates.map((pl) => inked(smooth(pl), c.plate, 1.4)
        + strokeOnly(`M${pt(pl[0].map((v, i) => (v + pl[4][i]) / 2))}L${pt(pl[2])}`, c.glow, 2)).join("")
      + inked(body, c.hide, 1.6)
      + clipped(bodyId, body, path(limb([[58, 66], [70, 84], [80, 104], [86, 124]], 16, 22), c.belly)
        + strokeOnly("M64 76q6 3 11 -1M70 90q6 3 12 -1M76 104q6 3 12 -1", c.dark, 1)
        + strokeOnly("M30 70Q16 84 8 104", c.light, 4, ` opacity="0.6"`)
        + strokeOnly("M28 92q4 -4 8 0M18 104q4 -4 8 0M38 104q4 -4 8 0M40 80q4 -4 8 0", c.dark, 1.2))
      + inked(arm, c.hide, 1.4)
      + strokeOnly("M106 104l2 0.4M107 111l2 0.6", c.tooth, 1.4)
      + inked(head, c.hide, 1.6)
      + clipped(headId, head, `<path d="M76 58L115 43L114 48L106 60Z" fill="${c.mouth}"/>`
        + `<ellipse cx="96" cy="56.5" rx="14" ry="3" fill="${c.plate}" opacity="0.85"/>`
        + `<ellipse cx="88" cy="80" rx="30" ry="10" fill="${c.dark}" opacity="0.55"/>`
        + strokeOnly("M56 34Q70 20 86 24", c.light, 4, ` opacity="0.7"`)
        + strokeOnly("M60 50q4 -3 8 0M64 62q4 -3 8 0M54 58q4 -3 8 0", c.dark, 1.1))
      + strokeOnly(teethUp, c.tooth, 1.3) + strokeOnly(teethLow, c.tooth, 1.3)
      + strokeOnly("M76 58Q92 60 110 61", LINE, 1.4)
      + path("M64 30Q76 22 90 30L84 34Q76 30 66 34Z", c.dark)
      + `<ellipse cx="76" cy="35" rx="4.6" ry="3.4" fill="${c.eye}" stroke="${LINE}" stroke-width="1.1"/>`
      + `<path d="M77 31.8v6.4" stroke="${LINE}" stroke-width="1.6"/>`
      + `<circle cx="78.5" cy="33.5" r="0.8" fill="#fff"/>`
      + `<ellipse cx="104" cy="35" rx="1.6" ry="1" fill="${LINE}"/>`
      + strokeOnly("M90 28l4 -5M96 30l4 -4", c.dark, 1.4);
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a0 = (i / 12) * Math.PI * 2, a1 = a0 + Math.PI / 12;
      return `M70 40L${(70 + Math.cos(a0) * 140).toFixed(1)} ${(40 + Math.sin(a0) * 140).toFixed(1)}L${(70 + Math.cos(a1) * 140).toFixed(1)} ${(40 + Math.sin(a1) * 140).toFixed(1)}Z`;
    }).join("");
    const bg = `<rect width="120" height="120" fill="${c.bg}"/><path d="${rays}" fill="${c.bg2}"/>`
      + `<circle cx="70" cy="40" r="26" fill="none" stroke="${c.glow}" stroke-width="3" opacity="0.6"/>`
      + `<circle cx="70" cy="40" r="40" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0.4"/>`;
    return { bg, art };
  },
  token() {
    const c = RAD;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + spines([[-2, -12], [-9, -4], [-11, 6]], 3, 8, 6, 3, 1, 0.3).map((pl) => inked(smooth(pl), c.plate, 1)).join("")
      + inked(smooth([[-10, 14], [-12, 0], [-6, -10], [2, -13], [9, -11], [15, -6], [15, -2, 1], [4, 0, 1], [13, 2], [12, 7, 1], [2, 9], [-2, 14]]), c.hide, 1.4)
      + `<circle cx="2.5" cy="-7.5" r="2" fill="${c.eye}" stroke="${LINE}" stroke-width="0.8"/>`
      + strokeOnly("M6 -1.2l1 2l1 -2.2M9.5 -1.7l1 2l1 -2.2", c.tooth, 0.9);
  },
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Thalassor: the Atlantean colossus. A statue of green bronze, crowned, with a trident. */

const THA = {
  bronze: "#5c9c84", dark: "#2f5a4c", light: "#97d1b6", worn: "#a8692c", gold: "#d1a13e", goldDark: "#7d5a1c",
  eye: "#eafff8", gem: "#3fd2c7", bg: "#245a78", bg2: "#1b4862", frame: "#10283a",
};

const tha = {
  pal: THA,
  plan() {
    const head = poly([[41, 22], [40, 9], [44, 16.5], [46, 5], [50, 15.5], [52.5, 2], [55.5, 15], [58.5, 5.5], [60.5, 16.5], [64, 9], [62.5, 22]])
      + smooth([[41, 21, 1], [62.5, 21, 1], [63.5, 25], [67, 29.5, 1], [62.5, 31], [61.5, 35], [60.5, 40], [56, 47, 1], [50, 44.5], [45, 40], [42, 33], [40, 27]]);
    const body = smooth([[46, 41], [56, 41], [60, 43], [72, 46, 1], [75, 52], [71, 60], [66, 72], [64, 86, 1], [70, 104], [73, 112, 1], [66, 108.5, 1], [60, 114, 1],
      [53, 108.5, 1], [46, 114, 1], [39, 108.5, 1], [32, 113, 1], [27, 108, 1], [34, 86, 1], [33, 72], [29, 60], [25, 52], [28, 46, 1], [40, 43]]);
    const fistL = [[13, 96], [25, 95], [27, 104], [21, 110], [13, 106]];
    const fistR = [[81, 58], [92, 57], [94, 66], [86, 70], [80, 67]];
    const armL = limb([[27, 49], [22, 64], [20, 80], [19, 97]], 15, 11);
    const armR = limb([[71, 49], [77, 61], [80, 73]], 14, 11) + limb([[80, 75], [84, 69], [87, 63]], 11, 10);
    const shaft = poly([[86.3, 22], [89.3, 22], [89.3, 155], [86.3, 155]]);
    const fork = poly([[79, 10], [80.7, 1], [82.5, 10], [82.5, 18], [87.8, 21], [93, 18], [93, 10], [94.8, 1], [96.6, 10], [96.2, 20], [88, 26.5], [79.4, 20]]);
    const tine = poly([[86.3, 22], [86.3, 8], [85, 8], [87.8, 0], [90.6, 8], [89.3, 8], [89.3, 22]]);
    const legL = smooth([[35, 106, 1], [47, 106, 1], [48, 128], [47, 147], [50, 151], [50.5, 156, 1], [30, 156, 1], [31, 151], [35, 147], [34, 128]]);
    const legR = smooth([[54, 106, 1], [67, 106, 1], [68, 128], [67, 147], [74, 150], [77, 156, 1], [54, 156, 1], [54, 148], [54, 128]]);
    return {
      order: ["legs", "body", "aux", "arms", "head"],
      paths: { head, body, arms: armL + smooth(fistL) + armR + smooth(fistR), legs: legL + legR, aux: shaft + fork + tine },
      parts: { armL, armR, fistL, fistR, legL, legR, shaft, fork, tine },
    };
  },
  figureAnchors: { head: [52, 30, 8], arms: [21, 80, 7], body: [48, 66, 12], legs: [42, 130, 9], aux: [88, 40, 7] },
  figure() {
    const p = this.plan(), q = p.parts, c = THA;
    const bodyId = uid("tb"), headId = uid("th"), legId = uid("tl"), armId = uid("ta");
    const shade = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c.dark}" opacity="0.5"/>`;
    const drips = (pts) => strokeOnly(pts.map(([x, y, l]) => `M${x} ${y}v${l}`).join(""), c.light, 1.2, ` opacity="0.8"`);
    const crownPath = poly([[41, 22], [40, 9], [44, 16.5], [46, 5], [50, 15.5], [52.5, 2], [55.5, 15], [58.5, 5.5], [60.5, 16.5], [64, 9], [62.5, 22]]);
    return inked(q.legL, c.bronze) + inked(q.legR, c.bronze)
      + clipped(legId, q.legL + q.legR, shade(46, 130, 4, 30) + shade(66, 130, 4, 30)
        + strokeOnly("M35 118h12M54 118h13M35 140h12M54 140h13", c.goldDark, 1.4)
        + `<path d="M34 118h13v22h-13zM54 118h13v22h-13z" fill="${c.gold}" opacity="0.85"/>`
        + `<circle cx="41" cy="129" r="3" fill="none" stroke="${c.goldDark}" stroke-width="1"/><circle cx="60.5" cy="129" r="3" fill="none" stroke="${c.goldDark}" stroke-width="1"/>`
        + strokeOnly("M31 151l19 0M55 151l20 0", c.goldDark, 1.4) + drips([[38, 108, 6], [58, 108, 8], [63, 142, 5]]))
      + inked(p.paths.body, c.bronze)
      + clipped(bodyId, p.paths.body, shade(66, 64, 10, 30) + shade(50, 112, 30, 6)
        + strokeOnly("M38 58q8 6 12 0q4 6 12 0", c.dark, 1.3) + strokeOnly("M50 62v22M43 70h14M43 78h14", c.dark, 1)
        + `<path d="M33 85h32v5h-32z" fill="${c.gold}" stroke="${LINE}" stroke-width="1"/>`
        + `<circle cx="49" cy="87.5" r="3.4" fill="${c.gem}" stroke="${LINE}" stroke-width="1"/>`
        + strokeOnly("M37 92l-4 18M44 92l-2 19M51 92v19M58 92l2 19M64 92l4 18", c.dark, 1)
        + strokeOnly("M30 50l4 2M70 49l-3 3", c.worn, 2)
        + drips([[40, 46, 8], [56, 47, 10], [62, 74, 7], [36, 95, 9]]))
      + inked(q.shaft, c.goldDark, 1.2) + inked(q.fork, c.gold, 1.2) + inked(q.tine, c.gold, 1.2)
      + strokeOnly("M82 11l0 7M95 11l0 7M87.8 9v10", c.goldDark, 0.8)
      + inked(q.armL, c.bronze) + inked(q.armR, c.bronze)
      + clipped(armId, q.armL + q.armR, shade(26, 80, 4, 24) + shade(82, 66, 3, 10)
        + `<path d="M15 84h11v8h-11z" fill="${c.gold}" opacity="0.8"/><path d="M78 69l6 -5l3 4l-6 5z" fill="${c.gold}" opacity="0.8"/>`
        + drips([[23, 60, 9], [74, 54, 6]]))
      + inked(smooth(q.fistL), c.bronze, 1.2) + inked(smooth(q.fistR), c.bronze, 1.2)
      + strokeOnly("M16 101h9M16 105h8M83 62l9 -1M84 66l8 -1", c.dark, 0.9)
      + inked(smooth([[19, 44], [29, 42], [36, 47], [33, 56], [22, 56], [17, 51]]), c.gold, 1.2)
      + inked(smooth([[64, 44], [73, 42], [80, 46], [80, 55], [71, 56], [64, 51]]), c.gold, 1.2)
      + strokeOnly("M21 50q6 -3 12 1M67 49q6 -3 11 1", c.goldDark, 1)
      + inked(p.paths.head, c.bronze)
      + clipped(headId, p.paths.head, shade(44, 32, 5, 12) + `<path d="M41 9h24v13h-24z" fill="${c.gold}"/>`
        + strokeOnly("M41 19h22", c.goldDark, 1.2)
        + `<circle cx="52.5" cy="12" r="1.8" fill="${c.gem}" stroke="${LINE}" stroke-width="0.6"/>`
        + strokeOnly("M46 36q2 2 4 0q2 2 4 0q2 2 4 0M46 40q2 2 4 0q2 2 4 0M49 44q2 2 4 0", c.dark, 0.9))
      + inked(crownPath, "none", 1.2)
      + strokeOnly("M52 25.5q3 -2 7 0M61 25.5l3 1", LINE, 1.6)
      + `<path d="M53 27.8q3 -1.6 6 0q-3 1.6 -6 0z" fill="${c.eye}" stroke="${LINE}" stroke-width="0.6"/>`
      + `<path d="M61.6 28l2 0.4l-1.8 0.8z" fill="${c.eye}"/>`
      + strokeOnly("M57 34.5q3 1 5 -0.5", LINE, 1)
      + `<ellipse cx="53" cy="27.8" rx="5" ry="3" fill="${c.eye}" opacity="0.25"/>`;
  },
  portraitAnchors: { head: [70, 58, 12], arms: [106, 106, 9], body: [52, 110, 12], aux: [106, 34, 8], legs: null },
  portrait() {
    const c = THA;
    const crown = poly([[34, 38], [33, 24], [38, 12], [42, 25], [47, 6], [52, 23], [58, 1], [63, 22], [69, 5], [74, 23], [81, 10], [84, 26], [86, 36]]);
    const face = smooth([[36, 34, 1], [86, 34, 1], [88, 44], [95, 55, 1], [89, 59], [87, 66], [84, 80], [76, 93, 1], [62, 95], [48, 89], [40, 74], [36, 58], [34, 46]]);
    const body = smooth([[40, 84], [80, 84], [98, 96], [114, 106], [124, 124, 1], [-4, 124, 1], [4, 106], [20, 94]]);
    const padL = smooth([[-6, 96], [10, 86], [28, 90], [34, 104], [26, 116], [-6, 120]]);
    const padR = smooth([[90, 92], [108, 86], [124, 90], [126, 116], [104, 116], [94, 106]]);
    const headId = uid("tph"), bodyId = uid("tpb");
    const bg = `<rect width="120" height="120" fill="${c.bg}"/>`
      + [20, 40, 60, 80, 100, 120].map((y) => strokeOnly(`M-4 ${y}q15 -8 31 0t31 0t31 0t31 0`, c.bg2, 5)).join("")
      + `<circle cx="20" cy="22" r="2.5" fill="none" stroke="${c.light}" stroke-width="1" opacity="0.6"/><circle cx="14" cy="34" r="1.6" fill="none" stroke="${c.light}" stroke-width="1" opacity="0.6"/>`;
    const art = inked(poly([[104, 120], [104, 22], [108, 22], [108, 120]]), c.goldDark, 1.4)
      + inked(poly([[96, 16], [98, 2], [101, 16], [101, 26], [106, 29], [111, 26], [111, 16], [114, 2], [117, 16], [116, 30], [106, 36], [96, 29]]), c.gold, 1.4)
      + inked(poly([[104, 26], [104, 8], [102, 8], [106, -2], [110, 8], [108, 8], [108, 26]]), c.gold, 1.4)
      + inked(body, c.bronze, 1.6)
      + clipped(bodyId, body, strokeOnly("M36 108q12 8 24 0q12 8 24 0", c.dark, 1.6)
        + `<ellipse cx="96" cy="112" rx="18" ry="14" fill="${c.dark}" opacity="0.45"/>`
        + strokeOnly("M46 90v14M74 90v12", c.light, 2, ` opacity="0.8"`))
      + inked(padL, c.gold, 1.6) + inked(padR, c.gold, 1.6)
      + strokeOnly("M0 104q14 -8 28 -2M98 98q12 -6 24 -2", c.goldDark, 1.4)
      + inked(face, c.bronze, 1.6)
      + clipped(headId, face, `<ellipse cx="40" cy="62" rx="10" ry="30" fill="${c.dark}" opacity="0.45"/>`
        + strokeOnly("M50 80q4 4 8 0q4 4 8 0q4 4 8 0M46 86q4 4 8 0q4 4 8 0q4 4 8 0M54 92q4 4 8 0q4 4 8 0", c.dark, 1.3)
        + strokeOnly("M56 40v10M77 40l2 8", c.light, 2, ` opacity="0.7"`)
        + strokeOnly("M50 70v12M66 74v10", c.light, 1.4, ` opacity="0.7"`))
      + inked(crown, c.gold, 1.6)
      + strokeOnly("M34 32l52 -2", c.goldDark, 1.4)
      + `<circle cx="58" cy="28" r="3" fill="${c.gem}" stroke="${LINE}" stroke-width="1"/>`
      + `<circle cx="42" cy="30" r="2" fill="${c.gem}" stroke="${LINE}" stroke-width="0.8"/><circle cx="76" cy="29" r="2" fill="${c.gem}" stroke="${LINE}" stroke-width="0.8"/>`
      + inked(smooth([[38, 48], [44, 46], [45, 58], [40, 62]]), c.bronze, 1.2)
      + strokeOnly("M58 44q8 -4 16 0M82 44l6 1", LINE, 2.6)
      + `<ellipse cx="66" cy="51" rx="9" ry="5" fill="${c.eye}" opacity="0.3"/>`
      + `<path d="M60 51q6 -4 12 0q-6 3 -12 0z" fill="${c.eye}" stroke="${LINE}" stroke-width="1"/>`
      + `<path d="M84 50.5q3 -2 5 0q-2 2 -5 0z" fill="${c.eye}" stroke="${LINE}" stroke-width="0.8"/>`
      + strokeOnly("M88 46l6 9l-5 3", LINE, 1.2)
      + strokeOnly("M72 68q8 -4 15 0", LINE, 1.6) + strokeOnly("M76 72q5 2 9 0", c.dark, 1.2)
      + strokeOnly("M40 36l3 6M85 36l-2 5", c.worn, 2.4);
    return { bg, art };
  },
  token() {
    const c = THA;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + inked(smooth([[-9, -6, 1], [9, -6, 1], [10, 0], [13, 4, 1], [10, 6], [9, 10], [3, 16, 1], [-5, 14], [-9, 8], [-10, 0]]), c.bronze, 1.3)
      + inked(poly([[-11, -4], [-12, -13], [-7, -8], [-4, -17], [0, -8], [4, -17], [7, -8], [12, -13], [11, -4]]), c.gold, 1.2)
      + `<path d="M-2 0q3 -2 6 0q-3 2 -6 0z" fill="${c.eye}" stroke="${LINE}" stroke-width="0.6"/>`
      + strokeOnly("M-3 9q2 2 4 0q2 2 4 0", c.dark, 1);
  },
};

/* ------------------------------------------------------------------ */
/* The Squamous One, from the City of Angles. Scaled, tentacled, too many eyes. */

const SQU = {
  mantle: "#5b3560", dark: "#3c2142", light: "#7d527a", head: "#8b6f8e", headLight: "#b8a0b6", headDark: "#553a58",
  tent: "#6d3f5e", sucker: "#e7a49b", eye: "#e8f03c", pupil: "#1b0a14", red: "#c2283a", white: "#f4efd8",
  bg: "#8a9440", bg2: "#6b7430", frame: "#22101f",
};



// The head: a wedge whose facets are lit from three directions at once, and a crown of spurs.
const SQ_WEDGE = [[56, 38], [60, 26], [68, 20], [90, 22], [99, 36], [94, 48], [80, 54], [66, 58], [60, 50]];
const SQ_SPURS = [[[59, 28], [63, 23], [52, 9]], [[66, 21], [71, 20], [65, 4]], [[76, 21], [81, 21], [84, 6]], [[85, 22], [89, 23], [100, 11]], [[95, 30], [97, 34], [106, 27]]];


const squ = {
  pal: SQU,
  plan() {
    const body = smooth([[16, 100], [13, 74], [20, 50], [30, 34], [42, 28], [56, 32], [66, 42], [72, 56], [74, 74], [70, 96], [64, 112, 1], [57, 103],
      [50, 115, 1], [43, 104], [35, 116, 1], [28, 104], [20, 112, 1]]);
    const head = poly(SQ_WEDGE) + SQ_SPURS.map(poly).join("");
    const tents = [
      [[[66, 54], [76, 64], [84, 78], [88, 92], [85, 102], [79, 101]], 9],
      [[[60, 58], [63, 76], [68, 94], [75, 108], [85, 113], [91, 107]], 9],
      [[[72, 50], [84, 56], [93, 55], [98, 47], [94, 42]], 7],
    ];
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
        arms: tents.map(([c, w]) => limb(c, w, 0)).join(""),
        legs: feet.map(([c, w]) => limb(c, w, 0)).join(""),
        aux: limb(stalk, 7, 5) + orb,
      },
      parts: { tents, feet, stalk, orb },
    };
  },
  figureAnchors: { head: [80, 34, 8], arms: [84, 84, 7], body: [40, 70, 12], legs: [34, 132, 9], aux: [43, 10, 6] },
  figure() {
    const p = this.plan(), q = p.parts, c = SQU;
    const bodyId = uid("sb"), headId = uid("sh");
    const feet = q.feet.map(([cl, w]) => inked(limb(cl, w, 0), c.dark, 1.3) + suckers(cl, 1, 1.4, c.sucker)).join("");
    const tents = q.tents.map(([cl, w]) => inked(limb(cl, w, 0), c.tent, 1.3) + suckers(cl.map(([x, y]) => [x + 1.5, y]), 1, 1.2, c.sucker)).join("");
    const facets = facetsOf(SQ_WEDGE, [76, 36], [c.headLight, c.headLight, c.head, c.headDark, c.head, c.headDark, c.headLight, c.headDark, c.head]);
    const lines = strokeOnly("M76 36L66 58M84 22L86 30L99 36M60 50L70 44", LINE, 0.9);
    const eyes = [[70, 30, 3.2], [84, 32, 2.6], [92, 41, 2], [66, 46, 2.2], [80, 46, 2.8], [61, 38, 1.5], [90, 27.5, 1.3], [74, 53, 1.5], [96, 35, 1.1]]
      .map(([x, y, r], i) => eyeball(x, y, r, i % 3 !== 1)).join("");
    return inked(limb(q.stalk, 7, 5), c.mantle, 1.3)
      + inked(q.orb, c.white, 1.4) + `<circle cx="44.5" cy="9.5" r="4.6" fill="${c.eye}" stroke="${LINE}" stroke-width="0.8"/>`
      + `<ellipse cx="44.5" cy="9.5" rx="3.8" ry="0.9" fill="${c.pupil}"/>`
      + strokeOnly("M36 7l2.5 1M36.5 12.5l2.5 -1M50 5l-2 1.5M50.5 14l-2 -1", c.red, 0.7)
      + feet
      + inked(p.paths.body, c.mantle)
      + clipped(bodyId, p.paths.body, scaleRows(12, 32, 76, 116, 6, c.dark, 0.9)
        + `<ellipse cx="22" cy="80" rx="8" ry="34" fill="${c.dark}" opacity="0.5"/>`
        + strokeOnly("M40 32Q58 36 66 52", c.light, 3, ` opacity="0.6"`)
        + eyeball(30, 64, 1.6) + eyeball(46, 86, 1.3, false) + eyeball(24, 92, 1.1))
      + inked(p.paths.head, c.head)
      + clipped(headId, poly(SQ_WEDGE), facets + lines)
      + SQ_SPURS.map((sp) => inked(poly(sp), c.headDark, 1.1)).join("")
      + inked(poly(SQ_WEDGE), "none") + eyes
      + strokeOnly("M70 56l1 5l-2 3M76 55l0.5 6l2 3M82 52l1 5", c.tent, 1.6)
      + tents;
  },
  portraitAnchors: { head: [72, 46, 12], arms: [78, 102, 9], body: [24, 104, 12], aux: [22, 24, 8], legs: null },
  portrait() {
    const c = SQU;
    const wedge = [[30, 56], [40, 34], [56, 24], [96, 30], [112, 50], [104, 68], [84, 78], [62, 84], [42, 74]];
    const spurs = [[[38, 38], [46, 30], [24, 4]], [[52, 26], [60, 25], [50, -2]], [[66, 26], [74, 27], [84, 0]], [[84, 29], [92, 30], [112, 6]], [[104, 40], [108, 46], [126, 32]]];
    const head = poly(wedge);
    const mantle = smooth([[-6, 124, 1], [-2, 92], [12, 72], [32, 62], [56, 70], [90, 72], [112, 86], [126, 104], [126, 124, 1]]);
    const tents = [
      [[[64, 74], [62, 90], [58, 104], [52, 114], [44, 116]], 12],
      [[[74, 76], [78, 92], [80, 108], [86, 118], [96, 118]], 12],
      [[[86, 70], [98, 80], [106, 94], [104, 106], [96, 104]], 11],
      [[[54, 70], [44, 82], [36, 94], [34, 106], [40, 110]], 10],
    ];
    const stalk = [[14, 72], [10, 54], [14, 38], [20, 30]];
    const headId = uid("sph"), bodyId = uid("spb");
    const facets = facetsOf(wedge, [70, 52], [c.headLight, c.headLight, c.head, c.headDark, c.head, c.headDark, c.headLight, c.headDark, c.head]);
    const lines = strokeOnly("M70 52L62 84M96 30L98 42L112 50M42 74L56 62M56 24L60 36", LINE, 1.2);
    const eyes = [[60, 40, 6], [84, 40, 4.6], [98, 52, 4], [52, 60, 3.4], [78, 62, 5], [42, 46, 2.6], [104, 42, 2.2], [72, 30, 2.6], [92, 68, 2.6], [64, 74, 2]]
      .map(([x, y, r], i) => eyeball(x, y, r, i % 3 !== 1)).join("");
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
        + strokeOnly("M14 76Q34 62 56 72", c.light, 4, ` opacity="0.6"`) + eyeball(20, 96, 2.4) + eyeball(108, 104, 2))
      + spurs.map((sp) => inked(poly(sp), c.headDark, 1.4)).join("")
      + inked(head, c.head, 1.6)
      + clipped(headId, head, facets + lines)
      + inked(head, "none", 1.6) + eyes
      + tents.map(([cl, w]) => inked(limb(cl, w, 0), c.tent, 1.4) + suckers(cl.map(([x, y]) => [x + 2, y]), 1, 1.8, c.sucker)).join("");
    return { bg, art };
  },
  token() {
    const c = SQU;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + inked(limb([[-4, 4], [-8, 10], [-6, 16]], 5, 0), c.tent, 1) + inked(limb([[4, 4], [8, 10], [12, 13]], 5, 0), c.tent, 1)
      + [[[-9, -6], [-5, -8], [-12, -16]], [[-2, -9], [2, -9], [1, -18]], [[6, -8], [9, -6], [16, -14]]].map((sp) => inked(poly(sp), c.headDark, 1)).join("")
      + inked(poly([[-13, 0], [-9, -8], [-3, -10], [10, -8], [15, -1], [12, 5], [2, 8], [-8, 6]]), c.head, 1.3)
      + path("M-13 0L-9 -8L-3 -10L1 -1Z", c.headLight) + path("M1 -1L10 -8L15 -1L12 5Z", c.headDark)
      + inked(poly([[-13, 0], [-9, -8], [-3, -10], [10, -8], [15, -1], [12, 5], [2, 8], [-8, 6]]), "none", 1.3)
      + eyeball(-5, -3, 2.6) + eyeball(5, -3, 2) + eyeball(-1, 3, 1.5, false) + eyeball(9, 1.5, 1.3);
  },
};

/* ------------------------------------------------------------------ */
/* Dai-Rengo: the sentai giant robot. Crested helmet, visor, chest emblem, primary colours. */

const DAI = {
  red: "#d0302a", redDark: "#8e1b18", blue: "#2350b0", blueDark: "#16336f", white: "#f1eee4", shade: "#b9b5a8",
  gold: "#f2c230", goldDark: "#a87b12", dark: "#2c2d35", visor: "#18222e", glow: "#7fe8ff",
  bg: "#86bde0", bg2: "#64a2cc", frame: "#16336f",
};


const dai = {
  pal: DAI,
  plan() {
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
    const crest = [[49, 15], [43, 1], [48, 1], [56, 15]];
    return {
      order: ["aux", "legs", "body", "arms", "head"],
      paths: {
        head: poly(head) + poly(crest), body: poly(body),
        arms: [...armL, ...armR].map(poly).join(""), legs: poly(legL) + poly(legR), aux: poly(podL) + poly(podR),
      },
      parts: { podL, podR, legL, legR, body, armL, armR, head, crest },
    };
  },
  figureAnchors: { head: [52, 25, 8], arms: [78, 80, 7], body: [50, 66, 12], legs: [58, 136, 9], aux: [20, 26, 6] },
  figure() {
    const q = this.plan().parts, c = DAI;
    const box = (pts, fill, w = 1.3) => inked(poly(pts), fill, w);
    const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const pod = (pts) => box(pts, c.blue) + box([mid(pts[0], pts[1], 0.35), pts[1], mid(pts[1], pts[2], 0.5), mid(pts[4], pts[2], 0.35)], c.gold, 1.1)
      + strokeOnly(`M${pt(mid(pts[0], pts[4], 0.5))}L${pt(mid(pts[2], pts[3], 0.5))}`, c.blueDark, 1.2);
    const leg = (pts) => box(pts, c.dark)
      + box([pts[3], pts[4], pts[9], pts[10]], c.white)
      + box([[pts[11][0] - 1, 123], [pts[2][0] + 1, 123], [pts[2][0] + 1, 130], [(pts[2][0] + pts[11][0]) / 2, 133], [pts[11][0] - 1, 130]], c.gold, 1.1)
      + box([pts[4], pts[5], pts[6], pts[7], pts[8], pts[9]], c.blue)
      + strokeOnly(`M${pts[10][0] + 2} 137h${pts[3][0] - pts[10][0] - 4}M${pts[10][0] + 2} 141h${pts[3][0] - pts[10][0] - 4}`, c.red, 2)
      + strokeOnly(`M${pts[0][0] + 3} 110v10`, "#55565f", 1.2);
    return pod(q.podL) + pod(q.podR)
      + leg(q.legL) + leg(q.legR)
      + box([[36, 104], [48, 104], [48, 112], [36, 112]], c.dark) + box([[53, 104], [65, 104], [65, 112], [53, 112]], c.dark)
      + box(q.body, c.red)
      + box([[36, 84], [64, 84], [62, 96], [38, 96]], c.dark)
      + strokeOnly("M40 88h20M40 92h20", "#55565f", 1.2)
      + box([[38, 96], [62, 96], [70, 104], [68, 110], [32, 110], [30, 104]], c.blue)
      + box([[46, 98], [54, 98], [53, 108], [47, 108]], c.gold, 1)
      + box([[28, 74], [36, 84], [64, 84], [72, 74], [66, 70], [34, 70]], c.white, 1.1)
      + `<path d="M28 46l10 -6h24l12 6l-3 8h-40z" fill="${c.redDark}" opacity="0.35"/>`
      + `<circle cx="50" cy="58" r="8.5" fill="${c.white}" stroke="${LINE}" stroke-width="1.2"/>`
      + `<circle cx="50" cy="58" r="6.8" fill="${c.blue}" stroke="${LINE}" stroke-width="0.8"/>`
      + star(50, 58.5, 6, c.gold)
      + strokeOnly("M30 50l7 -4M70 50l-7 -4", c.white, 2)
      + q.armL.map((pts, i) => box(pts, [c.blue, c.dark, c.white, c.dark][i])).join("")
      + q.armR.map((pts, i) => box(pts, [c.blue, c.dark, c.white, c.dark][i])).join("")
      + strokeOnly("M16 78h16M16 82h16M69 76h18M69 80h18", c.red, 2)
      + strokeOnly("M14 48h21M65 48h22", c.gold, 2)
      + strokeOnly("M19 100h11M73 98h13M19 104h10M73 102h13", "#55565f", 1)
      + box(q.crest, c.gold, 1.1)
      + box(q.head, c.blue)
      + box([[44, 21], [61, 20], [61, 26], [44, 27]], c.visor, 1)
      + strokeOnly("M46 23.6l14 -0.8", c.glow, 1.6)
      + box([[47, 27], [61, 26], [60, 31], [56, 35], [48, 35]], c.white, 1)
      + strokeOnly("M51 29.5v3.5M54 29.3v4M57 29v3", c.dark, 0.9)
      + box([[42, 22], [36, 15], [42, 28]], c.gold, 1) + box([[61, 20], [67, 12], [61.5, 27]], c.gold, 1);
  },
  portraitAnchors: { head: [66, 50, 12], arms: [108, 104, 8], body: [44, 108, 12], aux: [10, 64, 8], legs: null },
  portrait() {
    const c = DAI;
    const box = (pts, fill, w = 1.6) => inked(poly(pts), fill, w);
    let stripes = "";
    for (let i = -6; i < 12; i++) stripes += `M${i * 14} 0l60 120h7l-60 -120z`;
    const bg = `<rect width="120" height="120" fill="${c.bg}"/><path d="${stripes}" fill="${c.bg2}"/>`
      + `<circle cx="62" cy="46" r="40" fill="none" stroke="#fff" stroke-width="2" opacity="0.4"/>`;
    const art = box([[22, 92], [-8, 30], [0, 62], [8, 96]], c.blue) + box([[8, 62], [-8, 30], [2, 50]], c.gold, 1.4)
      + box([[100, 92], [128, 28], [122, 60], [114, 96]], c.blue) + box([[114, 60], [128, 28], [119, 48]], c.gold, 1.4)
      + box([[48, 76], [80, 76], [82, 92], [46, 92]], c.dark)
      + strokeOnly("M50 82h30M50 86h30", "#55565f", 1.4)
      + box([[10, 96], [40, 86], [86, 86], [112, 96], [124, 126], [-4, 126]], c.red)
      + box([[38, 88], [88, 88], [80, 98], [46, 98]], c.white, 1.3)
      + `<circle cx="64" cy="110" r="12" fill="${c.white}" stroke="${LINE}" stroke-width="1.6"/>`
      + `<circle cx="64" cy="110" r="9.5" fill="${c.blue}" stroke="${LINE}" stroke-width="1"/>`
      + star(64, 110.5, 8.5, c.gold, 1.1)
      + box([[-6, 92], [14, 84], [32, 92], [30, 116], [-6, 120]], c.blue) + strokeOnly("M-4 100l34 -2", c.gold, 3)
      + box([[94, 92], [112, 84], [126, 90], [126, 116], [98, 116]], c.blue) + strokeOnly("M96 100l30 -2", c.gold, 3)
      + box([[56, 20], [47, 0], [57, 0], [72, 20]], c.gold, 1.4)
      + box([[30, 62], [30, 36], [38, 24], [52, 18], [74, 18], [84, 24], [92, 36], [92, 58], [86, 70], [74, 78], [46, 78], [34, 72]], c.blue)
      + `<path d="M34 36l6 -10l12 -6l20 0l-6 8l-26 4z" fill="#fff" opacity="0.25"/>`
      + box([[34, 40], [92, 38], [93, 52], [36, 54]], c.visor, 1.4)
      + strokeOnly("M40 46.5l48 -1.6", c.glow, 3) + strokeOnly("M40 46.5l48 -1.6", "#fff", 1)
      + box([[48, 56], [90, 54], [86, 68], [74, 76], [52, 76]], c.white, 1.4)
      + strokeOnly("M60 62v8M66 61.6v10M72 61.3v9M78 61v7", c.dark, 1.4)
      + box([[30, 40], [16, 28], [30, 54]], c.gold, 1.4) + box([[92, 40], [104, 26], [93, 54]], c.gold, 1.4)
      + strokeOnly("M38 24l-4 12", c.white, 2, ` opacity="0.5"`);
    return { bg, art };
  },
  token() {
    const c = DAI;
    return `<circle r="18" fill="${c.bg}" stroke="${LINE}" stroke-width="1.6"/>`
      + inked(poly([[-2, -9], [-7, -17], [0, -17], [5, -9]]), c.gold, 1.1)
      + inked(poly([[-11, 6], [-11, -4], [-7, -9], [7, -9], [11, -4], [11, 6], [6, 12], [-6, 12]]), c.blue, 1.4)
      + inked(poly([[-11, -4], [-16, -10], [-11, 2]]), c.gold, 1) + inked(poly([[11, -4], [16, -10], [11, 2]]), c.gold, 1)
      + inked(poly([[-10, -3], [10, -3], [10, 2], [-10, 2]]), c.visor, 1)
      + strokeOnly("M-8 -0.5h16", c.glow, 1.6)
      + inked(poly([[-6, 3], [6, 3], [5, 9], [-5, 9]]), c.white, 1);
  },
};

const BASE_ART = { radiosaur, thalassor: tha, squamous: squ, dairengo: dai };

// A look id is a base kaiju id or a variant id. Names are looked up with hasOwn, so
// "constructor" is not a look.
function art(id) {
  if (Object.hasOwn(BASE_ART, id)) return BASE_ART[id];
  if (Object.hasOwn(VARIANT_ART, id)) return VARIANT_ART[id];
  throw new Error(`no art for kaiju ${id}`);
}

const planCache = new Map();
function planOf(id) {
  if (!planCache.has(id)) planCache.set(id, art(id).plan());
  return planCache.get(id);
}

function label(id, what) {
  return `role="img" aria-label="${id} ${what}"`;
}

export function portrait(id, { parts } = {}) {
  const k = art(id);
  const { bg, art: body } = k.portrait();
  const clip = uid("pf");
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" ${label(id, "portrait")} class="portrait">`
    + `<clipPath id="${clip}"><rect x="3" y="3" width="114" height="114" rx="3"/></clipPath>`
    + `<g clip-path="url(#${clip})">${bg}${body}${damageLayer(parts, k.portraitAnchors, id + "p")}</g>`
    + `<rect x="2" y="2" width="116" height="116" rx="4" fill="none" stroke="${k.pal.frame}" stroke-width="3"/>`
    + `<rect x="6" y="6" width="108" height="108" rx="2" fill="none" stroke="#f4ecd4" stroke-width="1" opacity="0.7"/>`
    + `</svg>`;
}

export function silhouette(id, { parts } = {}) {
  const p = planOf(id);
  const body = p.order.map((part) => {
    const s = stateOf(parts, part);
    return `<path data-part="${part}" class="part s-${s}" d="${p.paths[part]}" fill="${STATE_FILL[s]}" stroke-width="1.6" stroke-linejoin="round" style="stroke: var(--ink, #1b1712)"/>`;
  }).join("");
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" ${label(id, "silhouette")} class="silhouette">${body}</svg>`;
}

export function figure(id, { flip = false, parts } = {}) {
  const k = art(id);
  const inner = k.figure(parts) + damageLayer(parts, k.figureAnchors, id + "f");
  const turn = flip ? ` transform="translate(200,0) scale(-1,1)"` : "";
  const rim = uid("rim");
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ${label(id, "figure")} class="figure">${rimFilter(rim)}`
    + `<g${turn}><ellipse cx="100" cy="194" rx="62" ry="5" fill="#000" opacity="0.25"/>`
    + `<g transform="translate(40,3) scale(1.2)" filter="url(#${rim})">${inner}</g></g></svg>`;
}

// The map token, inside a circle of radius 18 at 0,0. No facing mark: see facingNotch.
export function token(id) {
  return `<g class="kaiju-token" data-kaiju="${id}">${art(id).token()}</g>`;
}

// A facing mark pointing east (0 degrees) at the token's rim. The board rotates it:
// <g transform="rotate(deg)">facingNotch()</g>.
export function facingNotch(r = 18) {
  return `<g class="facing-notch"><path d="M${r + 5} 0L${r - 3} -6L${r - 3} 6Z" stroke-width="1.4" stroke-linejoin="round" style="fill: var(--accent, #7a2e1c); stroke: var(--ink, #1b1712)"/></g>`;
}

export { PARTS };
// The helpers the variants' drawings share, so one module can draw with the other's tools.
export { LINE, uid, path, inked, strokeOnly, shift, clipped, spines, eyeball, scaleRows, suckers, facetsOf, star };
export { smooth, poly, limb, pt, rimFilter } from "./defs.js";
