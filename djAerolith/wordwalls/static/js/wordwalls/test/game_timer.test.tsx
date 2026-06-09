import React from 'react';
import { render, act } from '@testing-library/react';
import GameTimer from '../topbar/game_timer';

describe('GameTimer', () => {
  let nowMs: number;

  beforeEach(() => {
    jest.useFakeTimers();
    nowMs = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function advance(ms: number) {
    nowMs += ms;
    jest.advanceTimersByTime(ms);
  }

  it('displays the initial time', () => {
    const { getByText } = render(
      <GameTimer gameGoing initialGameTime={6000} />
    );
    expect(getByText('00:06')).toBeTruthy();
  });

  it('counts down using the monotonic deadline', () => {
    const { getByText } = render(
      <GameTimer gameGoing initialGameTime={6000} interval={500} />
    );
    act(() => { advance(2000); });
    expect(getByText('00:04')).toBeTruthy();
  });

  it('fires completeCallback exactly once when deadline is reached', () => {
    const cb = jest.fn();
    render(
      <GameTimer gameGoing initialGameTime={3000} interval={500} completeCallback={cb} />
    );
    act(() => { advance(3000); });
    // Drive a few more ticks to confirm it doesn't fire again
    act(() => { advance(2000); });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire completeCallback before the deadline', () => {
    const cb = jest.fn();
    render(
      <GameTimer gameGoing initialGameTime={5000} interval={500} completeCallback={cb} />
    );
    act(() => { advance(4000); });
    expect(cb).not.toHaveBeenCalled();
  });

  it('is immune to a wall-clock style jump between ticks', () => {
    // In the old Date.now()-based implementation, if performance.now() jumped
    // by 5000ms between ticks on a 6000ms timer the remaining would instantly
    // drop to ~1000ms and the callback would fire way too early. The deadline-
    // based model just re-measures from the fixed deadline so the display is
    // correct regardless of how large a single dt is.
    const cb = jest.fn();
    render(
      <GameTimer gameGoing initialGameTime={6000} interval={500} completeCallback={cb} />
    );
    // Simulate one normal tick
    act(() => { advance(500); });
    // Simulate a huge jump (like an NTP correction or tab unsuspend)
    act(() => { advance(4500); });
    // Only 5000ms elapsed of a 6000ms timer — should still have ~1s left
    expect(cb).not.toHaveBeenCalled();
    // Finish the remaining time
    act(() => { advance(1000); });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('resets when resetNonce is bumped (resync path)', () => {
    const cb = jest.fn();
    const { rerender } = render(
      <GameTimer gameGoing initialGameTime={6000} interval={500} completeCallback={cb} resetNonce={0} />
    );
    // Count down 4 seconds
    act(() => { advance(4000); });
    expect(cb).not.toHaveBeenCalled();

    // Server resyncs: same initialGameTime but nonce changes
    act(() => {
      rerender(
        <GameTimer gameGoing initialGameTime={6000} interval={500} completeCallback={cb} resetNonce={1} />
      );
    });
    // Should have a fresh 6s deadline — advancing only 4s more shouldn't fire
    act(() => { advance(4000); });
    expect(cb).not.toHaveBeenCalled();
    // Finishing the full 6s from resync should fire
    act(() => { advance(2000); });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('stops and resets to 0 when gameGoing becomes false', () => {
    const cb = jest.fn();
    const { rerender, getByText } = render(
      <GameTimer gameGoing initialGameTime={6000} interval={500} completeCallback={cb} />
    );
    act(() => { advance(1000); });
    act(() => {
      rerender(<GameTimer gameGoing={false} initialGameTime={6000} interval={500} completeCallback={cb} />);
    });
    expect(getByText('00:00')).toBeTruthy();
    act(() => { advance(10000); });
    expect(cb).not.toHaveBeenCalled();
  });
});
