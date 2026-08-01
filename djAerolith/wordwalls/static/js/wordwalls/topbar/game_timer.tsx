/**
 * Heavily based on
 * https://github.com/uken/react-countdown-timer
 * MIT licensed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Floor for the self-correcting reschedule below; also keeps a stalled main
// thread from spinning the timer.
const MIN_TICK_MS = 20;

const getFormattedTime = (milliseconds: number): string => {
  let seconds: number | string;
  let minutes: number | string;
  const totalSeconds = Math.round(milliseconds / 1000);
  seconds = parseInt(String(totalSeconds % 60), 10);
  minutes = parseInt(String(totalSeconds / 60), 10) % 60;

  seconds = seconds < 10 ? `0${seconds}` : seconds;
  minutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${minutes}:${seconds}`;
};

interface GameTimerProps {
  gameGoing?: boolean;
  initialGameTime: number;
  completeCallback?: (() => void) | null;
  warningCountdown?: number;
  // Bump this to force a timer resync even when initialGameTime is value-equal
  // (e.g. when the backend rejects an early timerEnded and returns the same ms).
  resetNonce?: number;
}

function GameTimer({
  gameGoing = false,
  initialGameTime,
  completeCallback = null,
  warningCountdown = 10000,
  resetNonce = 0,
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialGameTime);

  // deadline is performance.now() + initialGameTime, set on each (re)start.
  // Using performance.now() makes the countdown monotonic: an NTP/wall-clock
  // jump cannot move it, so a stalled tick merely delays the display update
  // instead of subtracting phantom time from the remaining count.
  const deadlineRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const firedRef = useRef<boolean>(false);
  const completeCallbackRef = useRef<(() => void) | null>(completeCallback);

  useEffect(() => {
    completeCallbackRef.current = completeCallback;
  }, [completeCallback]);

  const clearPending = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (deadlineRef.current === null) return;

    const remaining = Math.max(deadlineRef.current - performance.now(), 0);
    setTimeRemaining(remaining);

    if (remaining <= 0) {
      clearPending();
      if (!firedRef.current) {
        firedRef.current = true;
        completeCallbackRef.current?.();
      }
      return;
    }

    // Wake up when the DISPLAYED value next changes, not on a grid derived from
    // performance.now().
    //
    // The deadline is performance.now() + initialGameTime, so its second
    // boundaries sit at whatever phase the round happened to start on. Aligning
    // to the performance.now() grid instead made the digit turn over late by
    // anywhere from 0 to a full interval, differently for every round -- which
    // reads as an uneven, stuttering countdown.
    //
    // getFormattedTime rounds, so the text changes as `remaining` falls past
    // each (N - 0.5) second mark.
    const displayed = Math.round(remaining / 1000);
    // +1 so we land just past the boundary: Math.round(239.5) is still 240,
    // so waking exactly on it would see no change and have to tick again.
    const untilDisplayChanges = remaining - (displayed - 0.5) * 1000 + 1;
    const next = Math.min(
      // A tick landing a hair early leaves this near zero; the floor stops that
      // becoming a busy loop and the following tick corrects it.
      Math.max(MIN_TICK_MS, untilDisplayChanges),
      remaining,
    );
    timeoutIdRef.current = window.setTimeout(tick, next);
  }, [clearPending]);

  // (Re)start or stop whenever game state, initial time, or the resync nonce changes.
  useEffect(() => {
    clearPending();
    if (!gameGoing || initialGameTime <= 0) {
      deadlineRef.current = null;
      setTimeRemaining(0);
      return;
    }
    deadlineRef.current = performance.now() + initialGameTime;
    firedRef.current = false;
    setTimeRemaining(initialGameTime);
    tick();
    return clearPending;
  }, [gameGoing, initialGameTime, resetNonce, tick, clearPending]);

  // Cleanup on unmount
  useEffect(() => clearPending, [clearPending]);

  const cn = timeRemaining <= warningCountdown
    ? 'badge bg-warning text-dark'
    : 'badge bg-info';

  return (
    <span
      className={cn}
      style={{ fontSize: '0.875rem', lineHeight: '1.5' }}
    >
      {getFormattedTime(timeRemaining)}
    </span>
  );
}

export default GameTimer;
