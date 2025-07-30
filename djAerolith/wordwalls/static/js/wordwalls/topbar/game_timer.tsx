/**
 * Heavily based on
 * https://github.com/uken/react-countdown-timer
 * MIT licensed.
 */

import React, { useState, useEffect, useRef } from 'react';

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
}

function GameTimer({
  gameGoing = false,
  initialGameTime,
  interval = 500,
  completeCallback = null,
  warningCountdown = 10000,
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialGameTime);
  const [prevTime, setPrevTime] = useState<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  // Use refs to store current values for the tick function
  const timeRemainingRef = useRef<number>(timeRemaining);
  const prevTimeRef = useRef<number | null>(prevTime);
  const gameGoingRef = useRef<boolean>(gameGoing);
  const initialGameTimeRef = useRef<number>(initialGameTime);
  const completeCallbackRef = useRef<(() => void) | null>(completeCallback);

  // Update refs when state/props change
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    prevTimeRef.current = prevTime;
  }, [prevTime]);

  useEffect(() => {
    gameGoingRef.current = gameGoing;
  }, [gameGoing]);

  useEffect(() => {
    initialGameTimeRef.current = initialGameTime;
  }, [initialGameTime]);

  useEffect(() => {
    completeCallbackRef.current = completeCallback;
  }, [completeCallback]);

  const tick = () => {
    const currentTime = Date.now();
    const dt = prevTimeRef.current ? (currentTime - prevTimeRef.current) : 0;

    // correct for small variations in actual timeout time
    const timeRemainingInInterval = (interval - (dt % interval));
    let timeout = timeRemainingInInterval;

    if (timeRemainingInInterval < (interval / 2.0)) {
      timeout += interval;
    }

    const newTimeRemaining = Math.max(timeRemainingRef.current - dt, 0);
    const countdownComplete = (prevTimeRef.current && newTimeRemaining <= 0);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = countdownComplete ? null : window.setTimeout(tick, timeout);
    setPrevTime(currentTime);
    setTimeRemaining(newTimeRemaining);

    if (countdownComplete && initialGameTimeRef.current && gameGoingRef.current) {
      if (completeCallbackRef.current) {
        completeCallbackRef.current();
      }
    }
  };

  // Handle game state changes
  useEffect(() => {
    if (!gameGoing) {
      setPrevTime(null);
      setTimeRemaining(0);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    // Game is starting - reset the timer
    setPrevTime(null);
    setTimeRemaining(initialGameTime);
  }, [gameGoing, initialGameTime]);

  // Start ticking when component mounts or when timer should start
  useEffect(() => {
    if (!prevTime && timeRemaining > 0 && gameGoing) {
      tick();
    }
  }, [prevTime, timeRemaining, gameGoing]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
  }, []);

  let cn: string;
  if (timeRemaining <= warningCountdown) {
    cn = 'badge bg-warning text-dark';
  } else {
    cn = 'badge bg-info';
  }

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
