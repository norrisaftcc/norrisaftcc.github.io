// The city of Mission 2, grown from a seed: MazeBuilder's Sidewinder lays out the streets, braid
// joins the dead ends, and the blocks between fill with buildings. A port of
// py_port/algorithms/sidewinder.py and braid.py; every die goes through randomInt, as in the
// Python's Grid.random_int, so the same seed grows the same maze in either language.

import { Mulberry32 } from "./rng.js";

export const NORTH = 1;
export const SOUTH = 2;
export const EAST = 4;
export const WEST = 8;

const OPPOSITE = { [NORTH]: SOUTH, [SOUTH]: NORTH, [EAST]: WEST, [WEST]: EAST };

// The order of MazeBuilder's Grid.DIRECTION_OFFSETS: [direction, row offset, col offset].
const OFFSETS = [
  [NORTH, -1, 0],
  [SOUTH, 1, 0],
  [EAST, 0, 1],
  [WEST, 0, -1],
];

// A square maze grid: cells hold their links as a bit mask of directions.
export class Grid {
  constructor(rows, cols, rng) {
    this.rows = rows;
    this.cols = cols;
    this.rng = rng;
    this.links = Array.from({ length: rows }, () => new Array(cols).fill(0));
  }

  randomInt(low, high) {
    return this.rng.randint(low, high);
  }

  isValid(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  linked(row, col, dir) {
    return (this.links[row][col] & dir) !== 0;
  }

  linkCount(row, col) {
    let n = 0;
    for (const [dir] of OFFSETS) if (this.linked(row, col, dir)) n += 1;
    return n;
  }

  linkCells(row, col, dir) {
    if (!this.isValid(row, col)) return;
    const [, dr, dc] = OFFSETS.find(([d]) => d === dir);
    const r2 = row + dr;
    const c2 = col + dc;
    if (!this.isValid(r2, c2)) return;
    this.links[row][col] |= dir;
    this.links[r2][c2] |= OPPOSITE[dir];
  }
}

// Row by row: runs of cells joined east, each run closed by a link north from one of its cells.
// The top row is one unbroken corridor: Sidewinder's tell.
export function sidewinder(grid) {
  for (let c = 0; c < grid.cols - 1; c++) grid.linkCells(0, c, EAST);
  for (let r = 1; r < grid.rows; r++) {
    let run = [];
    for (let c = 0; c < grid.cols; c++) {
      run.push(c);
      const atEasternBoundary = c === grid.cols - 1;
      if (atEasternBoundary || grid.randomInt(0, 1) === 0) {
        const pick = run[grid.randomInt(0, run.length - 1)];
        grid.linkCells(r, pick, NORTH);
        run = [];
      } else {
        grid.linkCells(r, c, EAST);
      }
    }
  }
  return grid;
}

// Each dead end, with chance p, is joined to a neighbour (another dead end first). Returns the
// number of walls knocked out.
export function braid(grid, p = 1.0) {
  if (!(p >= 0 && p <= 1)) throw new Error("p must be between 0 and 1");
  const deadEnds = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) if (grid.linkCount(r, c) === 1) deadEnds.push([r, c]);
  }
  let knocked = 0;
  for (const [r, c] of deadEnds) {
    if (grid.linkCount(r, c) !== 1) continue;
    if (p < 1 && grid.randomInt(1, 100) > Math.round(p * 100)) continue;
    const unlinked = [];
    for (const [dir, dr, dc] of OFFSETS) {
      const r2 = r + dr;
      const c2 = c + dc;
      if (grid.isValid(r2, c2) && !grid.linked(r, c, dir)) unlinked.push([dir, r2, c2]);
    }
    if (unlinked.length === 0) continue;
    const ends = unlinked.filter(([, r2, c2]) => grid.linkCount(r2, c2) === 1);
    const best = ends.length ? ends : unlinked;
    const [dir] = best[grid.randomInt(0, best.length - 1)];
    grid.linkCells(r, c, dir);
    knocked += 1;
  }
  return knocked;
}

// The maze alone, before it is drawn as streets.
export function growMaze({ seed, rows, cols, braid: p = 0.5, rng = new Mulberry32(seed) }) {
  const grid = new Grid(rows, cols, rng);
  sidewinder(grid);
  if (p) braid(grid, p);
  return grid;
}

// {terrain: [rows strings], features: [rows strings]} in map glyphs, row 0 at the top.
// Coarse cell (i, j) is the road hex (2i, 2j); a link east paves (2i+1, 2j), a link south
// paves (2i, 2j+1). Every other hex is a block: a building, or now and then a park.
export function growCity({ seed, cols = 12, rows = 11, braid: p = 0.5 } = {}) {
  const rng = new Mulberry32(seed);
  const grid = growMaze({ rows: Math.ceil(rows / 2), cols: Math.ceil(cols / 2), braid: p, rng });
  const road = Array.from({ length: rows }, () => new Array(cols).fill(false));
  for (let j = 0; j < grid.rows; j++) {
    for (let i = 0; i < grid.cols; i++) {
      const col = 2 * i;
      const row = 2 * j;
      if (row < rows && col < cols) road[row][col] = true;
      if (grid.linked(j, i, EAST) && col + 1 < cols && row < rows) road[row][col + 1] = true;
      if (grid.linked(j, i, SOUTH) && row + 1 < rows && col < cols) road[row + 1][col] = true;
    }
  }
  const midCol = (cols - 1) / 2;
  const midRow = (rows - 1) / 2;
  const terrain = [];
  const features = [];
  for (let row = 0; row < rows; row++) {
    let t = "";
    let f = "";
    for (let col = 0; col < cols; col++) {
      if (road[row][col]) {
        t += "=";
        f += ".";
        continue;
      }
      if (rng.roll(100) <= 8) {
        t += '"';
        f += ".";
        continue;
      }
      // closeness: 1 at the middle of the city, 0 at its corners.
      const closeness = 1 - Math.max(Math.abs(col - midCol) / (midCol + 1), Math.abs(row - midRow) / (midRow + 1));
      let height = 1;
      if (rng.roll(100) <= 25 + Math.round(60 * closeness)) height += 1;
      if (rng.roll(100) <= Math.round(70 * closeness)) height += 1;
      t += ".";
      f += String(height);
    }
    terrain.push(t);
    features.push(f);
  }
  return { terrain, features };
}
