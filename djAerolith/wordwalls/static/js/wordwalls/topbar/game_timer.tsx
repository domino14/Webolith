/**
 * Heavily based on
 * https://github.com/uken/react-countdown-timer
 * MIT licensed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

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
  interval?: number;
  completeCallback?: (() => void) | null;
  warningCountdown?: number;
  // Bump this to force a timer resync even when initialGameTime is value-equal
  // (e.g. when the backend rejects an early timerEnded and returns the same ms).
  resetNonce?: number;
}

function GameTimer({
  gameGoing = false,
  initialGameTime,
  interval = 500,
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

    // Align next wake-up to the interval grid so the display updates smoothly,
    // but never schedule past the deadline.
    const timeIntoInterval = performance.now() % interval;
    const next = Math.min(interval - timeIntoInterval, remaining);
    timeoutIdRef.current = window.setTimeout(tick, next);
  }, [interval, clearPending]);

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
