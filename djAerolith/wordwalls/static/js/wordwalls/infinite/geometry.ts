/**
 * @fileOverview Client-side mirror of wordwalls/infinite_perm.py's geometry.
 *
 * Only the cell <-> (x, y) <-> rectangle mapping lives here. The seeded shuffle
 * that decides *which* alphagram sits in a cell is server-side only, because the
 * wall, the bitmap and the minimap are all indexed by cell rather than by
 * alphagram rank -- so there is no permutation to keep in sync across languages.
 */

/**
 * Defaults for a brand-new wall. Every existing wall carries its own dimensions
 * in the payload below, and all the helpers here read them from that payload --
 * retuning these constants must never re-interpret a wall already in progress.
 */
export const DEFAULT_CHUNK_W = 8;
export const DEFAULT_CHUNK_H = 16;
export const DEFAULT_CHUNK_SIZE = DEFAULT_CHUNK_W * DEFAULT_CHUNK_H;

export interface WallGeometry {
  numAlphagrams: number;
  chunkCols: number;
  chunkRows: number;
  numChunks: number;
  chunkWidth: number;
  chunkHeight: number;
  chunkSize: number;
  width: number;
  height: number;
}

/** Cell index -> (x, y) on the wall. */
export function cellToXY(geo: WallGeometry, g: number): [number, number] {
  const chunkIndex = Math.floor(g / geo.chunkSize);
  const local = g % geo.chunkSize;
  const chunkRow = Math.floor(chunkIndex / geo.chunkCols);
  const chunkCol = chunkIndex % geo.chunkCols;
  const ly = Math.floor(local / geo.chunkWidth);
  const lx = local % geo.chunkWidth;
  return [chunkCol * geo.chunkWidth + lx, chunkRow * geo.chunkHeight + ly];
}

/** (x, y) on the wall -> cell index. Inverse of cellToXY. */
export function xyToCell(geo: WallGeometry, x: number, y: number): number {
  const chunkCol = Math.floor(x / geo.chunkWidth);
  const lx = x % geo.chunkWidth;
  const chunkRow = Math.floor(y / geo.chunkHeight);
  const ly = y % geo.chunkHeight;
  const chunkIndex = chunkRow * geo.chunkCols + chunkCol;
  return chunkIndex * geo.chunkSize + ly * geo.chunkWidth + lx;
}

/** Which rectangle covers (x, y), or null if that is off the wall. */
export function chunkAtXY(
  geo: WallGeometry,
  x: number,
  y: number,
): number | null {
  if (x < 0 || y < 0 || x >= geo.width || y >= geo.height) {
    return null;
  }
  const chunkIndex = Math.floor(y / geo.chunkHeight) * geo.chunkCols
    + Math.floor(x / geo.chunkWidth);
  return chunkIndex < geo.numChunks ? chunkIndex : null;
}

/** Top-left cell coordinates of a rectangle. */
export function chunkOrigin(geo: WallGeometry, chunk: number): [number, number] {
  return [
    (chunk % geo.chunkCols) * geo.chunkWidth,
    Math.floor(chunk / geo.chunkCols) * geo.chunkHeight,
  ];
}

/** Slot a cell occupies inside its own rectangle. */
export function cellToSlot(geo: WallGeometry, g: number): number {
  return g % geo.chunkSize;
}

/** First cell index of a rectangle. */
export function chunkBase(geo: WallGeometry, chunk: number): number {
  return chunk * geo.chunkSize;
}

export function decodeBitmap(b64: string): Uint8Array {
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

/** Bits are LSB-first within each byte, matching infinite_perm.get_bit. */
export function getBit(bitmap: Uint8Array, g: number): boolean {
  const byte = bitmap[g >> 3];
  if (byte === undefined) {
    return false;
  }
  return ((byte >> (g & 7)) & 1) === 1;
}

/**
 * Copy of the bitmap with cell g marked solved.
 *
 * Returns a new array rather than mutating so the canvas's memoized image
 * actually sees the change; this lets a solved rectangle light up on the minimap
 * immediately instead of waiting for a server round trip.
 */
export function withBitSet(bitmap: Uint8Array, g: number): Uint8Array {
  const next = new Uint8Array(bitmap);
  const index = g >> 3;
  if (index < next.length) {
    next[index] |= 1 << (g & 7);
  }
  return next;
}

/**
 * How a rectangle is named to the player.
 *
 * Rectangles are 0-indexed everywhere internally -- cell index, bitmap, chunk
 * rows -- but "Rectangle 0" reads as a bug, so display is 1-based. Shared by the
 * hover tooltip and the zoomed-in caption so the two can't drift.
 */
export function rectangleLabel(chunk: number, numChunks: number): string {
  return `Rectangle ${(chunk + 1).toLocaleString()} of ${numChunks.toLocaleString()}`;
}

/** Comfortably wider than any platform's scrollbar. */
export const SCROLLBAR_SLOP = 24;

/**
 * Fit a wall into a box using square cells.
 *
 * Cells must stay square, and every view must use this, or the minimap ends up a
 * differently-stretched picture of the overview rather than a scaled copy.
 * Pass Infinity as budgetH to let the wall grow as tall as it likes.
 */
export function fitCell(
  width: number,
  height: number,
  budgetW: number,
  budgetH: number,
  maxCell: number,
) {
  const cell = Math.max(
    1,
    Math.min(
      maxCell,
      Math.floor(Math.min(budgetW / Math.max(1, width), budgetH / Math.max(1, height))),
    ),
  );
  return { cellW: cell, cellH: cell };
}

/**
 * Settle a freshly measured container width against the one in use.
 *
 * Deliberately asymmetric. A taller canvas summons a vertical scrollbar, which
 * narrows the container, which shrinks the cells, which shortens the canvas,
 * which dismisses the scrollbar -- a symmetric rule oscillates forever by about
 * a scrollbar's width, and that is exactly the "Maximum update depth exceeded"
 * loop this guards against.
 *
 * Shrinking is always honoured, because refusing it would let the canvas
 * overflow horizontally. Growing must clear the slop, which breaks the cycle:
 * once narrowed we stay narrowed, wasting at most a scrollbar's width.
 */
export function settleWidth(
  prev: number,
  measured: number,
  slop: number = SCROLLBAR_SLOP,
): number {
  if (measured < prev) {
    return measured;
  }
  return measured - prev > slop ? measured : prev;
}

/** Window width the wordwalls upscale settings treat as 1:1. */
export const UPSCALE_BASELINE = 1200;

/**
 * How far the zoomed-in board may scale up, per the player's upscale setting.
 *
 * Matches the curves the main wordwalls board uses (gamearea.tsx) so the setting
 * means the same thing in both games. Never returns below 1: this is a ceiling
 * on *growth* only -- shrinking to fit a narrow viewport is decided separately,
 * and letting the preference shrink the board would fight that.
 */
export function upscaleCap(mode: string, windowWidth: number): number {
  switch (mode) {
    case 'large':
      return Math.max(1, windowWidth / UPSCALE_BASELINE);
    case 'small':
      return Math.max(1, (windowWidth + UPSCALE_BASELINE) / (2 * UPSCALE_BASELINE));
    default: // 'none'
      return 1;
  }
}

/**
 * Scale for the zoomed-in rectangle: fill the width, but no more than the
 * player's upscale setting allows, and never so small it stops being readable.
 */
export function boardScale(
  boardWidth: number,
  availableWidth: number,
  mode: string,
  windowWidth: number,
  minScale = 0.3,
): number {
  const fit = availableWidth / boardWidth;
  return Math.max(minScale, Math.min(fit, upscaleCap(mode, windowWidth)));
}

export type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * The rectangle one step in a direction, or null at the wall's edge.
 *
 * Steps in rectangle-grid space rather than by +/-1 on the index, so moving off
 * the left edge is a dead end instead of silently wrapping onto the end of the
 * row above.
 */
export function neighbourChunk(
  geo: WallGeometry,
  chunk: number,
  dir: Direction,
): number | null {
  let col = chunk % geo.chunkCols;
  let row = Math.floor(chunk / geo.chunkCols);
  if (dir === 'left') col -= 1;
  if (dir === 'right') col += 1;
  if (dir === 'up') row -= 1;
  if (dir === 'down') row += 1;
  if (col < 0 || col >= geo.chunkCols || row < 0) {
    return null;
  }
  const next = row * geo.chunkCols + col;
  // The last row is usually short, so an in-grid position can still be past the
  // end of the wall.
  return next < geo.numChunks ? next : null;
}

/** Which way a jump between two rectangles travels, for the slide animation. */
export function slideDirection(
  geo: WallGeometry,
  from: number,
  to: number,
): Direction {
  const dCol = (to % geo.chunkCols) - (from % geo.chunkCols);
  const dRow = Math.floor(to / geo.chunkCols) - Math.floor(from / geo.chunkCols);
  if (Math.abs(dCol) >= Math.abs(dRow)) {
    return dCol >= 0 ? 'right' : 'left';
  }
  return dRow >= 0 ? 'down' : 'up';
}

/**
 * Centre of a rectangle as a percentage of the wall, for transform-origin --
 * this is what makes the zoom-out appear to pull back from the rectangle you
 * were actually in rather than from the middle of the wall.
 */
export function chunkCenterPercent(
  geo: WallGeometry,
  chunk: number,
): [number, number] {
  const [ox, oy] = chunkOrigin(geo, chunk);
  return [
    ((ox + geo.chunkWidth / 2) / Math.max(1, geo.width)) * 100,
    ((oy + geo.chunkHeight / 2) / Math.max(1, geo.height)) * 100,
  ];
}

/**
 * How far to zoom the overview in before pulling back.
 *
 * Geometrically a rectangle fills the view at wallWidth/rectWidth (25x on NWL23
 * sevens), but compositing a canvas that large is wasteful and the extra travel
 * reads as a lurch rather than a zoom, so it is capped.
 */
export function zoomOutScale(geo: WallGeometry, cap = 8): number {
  return Math.max(1.5, Math.min(cap, geo.width / Math.max(1, geo.chunkWidth)));
}

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}
