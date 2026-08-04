import {
  DEFAULT_CHUNK_H,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_W,
  cellToSlot,
  cellToXY,
  chunkAtXY,
  chunkBase,
  chunkOrigin,
  SCROLLBAR_SLOP,
  boardScale,
  chunkCenterPercent,
  decodeBitmap,
  fitCell,
  formatElapsed,
  neighbourChunk,
  settleWidth,
  slideDirection,
  upscaleCap,
  zoomOutScale,
  getBit,
  rectangleLabel,
  withBitSet,
  xyToCell,
  type WallGeometry,
} from '../../infinite/geometry';

/** Mirrors WallGeometry as the server derives it in infinite_perm.py. */
function geometryFor(
  numAlphagrams: number,
  chunkCols: number,
  chunkWidth = DEFAULT_CHUNK_W,
  chunkHeight = DEFAULT_CHUNK_H,
): WallGeometry {
  const chunkSize = chunkWidth * chunkHeight;
  const numChunks = Math.ceil(numAlphagrams / chunkSize);
  const chunkRows = Math.ceil(numChunks / chunkCols);
  return {
    numAlphagrams,
    chunkCols,
    chunkRows,
    numChunks,
    chunkWidth,
    chunkHeight,
    chunkSize,
    width: chunkCols * chunkWidth,
    height: chunkRows * chunkHeight,
  };
}

// NWL23 sevens, as the server would build it.
const SEVENS = geometryFor(21223, 25);

describe('geometry', () => {
  it('uses an 8x16 rectangle of 128 cells', () => {
    expect(DEFAULT_CHUNK_W * DEFAULT_CHUNK_H).toBe(DEFAULT_CHUNK_SIZE);
    expect(DEFAULT_CHUNK_SIZE).toBe(128);
    expect(DEFAULT_CHUNK_W).toBe(8);
    expect(DEFAULT_CHUNK_H).toBe(16);
  });

  it('round trips every cell through (x, y)', () => {
    for (let cell = 0; cell < SEVENS.numAlphagrams; cell += 89) {
      const [x, y] = cellToXY(SEVENS, cell);
      expect(xyToCell(SEVENS, x, y)).toBe(cell);
      expect(x).toBeLessThan(SEVENS.width);
      expect(y).toBeLessThan(SEVENS.height);
    }
  });

  it('agrees with the Python geometry on known wall shapes', () => {
    // These are the exact numbers asserted in tests/test_infinite.py.
    expect(geometryFor(2861, 9).width).toBe(72);
    expect(geometryFor(2861, 9).height).toBe(48);
    expect(SEVENS.width).toBe(200);
    expect(SEVENS.height).toBe(112);
    expect(geometryFor(247400, 87).width).toBe(696);
    expect(geometryFor(247400, 87).height).toBe(368);
  });

  it('maps cell 0 to the origin and the last cell to the rectangle corner', () => {
    expect(cellToXY(SEVENS, 0)).toEqual([0, 0]);
    expect(cellToXY(SEVENS, DEFAULT_CHUNK_SIZE - 1)).toEqual([DEFAULT_CHUNK_W - 1, DEFAULT_CHUNK_H - 1]);
  });

  it('starts rectangle 1 immediately to the right of rectangle 0', () => {
    expect(cellToXY(SEVENS, DEFAULT_CHUNK_SIZE)).toEqual([DEFAULT_CHUNK_W, 0]);
    expect(chunkOrigin(SEVENS, 1)).toEqual([DEFAULT_CHUNK_W, 0]);
  });

  it('wraps to the next rectangle row after chunkCols rectangles', () => {
    expect(chunkOrigin(SEVENS, SEVENS.chunkCols)).toEqual([0, DEFAULT_CHUNK_H]);
  });

  it('finds the rectangle under a point', () => {
    expect(chunkAtXY(SEVENS, 0, 0)).toBe(0);
    expect(chunkAtXY(SEVENS, DEFAULT_CHUNK_W, 0)).toBe(1);
    expect(chunkAtXY(SEVENS, 0, DEFAULT_CHUNK_H)).toBe(SEVENS.chunkCols);
  });

  it('returns null for points off the wall', () => {
    expect(chunkAtXY(SEVENS, -1, 0)).toBeNull();
    expect(chunkAtXY(SEVENS, 0, -1)).toBeNull();
    expect(chunkAtXY(SEVENS, SEVENS.width, 0)).toBeNull();
    expect(chunkAtXY(SEVENS, 0, SEVENS.height)).toBeNull();
  });

  it('returns null for the empty tail of the last rectangle row', () => {
    // 166 rectangles in a 25-wide grid leaves 7*25 - 166 = 9 empty slots.
    const lastRowY = (SEVENS.chunkRows - 1) * DEFAULT_CHUNK_H;
    expect(chunkAtXY(SEVENS, (SEVENS.chunkCols - 1) * DEFAULT_CHUNK_W, lastRowY)).toBeNull();
  });

  it('maps cells to board slots', () => {
    expect(cellToSlot(SEVENS, 0)).toBe(0);
    expect(cellToSlot(SEVENS, DEFAULT_CHUNK_SIZE - 1)).toBe(DEFAULT_CHUNK_SIZE - 1);
    expect(cellToSlot(SEVENS, DEFAULT_CHUNK_SIZE)).toBe(0);
    expect(cellToSlot(SEVENS, 21222)).toBe(21222 % DEFAULT_CHUNK_SIZE);
    expect(chunkBase(SEVENS, 3)).toBe(3 * DEFAULT_CHUNK_SIZE);
  });
});

describe('bitmap', () => {
  it('reads bits LSB-first, matching infinite_perm.get_bit', () => {
    // 0b10000001 -> bits 0 and 7 set.
    const bitmap = new Uint8Array([0x81]);
    expect(getBit(bitmap, 0)).toBe(true);
    expect(getBit(bitmap, 7)).toBe(true);
    expect(getBit(bitmap, 1)).toBe(false);
    expect(getBit(bitmap, 6)).toBe(false);
  });

  it('treats reads past the end as unsolved rather than throwing', () => {
    expect(getBit(new Uint8Array(1), 9999)).toBe(false);
  });

  it('decodes base64 from the server', () => {
    // btoa('\x81\x00') === 'gQA='
    const decoded = decodeBitmap('gQA=');
    expect(Array.from(decoded)).toEqual([0x81, 0x00]);
    expect(getBit(decoded, 0)).toBe(true);
    expect(getBit(decoded, 8)).toBe(false);
  });

  it('sets a bit without mutating the original', () => {
    const original = new Uint8Array(2);
    const next = withBitSet(original, 9);
    expect(getBit(next, 9)).toBe(true);
    // The canvas memoizes on identity, so the original must be untouched.
    expect(getBit(original, 9)).toBe(false);
    expect(next).not.toBe(original);
  });

  it('ignores a set past the end of the buffer', () => {
    expect(() => withBitSet(new Uint8Array(1), 9999)).not.toThrow();
  });
});

describe('walls built under an older rectangle shape', () => {
  // The bug: rectangle N used to mean cells 100N..100N+99. After retuning the
  // defaults to 8x16 it meant 128N..128N+127, so every stored solve pointed at
  // the wrong rectangle. Geometry now travels with the wall, so an old wall must
  // still resolve using its own dimensions rather than today's defaults.
  const OLD = geometryFor(21223, 41, 5, 20); // the original 5x20 = 100 shape

  it('keeps its own rectangle size', () => {
    expect(OLD.chunkSize).toBe(100);
    expect(OLD.numChunks).toBe(213);
    expect(DEFAULT_CHUNK_SIZE).toBe(128); // today's default differs
  });

  it('maps cells with the old size, not the current default', () => {
    // Cell 12900 was the first cell of old rectangle 129.
    expect(Math.floor(12900 / OLD.chunkSize)).toBe(129);
    expect(cellToSlot(OLD, 12900)).toBe(0);
    expect(chunkBase(OLD, 129)).toBe(12900);
  });

  it('round trips coordinates under the old shape', () => {
    for (let cell = 0; cell < OLD.numAlphagrams; cell += 401) {
      const [x, y] = cellToXY(OLD, cell);
      expect(xyToCell(OLD, x, y)).toBe(cell);
    }
  });
});

describe('settleWidth (the resize-loop guard)', () => {
  it('always honours a shrink, so the canvas can never overflow', () => {
    expect(settleWidth(1200, 1185)).toBe(1185); // scrollbar appeared
    expect(settleWidth(1200, 400)).toBe(400);
  });

  it('ignores a growth smaller than a scrollbar', () => {
    // The scrollbar vanishing must not bounce us back up, or we oscillate.
    expect(settleWidth(1185, 1200)).toBe(1185);
    expect(settleWidth(1185, 1185 + SCROLLBAR_SLOP)).toBe(1185);
  });

  it('accepts a decisive growth, e.g. a real window resize', () => {
    expect(settleWidth(1185, 1400)).toBe(1400);
    expect(settleWidth(0, 1200)).toBe(1200); // first measurement
  });

  it('converges instead of looping when the scrollbar toggles', () => {
    // Model the feedback: a wide container makes a tall canvas, which summons a
    // scrollbar and narrows the container by 15px; narrow makes it short again,
    // which dismisses the scrollbar. A symmetric rule ping-pongs forever.
    const SCROLLBAR = 15;
    const TALL_ABOVE = 1190; // wider than this and the canvas needs scrolling
    let width = 0;
    const seen: number[] = [];
    for (let i = 0; i < 50; i += 1) {
      const measured = width > TALL_ABOVE ? 1200 - SCROLLBAR : 1200;
      width = settleWidth(width, measured);
      seen.push(width);
    }
    // Settled, and stayed settled for the rest of the run.
    const last = seen[seen.length - 1];
    expect(seen.slice(-10)).toEqual(new Array(10).fill(last));
  });
});

describe('fitCell', () => {
  it('returns square cells so the minimap scales the overview faithfully', () => {
    const { cellW, cellH } = fitCell(200, 112, 1860, 640, 10);
    expect(cellW).toBe(cellH);
  });

  it('lets the wall grow tall when the height budget is Infinity', () => {
    // The overview fills the viewport width; vertical scrolling is fine.
    expect(fitCell(200, 112, 1800, Infinity, 18).cellW).toBe(9);
    expect(fitCell(200, 112, 2500, Infinity, 18).cellW).toBe(12);
  });

  it('never returns a cell below 1, even for an enormous wall', () => {
    expect(fitCell(696, 368, 320, Infinity, 18).cellW).toBe(1);
  });

  it('respects the cap so a small wall does not get silly', () => {
    expect(fitCell(72, 48, 1860, Infinity, 18).cellW).toBe(18);
  });
});

describe('upscale setting on the zoomed-in board', () => {
  // An 8-wide rectangle at wordwalls' 176px question metric, plus margin.
  const BOARD = 8 * 176 + 10;

  it('matches the curves the main wordwalls board uses', () => {
    expect(upscaleCap('none', 2400)).toBe(1);
    expect(upscaleCap('small', 2400)).toBeCloseTo(1.5);
    expect(upscaleCap('large', 2400)).toBeCloseTo(2);
  });

  it('never lets the preference shrink the board below 1:1', () => {
    // Fitting a narrow viewport is a separate concern; the preference is a
    // ceiling on growth only, or the two would fight.
    expect(upscaleCap('small', 800)).toBe(1);
    expect(upscaleCap('large', 800)).toBe(1);
  });

  it('actually changes the board size on a wide monitor', () => {
    const none = boardScale(BOARD, 2520, 'none', 2560);
    const small = boardScale(BOARD, 2520, 'small', 2560);
    const large = boardScale(BOARD, 2520, 'large', 2560);
    expect(none).toBe(1);
    expect(small).toBeGreaterThan(none);
    expect(large).toBeGreaterThan(small);
  });

  it('still fits the viewport, whatever the setting asks for', () => {
    // 1280px wide: the board must shrink regardless of a "scale up a lot".
    const scale = boardScale(BOARD, 1240, 'large', 1280);
    expect(scale).toBeLessThan(1);
    expect(BOARD * scale).toBeLessThanOrEqual(1240);
  });

  it('never shrinks past the readability floor', () => {
    expect(boardScale(BOARD, 100, 'none', 320)).toBe(0.3);
  });
});

describe('arrow navigation', () => {
  // NWL23 sevens: 166 rectangles in a 25-wide grid, so the last row holds
  // 166 - 6*25 = 16 and the rest of that row is off the wall.
  const G = SEVENS;

  it('steps within a row', () => {
    expect(neighbourChunk(G, 5, 'right')).toBe(6);
    expect(neighbourChunk(G, 5, 'left')).toBe(4);
  });

  it('steps between rows', () => {
    expect(neighbourChunk(G, 30, 'up')).toBe(5);
    expect(neighbourChunk(G, 5, 'down')).toBe(30);
  });

  it('does not wrap around the ends of a row', () => {
    // The bug a naive chunk +/- 1 would have: stepping left off column 0 would
    // land on the far right of the row above.
    expect(neighbourChunk(G, 25, 'left')).toBeNull();  // first of row 1
    expect(neighbourChunk(G, 49, 'right')).toBeNull(); // last of row 1
  });

  it('stops at the top and bottom edges', () => {
    expect(neighbourChunk(G, 3, 'up')).toBeNull();
    expect(neighbourChunk(G, 160, 'down')).toBeNull();
  });

  it('refuses to step into the short last row past the end of the wall', () => {
    // Row 6 only has rectangles 150..165; column 20 of row 6 would be 170.
    expect(neighbourChunk(G, 145, 'down')).toBeNull();
    expect(neighbourChunk(G, 140, 'down')).toBe(165); // still on the wall
  });
});

describe('slideDirection', () => {
  const G = SEVENS;

  it('picks the axis you actually travelled furthest along', () => {
    expect(slideDirection(G, 5, 6)).toBe('right');
    expect(slideDirection(G, 6, 5)).toBe('left');
    expect(slideDirection(G, 5, 30)).toBe('down');
    expect(slideDirection(G, 30, 5)).toBe('up');
  });

  it('handles a long diagonal minimap jump', () => {
    // Ten rows down, two columns left: vertical dominates.
    expect(slideDirection(G, 30, 30 + 10 * G.chunkCols - 2)).toBe('down');
  });
});

describe('zoom-out framing', () => {
  it('pulls back from the rectangle you were in, not the middle', () => {
    const [x, y] = chunkCenterPercent(SEVENS, 0);
    expect(x).toBeLessThan(10);   // top-left rectangle
    expect(y).toBeLessThan(10);
    const [x2, y2] = chunkCenterPercent(SEVENS, SEVENS.chunkCols - 1);
    expect(x2).toBeGreaterThan(90); // top-right rectangle
    expect(y2).toBeLessThan(10);
  });

  it('caps the zoom so the pull-back reads as a zoom, not a lurch', () => {
    // Geometrically a rectangle fills the view at 200/8 = 25x.
    expect(SEVENS.width / SEVENS.chunkWidth).toBe(25);
    expect(zoomOutScale(SEVENS)).toBe(8);
    expect(zoomOutScale(SEVENS, 40)).toBe(25);
  });

  it('never inverts into a zoom-in on a tiny wall', () => {
    const tiny = geometryFor(128, 1);
    expect(zoomOutScale(tiny)).toBeGreaterThanOrEqual(1.5);
  });
});

describe('rectangleLabel', () => {
  it('numbers rectangles from 1, not 0', () => {
    // Internally rectangle 0 is the first one, but "Rectangle 0" reads as a bug.
    expect(rectangleLabel(0, 166)).toBe('Rectangle 1 of 166');
    expect(rectangleLabel(11, 166)).toBe('Rectangle 12 of 166');
    expect(rectangleLabel(165, 166)).toBe('Rectangle 166 of 166');
  });

  it('groups digits on a big wall', () => {
    // OSPS52 nines: 1,933 rectangles.
    expect(rectangleLabel(0, 1933)).toBe('Rectangle 1 of 1,933');
    expect(rectangleLabel(1932, 1933)).toBe('Rectangle 1,933 of 1,933');
  });
});

describe('formatElapsed', () => {
  it('formats a multi-hour speed run', () => {
    expect(formatElapsed(0)).toBe('0:00:00');
    expect(formatElapsed(9000)).toBe('0:00:09');
    expect(formatElapsed(65000)).toBe('0:01:05');
    // A top player clearing all the sevens: ~6.5 hours.
    expect(formatElapsed(23400000)).toBe('6:30:00');
    // Hours are not clamped at 24.
    expect(formatElapsed(90000000)).toBe('25:00:00');
  });
});
