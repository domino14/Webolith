import { render, act } from '@testing-library/react';
import CountUpTimer from '../../infinite/count_up_timer';

describe('CountUpTimer', () => {
  let nowMs: number;

  beforeEach(() => {
    jest.useFakeTimers();
    nowMs = 12345.6; // deliberately not aligned to any grid
    jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Advance both the fake clock and performance.now together. */
  const advance = (ms: number) => {
    act(() => {
      nowMs += ms;
      jest.advanceTimersByTime(ms);
    });
  };

  it('shows the server baseline immediately', () => {
    const { container } = render(
      <CountUpTimer running baselineMs={65000} />,
    );
    expect(container.textContent).toBe('0:01:05');
  });

  it('counts up while running', () => {
    const { container } = render(<CountUpTimer running baselineMs={0} />);
    advance(1000);
    expect(container.textContent).toBe('0:00:01');
    advance(2000);
    expect(container.textContent).toBe('0:00:03');
  });

  it('does not move while paused', () => {
    const { container } = render(
      <CountUpTimer running={false} baselineMs={9000} />,
    );
    advance(5000);
    expect(container.textContent).toBe('0:00:09');
  });

  /**
   * The stutter bug.
   *
   * Ticks used to be aligned to a grid derived from performance.now(), while the
   * displayed value counts from an arbitrary server baseline. Those phases are
   * unrelated, so the digit turned over *late* -- by up to a full tick, and by a
   * different amount for every baseline and every re-anchor.
   *
   * Note this asserts the lag, not the interval between turnovers: the old code
   * also changed once a second, just consistently behind. An interval-only test
   * would have passed against the bug.
   */
  it('turns the second over on time, whatever the baseline', () => {
    const STEP = 10;
    // Allows for the observation granularity plus the tick's small floor.
    const TOLERANCE = 30;
    [0, 1, 499, 500, 501, 999, 65432, 23400123].forEach((baselineMs) => {
      nowMs = 98765.4321; // deliberately unaligned to any grid
      const { container, unmount } = render(
        <CountUpTimer running baselineMs={baselineMs} />,
      );
      const start = container.textContent;
      // When the elapsed clock genuinely crosses its next whole second.
      const trueBoundary = (1000 - (baselineMs % 1000)) || 1000;

      let observed: number | null = null;
      for (let t = STEP; t <= 2000 && observed === null; t += STEP) {
        advance(STEP);
        if (container.textContent !== start) {
          observed = t;
        }
      }
      expect(observed).not.toBeNull();
      expect(Math.abs((observed as number) - trueBoundary))
        .toBeLessThanOrEqual(TOLERANCE);
      unmount();
    });
  });

  it('keeps turning over about once a second', () => {
    nowMs = 4242.42;
    const { container } = render(<CountUpTimer running baselineMs={65432} />);
    const changes: number[] = [];
    let last = container.textContent;
    for (let t = 10; t <= 5000; t += 10) {
      advance(10);
      if (container.textContent !== last) {
        changes.push(t);
        last = container.textContent;
      }
    }
    expect(changes.length).toBeGreaterThanOrEqual(4);
    changes.slice(1).forEach((c, i) => {
      // +/- one observation step.
      expect(Math.abs(c - changes[i] - 1000)).toBeLessThanOrEqual(10);
    });
  });

  it('re-anchors to a fresh server baseline', () => {
    const { container, rerender } = render(
      <CountUpTimer running baselineMs={1000} />,
    );
    advance(2000);
    expect(container.textContent).toBe('0:00:03');
    // A navigation resyncs the clock to the server's number.
    rerender(<CountUpTimer running baselineMs={60000} />);
    expect(container.textContent).toBe('0:01:00');
    advance(1000);
    expect(container.textContent).toBe('0:01:01');
  });

  it('keeps correct time when the main thread stalls past a boundary', () => {
    // A long board re-render delays the timeout; the next tick must recover the
    // true elapsed time rather than resume counting from where it left off.
    const { container } = render(<CountUpTimer running baselineMs={0} />);
    advance(3500);
    expect(container.textContent).toBe('0:00:03');
    advance(500);
    expect(container.textContent).toBe('0:00:04');
  });
});
