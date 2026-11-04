// The hex map as one SVG: terrain and structures, highlights, the pieces, and a layer of tap
// targets on top. Terrain is drawn once and redrawn hex by hex as structures fall.

import * as H from "../hex.js";
import { hexTile, structure as structureArt } from "../art/terrain.js";
import { token as kaijuToken, facingNotch } from "../art/kaiju.js";
import { kaijuDef } from "../data/variants.js";
import { token as unitToken } from "../art/units.js";
import { STRUCTURES } from "../data/terrain.js";
import { UNITS } from "../data/units.js";

export const SIZE = 24;
const W = Math.sqrt(3) * SIZE;
const f1 = (n) => (Math.round(n * 10) / 10).toString();

export function center(key) {
  const { col, row } = H.keyToOffset(key);
  return { x: W * (col + 0.5 * (row & 1)) + W / 2, y: SIZE * 1.5 * row + SIZE };
}

function points(key, size) {
  const { x, y } = center(key);
  return H.corners(x, y, size).map((p) => `${f1(p[0])},${f1(p[1])}`).join(" ");
}

function hexPath(key, size) {
  const { x, y } = center(key);
  return "M" + H.corners(x, y, size).map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L") + "Z";
}

// The edge of a hex that faces direction d: between corners (6 - d) % 6 and the next.
function edge(key, d, size) {
  const { x, y } = center(key);
  const c = H.corners(x, y, size);
  const i = (6 - d) % 6;
  const a = c[i];
  const b = c[(i + 1) % 6];
  return `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`;
}

function hexSignature(hex) {
  const st = hex.structure;
  return `${hex.terrain}|${st ? st.type : ""}|${st && st.hp < st.maxHp ? "d" : ""}`;
}

function hexArt(hex) {
  const st = hex.structure;
  const s = st ? structureArt(st.type, STRUCTURES[st.type].height, { damaged: st.hp < st.maxHp }) : "";
  return hexTile(hex.terrain, SIZE) + s;
}

function unitPiece(u) {
  const def = UNITS[u.type];
  const { x, y } = center(u.at);
  const frac = Math.max(0, Math.min(1, u.hp / def.hp));
  const bar = `<rect x="-11" y="14.5" width="22" height="4" rx="1" style="fill: var(--ink)" opacity="0.8"/>`
    + `<rect x="-10" y="15.5" width="${f1(20 * frac)}" height="2" style="fill: ${frac > 0.5 ? "var(--good)" : "var(--danger)"}"/>`;
  const flee = u.panicked > 0
    ? `<g transform="translate(11,-11)"><circle r="6" style="fill: var(--paper); stroke: var(--ink)" stroke-width="1"/><path d="M-3 -2.5l2.5 2.5l-2.5 2.5M0.5 -2.5l2.5 2.5l-2.5 2.5" fill="none" style="stroke: var(--ink)" stroke-width="1.2"/></g>`
    : "";
  return `<g class="piece unit${u.panicked > 0 ? " panicked" : ""}${def.air ? " air" : ""}" transform="translate(${f1(x)},${f1(y)})">${unitToken(u.type)}${bar}${flee}</g>`;
}

function kaijuPiece(k, actor) {
  const { x, y } = center(k.at);
  const ring = actor === "rival"
    ? `<circle r="20.5" fill="none" style="stroke: var(--danger)" stroke-width="2.4" stroke-dasharray="5 3"/>`
    : `<circle r="20.5" fill="none" style="stroke: var(--ink)" stroke-width="1.4"/>`;
  return `<g class="piece kaiju ${actor}" transform="translate(${f1(x)},${f1(y)})">${ring}${kaijuToken(kaijuDef(k.id, k.variant).look)}`
    + `<g transform="rotate(${-60 * k.facing})">${facingNotch()}</g></g>`;
}

export function createBoard(host, { onHex, onFace }) {
  let built = null;
  const sigs = new Map();
  const nodes = new Map();
  let layers = null;

  host.addEventListener("click", (e) => {
    const dir = e.target.closest("[data-dir]");
    if (dir) return onFace(Number(dir.dataset.dir));
    const hex = e.target.closest("[data-key]");
    if (hex) onHex(hex.dataset.key);
  });

  function build(state) {
    const { cols, rows } = state.map;
    const w = W * (cols + 0.5);
    const h = SIZE * 1.5 * (rows - 1) + SIZE * 2;
    const keys = Object.keys(state.map.hexes);
    let terrain = "";
    let taps = "";
    for (const k of keys) {
      const { x, y } = center(k);
      terrain += `<g data-key="${k}" transform="translate(${f1(x)},${f1(y)})">${hexArt(state.map.hexes[k])}</g>`;
      taps += `<polygon class="tap" data-key="${k}" points="${points(k, SIZE)}"/>`;
      sigs.set(k, hexSignature(state.map.hexes[k]));
    }
    host.innerHTML = `<svg class="board-svg" viewBox="0 0 ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The map: tap a hex to inspect it or choose it">`
      + `<defs><pattern id="hl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
      + `<rect width="6" height="6" style="fill: var(--danger)" opacity="0.22"/><rect width="2.2" height="6" style="fill: var(--danger)" opacity="0.55"/></pattern></defs>`
      + `<g class="b-terrain">${terrain}</g><g class="b-marks"></g><g class="b-pieces"></g><g class="b-taps">${taps}</g><g class="b-over"></g></svg>`;
    const svg = host.firstElementChild;
    layers = {
      svg,
      terrain: svg.querySelector(".b-terrain"),
      marks: svg.querySelector(".b-marks"),
      pieces: svg.querySelector(".b-pieces"),
      over: svg.querySelector(".b-over"),
    };
    nodes.clear();
    for (const g of layers.terrain.children) nodes.set(g.dataset.key, g);
    built = `${state.mission}|${state.seed}|${cols}x${rows}|${keys.length}`;
  }

  function renderTerrain(state) {
    for (const [k, hex] of Object.entries(state.map.hexes)) {
      const sig = hexSignature(hex);
      if (sigs.get(k) === sig) continue;
      sigs.set(k, sig);
      nodes.get(k).innerHTML = hexArt(hex);
    }
  }

  function renderMarks(state, m) {
    const k = state.kaiju;
    const live = !state.result && !k.withdrawn && k.parts.body.hp > 0;
    let out = "";
    for (const key of state.retreat) {
      out += `<polygon points="${points(key, SIZE - 4)}" fill="none" style="stroke: var(--accent)" stroke-width="1.6" stroke-dasharray="3 3" opacity="0.85"/>`;
    }
    if (state.objective && state.objective.at) {
      const { x, y } = center(state.objective.at);
      out += `<g class="objective" transform="translate(${f1(x)},${f1(y)})" style="stroke: var(--danger)" fill="none" stroke-width="2">`
        + `<circle r="19" stroke-dasharray="6 4"/><path d="M0 -24v8M0 16v8M-24 0h8M16 0h8"/></g>`;
    }
    if (m.lit) {
      const lit = new Set(m.lit);
      let shade = "";
      for (const key of Object.keys(state.map.hexes)) if (!lit.has(key) && key !== k.at) shade += hexPath(key, SIZE + 0.5);
      out += `<path d="${shade}" style="fill: var(--shade)"/>`;
      if (m.litKind !== "move") {
        const tone = m.litKind === "teleport" ? "var(--accent)" : "var(--danger)";
        for (const key of lit) out += `<polygon points="${points(key, SIZE - 2.5)}" fill="none" style="stroke: ${tone}" stroke-width="2.2"/>`;
      }
    }
    if (m.pattern) for (const key of m.pattern) out += `<polygon points="${points(key, SIZE - 1)}" style="fill: url(#hl-hatch); stroke: var(--danger)" stroke-width="2.4"/>`;
    if (live) {
      const rear = [2, 3, 4].map((d) => edge(k.at, (k.facing + d) % 6, SIZE - 1.5)).join("");
      out += `<path class="rear-arc" d="${rear}" fill="none" style="stroke: var(--danger)" stroke-width="3.2" stroke-linecap="round" opacity="0.55"/>`;
    }
    if (m.path && m.path.length) {
      const pts = [k.at, ...m.path].map((key) => center(key)).map((p) => `${f1(p.x)},${f1(p.y)}`).join(" ");
      out += `<polyline points="${pts}" fill="none" style="stroke: var(--paper)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
      out += `<polyline points="${pts}" fill="none" style="stroke: var(--ink)" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (m.selected && state.map.hexes[m.selected]) {
      out += `<polygon points="${points(m.selected, SIZE - 1.5)}" fill="none" style="stroke: var(--ink)" stroke-width="2.6"/>`;
      out += `<polygon points="${points(m.selected, SIZE - 4.5)}" fill="none" style="stroke: var(--paper)" stroke-width="1.2"/>`;
    }
    layers.marks.innerHTML = out;

    let over = "";
    if (m.tag && m.tagAt) {
      const { x, y } = center(m.tagAt);
      const w = 10 + m.tag.length * 9.5;
      const ty = Math.max(12, y - 26);
      over += `<g class="tag" transform="translate(${f1(x)},${f1(ty)})"><rect x="${f1(-w / 2)}" y="-11" width="${f1(w)}" height="21" rx="3" style="fill: var(--ink)"/>`
        + `<text y="5" text-anchor="middle" style="fill: var(--paper)">${m.tag}</text></g>`;
    }
    if (m.arrows && live) {
      const { x, y } = center(k.at);
      for (let d = 0; d < 6; d++) {
        const a = (-60 * d * Math.PI) / 180;
        const ax = x + Math.cos(a) * 36;
        const ay = y + Math.sin(a) * 36;
        const on = d === k.facing;
        over += `<g class="arrow${on ? " on" : ""}" data-dir="${d}" transform="translate(${f1(ax)},${f1(ay)})">`
          + `<circle r="17" style="fill: ${on ? "var(--ink)" : "var(--panel)"}; stroke: var(--ink)" stroke-width="1.8"/>`
          + `<g transform="rotate(${-60 * d})"><path d="M15 0L8 -6V6Z" style="fill: ${on ? "var(--paper)" : "var(--ink)"}"/></g>`
          + `<text x="-2" y="5" text-anchor="middle" style="fill: ${on ? "var(--paper)" : "var(--ink)"}">${d + 1}</text></g>`;
      }
    }
    layers.over.innerHTML = over;
  }

  function renderPieces(state) {
    let out = "";
    for (const u of state.units) if (!UNITS[u.type].air) out += unitPiece(u);
    for (const actor of ["rival", "kaiju"]) {
      const k = state[actor];
      if (k && !k.withdrawn && k.parts.body.hp > 0) out += kaijuPiece(k, actor);
    }
    for (const u of state.units) if (UNITS[u.type].air) out += unitPiece(u);
    layers.pieces.innerHTML = out;
  }

  return {
    render(state, marks = {}) {
      const id = `${state.mission}|${state.seed}|${state.map.cols}x${state.map.rows}|${Object.keys(state.map.hexes).length}`;
      if (built !== id) build(state);
      else renderTerrain(state);
      renderMarks(state, marks);
      renderPieces(state);
    },
    reset() {
      built = null;
    },
  };
}
