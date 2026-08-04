/**
 * @fileOverview Count-up clock for a wall run.
 *
 * Same monotonic discipline as topbar/game_timer.tsx: the display is derived from
 * performance.now() deltas against a server-supplied baseline, so an NTP or
 * wall-clock jump cannot add or remove time from a six-hour run. The server stays
 * authoritative -- every RPC response carries elapsedMs, and a newer baseline
 * simply re-anchors the display.
 */
import { useEffect, useRef, useState } from 'react';

import { formatElapsed } from './geometry';

interface CountUpTimerProps {
  running: boolean;
  /** Server-reported elapsed ms at the moment of the last sync. */
  baselineMs: number;
  /** Bump to re-anchor even when baselineMs is value-equal. */
  resetNonce?: number;
}

function CountUpTimer({
  running,
  baselineMs,
  resetNonce = 0,
}: CountUpTimerProps) {
  // Whole seconds, not milliseconds. The display only shows seconds, so an
  // unchanged second bails out of setState and re-renders nothing -- previously
  // this re-rendered twice a second to paint identical text.
  const [seconds, setSeconds] = useState<number>(() => Math.floor(baselineMs / 1000));
  const anchorRef = useRef<number>(0);
  const baseRef = useRef<number>(baselineMs);
  const timeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };

    clearPending();
    baseRef.current = baselineMs;
    anchorRef.current = performance.now();
    setSeconds(Math.floor(baselineMs / 1000));

    if (!running) {
      return clearPending;
    }

    const tick = () => {
      const ms = baseRef.current + (performance.now() - anchorRef.current);
      setSeconds(Math.floor(ms / 1000));

      // Aim at the next whole second of ELAPSED time.
      //
      // The obvious thing -- aligning to a grid derived from performance.now()
      // -- is wrong here: this clock starts from an arbitrary server baseline,
      // so its second boundaries sit at some unrelated phase, and every
      // navigation re-anchors to a different one. The digit then turns over up
      // to a tick late, by a different amount per rectangle, which reads as a
      // stutter. Scheduling against our own boundary makes the turnover exact.
      const untilNextSecond = 1000 - (ms % 1000);
      // A tick landing a hair early leaves untilNextSecond near zero; the floor
      // keeps that from becoming a busy loop, and the next tick corrects it.
      timeoutIdRef.current = window.setTimeout(tick, Math.max(20, untilNextSecond));
    };
    tick();
    return clearPending;
  }, [running, baselineMs, resetNonce]);

  return (
    <span
      className={running ? 'badge bg-info' : 'badge bg-secondary'}
      style={{ fontSize: '0.875rem', lineHeight: '1.5', fontVariantNumeric: 'tabular-nums' }}
    >
      {formatElapsed(seconds * 1000)}
    </span>
  );
}

export default CountUpTimer;
