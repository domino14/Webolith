/**
 * @fileOverview The whole wall drawn to a canvas.
 *
 * One component serves both zoom levels: the zoomed-out wall and the minimap are
 * the same picture at different cell sizes, so there is only ever one renderer
 * to keep correct. Canvas rather than SVG because a wall runs from ~2.8k cells
 * (NWL23 fours) to ~247k (OSPS52 nines), well past what per-cell DOM nodes can
 * handle.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  chunkAtXY,
  chunkOrigin,
  getBit,
  rectangleLabel,
  xyToCell,
  type WallGeometry,
} from './geometry';

const COLOR_REMAINING = '#d9534f';
const COLOR_SOLVED = '#3f4650';
const COLOR_VOID = 'rgba(0, 0, 0, 0)';
const COLOR_GRID = 'rgba(255, 255, 255, 0.16)';
const COLOR_HOVER = 'rgba(255, 255, 255, 0.75)';
const COLOR_ACTIVE = '#f0ad4e';

// Below this cell width, per-cell gutters stop being visible, so we blit a
// 1px-per-cell image and upscale it with smoothing off instead.
const GUTTER_THRESHOLD = 3;

interface WallCanvasProps {
  geometry: WallGeometry;
  bitmap: Uint8Array;
  cellW: number;
  cellH: number;
  showChunkGrid?: boolean;
  activeChunk?: number | null;
  interactive?: boolean;
  onPickChunk?: (chunk: number) => void;
  title?: string;
}

function WallCanvas({
  geometry,
  bitmap,
  cellW,
  cellH,
  showChunkGrid = false,
  activeChunk = null,
  interactive = true,
  onPickChunk,
  title,
}: WallCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredChunk, setHoveredChunk] = useState<number | null>(null);

  // CSS-pixel size of the canvas box.
  const pixelWidth = geometry.width * cellW;
  const pixelHeight = geometry.height * cellH;

  // Back the canvas at device resolution. Without this the browser resamples a
  // regular 1px-gutter grid, which on a HiDPI or fractionally-scaled display
  // (1.25x, 1.5x) turns the cells into a shimmering moire and makes the gaps
  // look uneven. Drawing still happens in CSS pixels; setTransform does the
  // scaling, so none of the geometry below has to change.
  const dpr = typeof window === 'undefined' ? 1 : (window.devicePixelRatio || 1);

  /**
   * A 1px-per-cell offscreen image of the wall, repainted when progress changes.
   *
   * The canvas element and its ImageData are held in a ref and reused. Building
   * fresh ones here would allocate ~88 KB plus a DOM canvas on every solved
   * alphagram (~1 MB for OSPS52 nines) -- the compute is trivial, but that much
   * garbage per keystroke is what makes the tab stall periodically.
   */
  const store = useRef<{
    canvas: HTMLCanvasElement; image: ImageData; w: number; h: number;
  } | null>(null);

  const offscreen = useMemo(() => {
    const { width, height } = geometry;
    if (!width || !height) {
      return null;
    }
    if (!store.current || store.current.w !== width || store.current.h !== height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const c = canvas.getContext('2d');
      if (!c) {
        return null;
      }
      store.current = {
        canvas, image: c.createImageData(width, height), w: width, h: height,
      };
    }
    const ctx = store.current.canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const { data } = store.current.image;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = xyToCell(geometry, x, y);
        const offset = (y * width + x) * 4;
        if (cell >= geometry.numAlphagrams) {
          data[offset + 3] = 0; // void: past the end of the lexicon
        } else if (getBit(bitmap, cell)) {
          data[offset] = 0x3f;
          data[offset + 1] = 0x46;
          data[offset + 2] = 0x50;
          data[offset + 3] = 0xff;
        } else {
          data[offset] = 0xd9;
          data[offset + 1] = 0x53;
          data[offset + 2] = 0x4f;
          data[offset + 3] = 0xff;
        }
      }
    }
    ctx.putImageData(store.current.image, 0, 0);
    return store.current.canvas;
  }, [geometry, bitmap]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreen) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);

    if (cellW < GUTTER_THRESHOLD || cellH < GUTTER_THRESHOLD) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, pixelWidth, pixelHeight);
    } else {
      // Two passes, one per colour, so there are only two fillStyle changes for
      // the whole wall. Deliberately not collecting coordinates into arrays
      // first: that allocated one throwaway array per cell, ~22k of them per
      // redraw, purely to save a second cheap traversal.
      const gutter = 1;
      const w = Math.max(1, cellW - gutter);
      const h = Math.max(1, cellH - gutter);
      const passes: [string, boolean][] = [
        [COLOR_SOLVED, true],
        [COLOR_REMAINING, false],
      ];
      passes.forEach(([color, wantSolved]) => {
        ctx.fillStyle = color;
        for (let y = 0; y < geometry.height; y += 1) {
          for (let x = 0; x < geometry.width; x += 1) {
            const cell = xyToCell(geometry, x, y);
            if (cell < geometry.numAlphagrams
                && getBit(bitmap, cell) === wantSolved) {
              ctx.fillRect(x * cellW, y * cellH, w, h);
            }
          }
        }
      });
    }

    const chunkPixelW = geometry.chunkWidth * cellW;
    const chunkPixelH = geometry.chunkHeight * cellH;

    if (showChunkGrid) {
      ctx.strokeStyle = COLOR_GRID;
      ctx.lineWidth = 1;
      for (let c = 0; c < geometry.numChunks; c += 1) {
        const [ox, oy] = chunkOrigin(geometry, c);
        ctx.strokeRect(
          ox * cellW + 0.5,
          oy * cellH + 0.5,
          chunkPixelW - 1,
          chunkPixelH - 1,
        );
      }
    }

    const outline = (chunk: number, color: string, width: number) => {
      const [ox, oy] = chunkOrigin(geometry, chunk);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(
        ox * cellW + width / 2,
        oy * cellH + width / 2,
        chunkPixelW - width,
        chunkPixelH - width,
      );
    };

    if (activeChunk != null && activeChunk >= 0) {
      outline(activeChunk, COLOR_ACTIVE, 2);
    }
    if (hoveredChunk != null && hoveredChunk !== activeChunk) {
      outline(hoveredChunk, COLOR_HOVER, 2);
    }
  }, [
    offscreen,
    bitmap,
    geometry,
    cellW,
    cellH,
    pixelWidth,
    pixelHeight,
    dpr,
    showChunkGrid,
    activeChunk,
    hoveredChunk,
  ]);

  useEffect(draw, [draw]);

  const chunkFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    // Convert to CSS pixels. Deliberately not canvas.width -- that is the
    // device-resolution backing store, and using it would double-count dpr.
    // rect can still differ from pixelWidth if maxWidth:100% shrank us.
    const scaleX = pixelWidth / rect.width;
    const scaleY = pixelHeight / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellW);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellH);
    return chunkAtXY(geometry, x, y);
  };

  // Name the rectangle under the cursor. The whole wall is one canvas, so there
  // are no per-rectangle elements to hang a tooltip on; retitling the canvas as
  // the pointer crosses into a new rectangle is what gives per-rectangle hover.
  const hoverTitle = hoveredChunk != null
    ? rectangleLabel(hoveredChunk, geometry.numChunks)
    : title;

  return (
    <canvas
      ref={canvasRef}
      width={Math.round(pixelWidth * dpr)}
      height={Math.round(pixelHeight * dpr)}
      title={hoverTitle}
      style={{
        width: pixelWidth,
        height: pixelHeight,
        maxWidth: '100%',
        cursor: interactive ? 'pointer' : 'default',
        imageRendering: 'pixelated',
        backgroundColor: COLOR_VOID,
        touchAction: 'manipulation',
      }}
      onMouseMove={interactive ? (e) => {
        const chunk = chunkFromEvent(e);
        // Only re-render when the rectangle under the cursor actually changes.
        setHoveredChunk((prev) => (prev === chunk ? prev : chunk));
      } : undefined}
      onMouseLeave={interactive ? () => setHoveredChunk(null) : undefined}
      onClick={interactive ? (e) => {
        const chunk = chunkFromEvent(e);
        if (chunk != null && onPickChunk) {
          onPickChunk(chunk);
        }
      } : undefined}
    />
  );
}

export default React.memo(WallCanvas);
