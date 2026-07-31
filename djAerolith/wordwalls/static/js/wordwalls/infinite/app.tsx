/**
 * @fileOverview Container for the Great Wall.
 *
 * Two discrete zoom levels: an overview of the whole wall, and one zoomed-in
 * rectangle of 128 alphagrams.
 *
 * The clock is server-authoritative, and the invariant is that it runs exactly
 * when a rectangle is open. Opening one resumes, leaving one pauses, so there is
 * no separate resume button to forget to press and no way to sit on the overview
 * bleeding time. Scouting the map is free.
 */
import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import * as Immutable from 'immutable';

import GuessBox, { type GuessBoxRef } from '../bottombar/guessbox';
import GuessEnum from '../guess';
import SettingsModal, { type SettingsModalRef } from '../topbar/settings_modal';
import Styling from '../style';
import backgroundURL, {
  getAppropriateBackground, type BackgroundOption,
} from '../background';
import { ajaxUtils } from '../ajax_utils';
import ChunkBoard from './chunk_board';
import ChunkState from './chunk_state';
import CountUpTimer from './count_up_timer';
import InfiniteRPC, {
  type WallDetail, type WallState, type WallStatus,
} from './rpc';
import WallCanvas from './wall_canvas';
import {
  chunkCenterPercent, decodeBitmap, fitCell, formatElapsed, neighbourChunk,
  rectangleLabel, settleWidth, slideDirection, withBitSet, zoomOutScale,
  type Direction,
} from './geometry';
import './animations.css';

interface InfiniteAppProps {
  wallId: number;
  lexicon: string;
  wordLength: number;
  displayStyle: Styling;
}

const CONFIGURE_URL = '/wordwalls/api/configure/';

const HEARTBEAT_MS = 30000;

// The overview fills the viewport width and grows as tall as it needs to --
// vertical scrolling is fine, horizontal is not. This only caps how large cells
// get on a small wall viewed on a big monitor.
const MAX_OVERVIEW_CELL = 18;

// Bootstrap Icons rather than literal triangles. U+25C0/U+25B6 (left/right)
// carry emoji presentation variants while U+25B2/U+25BC (up/down) do not, so a
// system with a colour emoji font renders only two of the four as emoji -- same
// markup, mismatched arrows. An icon font is monochrome by construction.
const ARROWS: {
  dir: Direction; cls: string; icon: string; label: string;
}[] = [
  { dir: 'up', cls: 'gw-arrow-up', icon: 'bi-caret-up-fill', label: 'up' },
  { dir: 'down', cls: 'gw-arrow-down', icon: 'bi-caret-down-fill', label: 'down' },
  { dir: 'left', cls: 'gw-arrow-left', icon: 'bi-caret-left-fill', label: 'left' },
  { dir: 'right', cls: 'gw-arrow-right', icon: 'bi-caret-right-fill', label: 'right' },
];

function InfiniteApp({
  wallId, lexicon, wordLength, displayStyle: initialDisplayStyle,
}: InfiniteAppProps) {
  const [displayStyle, setDisplayStyleState] = useState(initialDisplayStyle);
  const rpcRef = useRef<InfiniteRPC>(new InfiniteRPC(wallId));
  const chunkStateRef = useRef<ChunkState>(new ChunkState());
  const guessBoxRef = useRef<GuessBoxRef>(null);
  const settingsModalRef = useRef<SettingsModalRef>(null);

  const [detail, setDetail] = useState<WallDetail | null>(null);
  const [bitmap, setBitmap] = useState<Uint8Array>(new Uint8Array(0));
  const [state, setState] = useState<WallState>('N');
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [timerNonce, setTimerNonce] = useState<number>(0);

  const [chunk, setChunk] = useState<number | null>(null);
  const [curQuestions, setCurQuestions] = useState<
  Immutable.List<Immutable.Map<string, unknown>>>(Immutable.List());
  const [alphagramsLeft, setAlphagramsLeft] = useState<number>(0);

  const [lastGuess, setLastGuess] = useState<string>('');
  const [lastGuessCorrectness, setLastGuessCorrectness] = useState<number>(
    GuessEnum.NONE,
  );
  const [busy, setBusy] = useState<boolean>(false);
  // A bumped key restarts the CSS animation even when the class is unchanged,
  // e.g. pressing the same arrow twice.
  const animSeq = useRef<number>(0);
  const [boardAnim, setBoardAnim] = useState<{ key: number; cls: string }>(
    { key: 0, cls: '' },
  );
  const [overviewAnim, setOverviewAnim] = useState<
  { key: number; cls: string; origin: string; zoom: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );
  // Actual usable width of the overview's container, measured after layout.
  const overviewBoxRef = useRef<HTMLDivElement>(null);
  const [overviewWidth, setOverviewWidth] = useState<number>(0);

  const running = state === 'R';
  const zoomed = chunk != null;

  // Mirror state into refs so async guess handlers don't read stale closures.
  const stateRef = useRef<WallState>(state);
  const chunkRef = useRef<number | null>(chunk);
  const detailRef = useRef<WallDetail | null>(detail);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { chunkRef.current = chunk; }, [chunk]);
  useEffect(() => { detailRef.current = detail; }, [detail]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const w = overviewBoxRef.current?.clientWidth ?? 0;
      if (!w) {
        return;
      }
      setOverviewWidth((prev) => settleWidth(prev, w));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // Re-attaches when the overview mounts (detail arrives, or we leave a
    // rectangle). Without these deps this ran after every single render.
  }, [zoomed, detail]);

  /**
   * Adopt the status every RPC response carries.
   *
   * The clock is only re-anchored at navigation points or when the run's state
   * changes. Re-anchoring on every guess would drag the display backwards by one
   * round-trip each time, which at roughly a guess per second reads as a
   * stuttering timer; the local count-up is monotonic between syncs, and a
   * navigation happens every ~100 alphagrams, so it cannot drift far.
   */
  const applyStatus = useCallback((status: WallStatus, resyncClock = false) => {
    const stateChanged = status.state !== stateRef.current;
    setState(status.state);
    setSolvedCount(status.solvedCount);
    if (resyncClock || stateChanged) {
      setElapsedMs(status.elapsedMs);
      setTimerNonce((n) => n + 1);
    }
  }, []);

  /**
   * Adopt a style change from the settings cog.
   *
   * Mirrors the main wordwalls container: dark mode also swaps the Bootstrap
   * theme attribute and the default backgrounds, and the whole style blob is
   * persisted to the same endpoint, so preferences follow the player between
   * wordwalls and here.
   */
  const setDisplayStyle = useCallback((style: Styling) => {
    if (displayStyle.darkMode !== style.darkMode) {
      const dark = style.darkMode;
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
      // Only auto-adjust backgrounds the player has not chosen themselves.
      if (style.background === '') {
        style.setStyleKey(
          'background',
          getAppropriateBackground(style.background as BackgroundOption, dark, false),
        );
      }
      if (style.bodyBackground === '') {
        style.setStyleKey(
          'bodyBackground',
          getAppropriateBackground(style.bodyBackground as BackgroundOption, dark, true),
        );
      }
    }
    setDisplayStyleState(style);
    ajaxUtils.postJson(CONFIGURE_URL, style.toJSON() as unknown as Record<string, unknown>).catch(() => {
      // Style persistence is best-effort; the session still reflects the change.
    });
    document.body.style.setProperty(
      'background-image',
      backgroundURL(style.bodyBackground as BackgroundOption),
    );
  }, [displayStyle.darkMode]);

  // Keep the page background in step with the chosen style.
  useEffect(() => {
    document.body.style.setProperty(
      'background-image',
      backgroundURL(displayStyle.bodyBackground as BackgroundOption),
    );
  }, [displayStyle.bodyBackground]);

  const dropChunk = useCallback(() => {
    chunkStateRef.current.clear();
    setChunk(null);
    setCurQuestions(Immutable.List());
    setAlphagramsLeft(0);
    setLastGuess('');
    setLastGuessCorrectness(GuessEnum.NONE);
  }, []);

  // -- initial load --------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    rpcRef.current.getWall().then(async (wall) => {
      if (cancelled) return;
      setDetail(wall);
      setBitmap(decodeBitmap(wall.solvedBitmap));
      // We always land on the overview, and the clock only runs inside a
      // rectangle -- so a wall still marked running (another tab, or a crash the
      // reaper has not caught yet) gets stopped here to restore the invariant.
      if (wall.state === 'R') {
        try {
          applyStatus(await rpcRef.current.pause(), true);
          return;
        } catch {
          // Fall through and show whatever the server last told us.
        }
      }
      applyStatus(wall, true);
    }).catch((e: Error) => {
      if (!cancelled) setError(e.message);
    });
    return () => { cancelled = true; };
  }, [applyStatus]);

  // -- pause / resume ------------------------------------------------------

  /**
   * Leave the open rectangle, which is the same act as pausing.
   *
   * Pausing has to hide the words, and hiding the words means there is nothing
   * left to look at, so "pause" and "back to the overview" are one button.
   */
  const backToWall = useCallback(async () => {
    setBusy(true);
    try {
      const status = await rpcRef.current.pause();
      // Pull back from the rectangle we were actually in, not the wall's middle.
      const left = chunkRef.current;
      const geo = detailRef.current;
      if (left != null && geo) {
        const [ox, oy] = chunkCenterPercent(geo, left);
        animSeq.current += 1;
        setOverviewAnim({
          key: animSeq.current,
          cls: 'gw-zoom-out',
          origin: `${ox}% ${oy}%`,
          zoom: zoomOutScale(geo),
        });
      }
      // Words leave the DOM entirely while paused, so nothing is inspectable.
      dropChunk();
      applyStatus(status, true);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [applyStatus, dropChunk]);

  const refreshBitmap = useCallback(async () => {
    try {
      const res = await rpcRef.current.bitmap();
      setBitmap(decodeBitmap(res.solvedBitmap));
      applyStatus(res, true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [applyStatus]);

  const applyTileOrder = useCallback(() => {
    const chunkState = chunkStateRef.current;
    if (displayStyle.customTileOrder) {
      chunkState.setCustomLetterOrder(displayStyle.customTileOrder);
    }
    setCurQuestions(chunkState.getQuestionState());
  }, [displayStyle.customTileOrder]);

  const loadChunk = useCallback(async (which: number) => {
    setBusy(true);
    try {
      // Opening a rectangle is what starts the clock -- there is no separate
      // resume action, so the wall is always paused until this happens.
      if (stateRef.current !== 'R') {
        applyStatus(await rpcRef.current.resume(), true);
      }
      const res = await rpcRef.current.loadChunk(which);
      const geo = detailRef.current;
      if (!geo) {
        return;
      }
      // Coming from the wall reads as a zoom; hopping between rectangles reads
      // as travel, so it slides in from the side we came from.
      animSeq.current += 1;
      const from = chunkRef.current;
      setBoardAnim({
        key: animSeq.current,
        cls: from == null
          ? 'gw-zoom-in'
          : `gw-slide-${slideDirection(geo, from, which)}`,
      });
      chunkStateRef.current.init(geo, which, res.questions);
      setChunk(which);
      setAlphagramsLeft(chunkStateRef.current.getAlphagramsLeft());
      applyStatus(res, true);
      applyTileOrder();
      setLastGuess('');
      setLastGuessCorrectness(GuessEnum.NONE);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [applyStatus, applyTileOrder]);

  // -- guessing ------------------------------------------------------------

  const maybeModifyGuess = useCallback((guess: string): string => {
    const stripped = guess.replace(/\s/g, '');
    if (lexicon !== 'FISE2') {
      return stripped;
    }
    // The board renders these digraphs as single tiles; game_tile maps back.
    return stripped.replace(/CH/g, '1').replace(/LL/g, '2').replace(/RR/g, '3');
  }, [lexicon]);

  const submitGuess = useCallback(async (word: string) => {
    const which = chunkRef.current;
    if (which == null) {
      return;
    }
    try {
      const res = await rpcRef.current.guess(which, word);
      applyStatus(res);
      if (!res.alphagram || !res.word) {
        setLastGuessCorrectness(GuessEnum.INCORRECT);
        return;
      }
      const solved = chunkStateRef.current.solve(res.word, res.alphagram);
      if (solved) {
        setCurQuestions(chunkStateRef.current.getQuestionState());
        setAlphagramsLeft(chunkStateRef.current.getAlphagramsLeft());
        if (solved.alphagramSolved && res.cell != null) {
          // Light the cell up locally so the minimap reacts immediately.
          setBitmap((prev) => withBitSet(prev, res.cell as number));
        }
      }
      setLastGuessCorrectness(
        res.alreadySolved ? GuessEnum.ALREADYGUESSED : GuessEnum.CORRECT,
      );
    } catch (e) {
      setError((e as Error).message);
      setLastGuessCorrectness(GuessEnum.NONE);
    }
  }, [applyStatus]);

  const onGuessSubmit = useCallback((guess: string) => {
    if (stateRef.current !== 'R' || chunkRef.current == null) {
      return;
    }
    const chunkState = chunkStateRef.current;
    const modified = maybeModifyGuess(guess);
    const hadOctothorp = modified.endsWith('#');
    const finalGuess = hadOctothorp ? modified.slice(0, -1) : modified;

    setLastGuess(guess);
    setLastGuessCorrectness(GuessEnum.PENDING);

    if (!chunkState.answerExists(finalGuess)) {
      // Resolve it locally; a wrong guess should not cost a round trip.
      if (chunkState.originalAnswerExists(finalGuess)) {
        setLastGuessCorrectness(GuessEnum.ALREADYGUESSED);
      } else {
        if (chunkState.markPotentialIncorrectGuess(finalGuess)) {
          setCurQuestions(chunkState.getQuestionState());
        }
        setLastGuessCorrectness(GuessEnum.INCORRECT);
      }
      return;
    }

    if (displayStyle.requireOctothorp) {
      const isCSW = chunkState.isCSW(finalGuess);
      if ((isCSW && !hadOctothorp) || (!isCSW && hadOctothorp)) {
        setLastGuessCorrectness(GuessEnum.INCORRECT_LEXICON_SYMBOL);
        return;
      }
    }
    submitGuess(finalGuess);
  }, [maybeModifyGuess, displayStyle.requireOctothorp, submitGuess]);

  const onHotKey = useCallback((key: string) => {
    const chunkState = chunkStateRef.current;
    if (key === '1') {
      chunkState.shuffleAll();
    } else if (key === '2') {
      chunkState.resetAllOrders();
    } else if (key === '3') {
      chunkState.setCustomLetterOrder(displayStyle.customTileOrder);
    } else {
      return;
    }
    setCurQuestions(chunkState.getQuestionState());
  }, [displayStyle.customTileOrder]);

  const moveTo = useCallback((dir: Direction) => {
    const geo = detailRef.current;
    const here = chunkRef.current;
    if (!geo || here == null) {
      return;
    }
    const next = neighbourChunk(geo, here, dir);
    if (next != null) {
      loadChunk(next);
    }
  }, [loadChunk]);

  const onShuffleQuestion = useCallback((slot: number) => {
    chunkStateRef.current.shuffle(slot);
    setCurQuestions(chunkStateRef.current.getQuestionState());
  }, []);

  // Put the cursor in the guess box as soon as a rectangle is on screen, so you
  // can start typing straight after clicking. This has to be an effect rather
  // than a call inside loadChunk: the guess box only mounts once `chunk` is set,
  // and that state has not been committed yet while loadChunk is still running.
  // Keyed on `chunk` too, so jumping between rectangles via the minimap refocuses.
  useEffect(() => {
    if (zoomed) {
      guessBoxRef.current?.setFocus();
    }
  }, [zoomed, chunk]);

  // A cleared rectangle sends you back out to pick the next one.
  useEffect(() => {
    if (zoomed && alphagramsLeft === 0 && curQuestions.size > 0) {
      // Pause as well as drop: an emptied rectangle returns you to the overview,
      // where the clock must not be running.
      backToWall().then(refreshBitmap);
    }
  }, [zoomed, alphagramsLeft, curQuestions.size, backToWall, refreshBitmap]);

  // -- keeping the server informed -----------------------------------------

  // While running, check in periodically. Without this the server cannot tell a
  // wall genuinely open in another tab from one whose browser went away, and an
  // abandoned run would keep accruing time until someone noticed.
  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const id = window.setInterval(() => {
      rpcRef.current.heartbeat().catch(() => {
        // A missed beat is harmless; the next one re-establishes liveness.
      });
    }, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [running]);

  /**
   * Leave for another page, pausing first.
   *
   * The unload beacon below races the next page's render, so a plain link out of
   * here often showed the wall as still running. Awaiting a real pause makes the
   * common case deterministic; the beacon stays as the backstop for tab closes.
   */
  const leaveTo = useCallback(async (href: string) => {
    setBusy(true);
    try {
      if (stateRef.current === 'R') {
        await rpcRef.current.pause();
      }
    } catch {
      // Fall through to the beacon/reaper rather than trapping the player here.
    }
    window.location.href = href;
  }, []);

  // -- unload --------------------------------------------------------------

  useEffect(() => {
    const beforeUnload = () => {
      if (stateRef.current !== 'R') {
        return;
      }
      // sendBeacon cannot set X-CSRFToken, so the token rides in the body as a
      // form field, the same way the main wordwalls table autosaves on unload.
      const token = document.cookie.split(';')
        .map((c) => c.trim().split('='))
        .find(([name]) => name === 'csrftoken');
      const data = new URLSearchParams({
        csrfmiddlewaretoken: token ? decodeURIComponent(token[1]) : '',
      });
      navigator.sendBeacon(`/wordwalls/infinite/${wallId}/beacon_pause/`, data);
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [wallId]);

  // -- render --------------------------------------------------------------

  const overviewSize = useMemo(
    () => (detail && overviewWidth
      // No height budget: the wall gets as tall as it likes. Width is measured
      // from the container rather than derived from window.innerWidth, which
      // counts the scrollbar this tall canvas will itself summon -- estimating
      // it would eventually overshoot and cause the horizontal scroll we are
      // trying to avoid.
      ? fitCell(
        detail.width, detail.height, overviewWidth, Infinity, MAX_OVERVIEW_CELL,
      )
      : { cellW: 1, cellH: 1 }),
    [detail, overviewWidth],
  );
  // Same fitting rule as the overview, just a smaller box, so the minimap is a
  // scaled copy rather than a differently-stretched one.
  const minimapSize = useMemo(
    () => (detail
      ? fitCell(detail.width, detail.height, Math.max(240, windowWidth - 60), 200, 4)
      : { cellW: 1, cellH: 1 }),
    [detail, windowWidth],
  );

  if (error && !detail) {
    return <div className="alert alert-danger">{error}</div>;
  }
  if (!detail) {
    return <div className="text-muted">Loading wall&hellip;</div>;
  }

  const remaining = detail.numAlphagrams - solvedCount;
  const percent = detail.numAlphagrams
    ? (100 * solvedCount) / detail.numAlphagrams
    : 0;

  const header = (
    <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
      <strong>
        {lexicon}
        {' '}
        {wordLength}
        s
      </strong>
      <CountUpTimer
        running={running}
        baselineMs={elapsedMs}
        resetNonce={timerNonce}
      />
      <span className="text-muted">
        {solvedCount.toLocaleString()}
        {' / '}
        {detail.numAlphagrams.toLocaleString()}
        {' solved ('}
        {percent.toFixed(2)}
        {'%) – '}
        {remaining.toLocaleString()}
        {' to go'}
      </span>
      {state === 'D' && (
        <span className="badge bg-success">
          {`Finished in ${formatElapsed(elapsedMs)}`}
        </span>
      )}
      {/* No resume button: the clock runs exactly while a rectangle is open, so
          leaving one is the only way to pause and opening one is the only way to
          start. */}
      {zoomed && (
        <button
          type="button"
          className="btn btn-sm btn-warning"
          disabled={busy}
          onClick={backToWall}
        >
          Pause &amp; back to the wall
        </button>
      )}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={busy}
        onClick={() => leaveTo('/wordwalls/infinite/')}
      >
        All walls
      </button>
      {/* A labelled button rather than wordwalls' bare gear glyph: this header
          is a plain flex row with no top-bar chrome, so an unlabelled icon is
          easy to miss and renders as nothing at all if the icon font fails.
          SettingsModal itself is reused as-is. */}
      <div className="ms-auto">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          data-bs-toggle="modal"
          data-bs-target=".settings-modal"
          title="Settings"
          onClick={() => settingsModalRef.current?.reset(displayStyle)}
        >
          <i className="bi bi-gear" aria-hidden="true" />
          {' Settings'}
        </button>
        <SettingsModal
          ref={settingsModalRef}
          displayStyle={displayStyle}
          onSave={setDisplayStyle}
        />
      </div>
    </div>
  );

  return (
    <div>
      {header}
      {error && <div className="alert alert-warning py-1">{error}</div>}

      {!zoomed && (
        // overflowX hidden as a belt-and-braces guard: the measured width should
        // already make the canvas fit exactly.
        <div ref={overviewBoxRef} style={{ overflowX: 'hidden' }}>
          <p className="text-muted mb-2">
            {state === 'D'
              ? 'Wall cleared. Nice run.'
              : `Clock stopped – browsing the wall is free. Click any rectangle to
                 open its ${detail.chunkSize} alphagrams and start the clock.`}
          </p>
          {/* The animated wrapper is inside the measured container on purpose:
              remounting it on every key change must not disturb overviewBoxRef,
              or the width measurement would reset with it. */}
          <div
            key={overviewAnim?.key ?? 'static'}
            className={overviewAnim ? `gw-anim ${overviewAnim.cls}` : undefined}
            style={overviewAnim ? {
              transformOrigin: overviewAnim.origin,
              ['--gw-zoom' as string]: String(overviewAnim.zoom),
            } as React.CSSProperties : undefined}
          >
            <WallCanvas
              geometry={detail}
              bitmap={bitmap}
              cellW={overviewSize.cellW}
              cellH={overviewSize.cellH}
              showChunkGrid
              interactive={state !== 'D'}
              onPickChunk={loadChunk}
              title="Click a rectangle to open it"
            />
          </div>
        </div>
      )}

      {zoomed && (
        <div>
          <div className="gw-board-wrap d-inline-block">
            <div
              key={boardAnim.key}
              className={boardAnim.cls ? `gw-anim ${boardAnim.cls}` : undefined}
            >
              <ChunkBoard
                displayStyle={displayStyle}
                geometry={detail}
                questions={curQuestions}
                onShuffle={onShuffleQuestion}
              />
            </div>
            {/* Edges simply have no arrow, rather than a greyed-out one: a
                disabled control still invites a click. */}
            {ARROWS.map(({ dir, cls, icon, label }) => {
              const target = neighbourChunk(detail, chunk, dir);
              if (target == null) {
                return null;
              }
              return (
                <button
                  key={dir}
                  type="button"
                  className={`btn btn-sm btn-dark gw-arrow ${cls}`}
                  disabled={busy}
                  title={rectangleLabel(target, detail.numChunks)}
                  aria-label={`Move ${label}`}
                  onClick={() => moveTo(dir)}
                >
                  <i className={`bi ${icon}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="mt-2" style={{ maxWidth: 640 }}>
            <GuessBox
              ref={guessBoxRef}
              onGuessSubmit={onGuessSubmit}
              onHotKey={onHotKey}
              lastGuess={lastGuess}
              lastGuessCorrectness={lastGuessCorrectness}
            />
          </div>
          <div className="mt-3">
            <div className="text-muted small mb-1">
              {rectangleLabel(chunk ?? 0, detail.numChunks)}
              {` – ${alphagramsLeft} alphagram${alphagramsLeft === 1 ? '' : 's'} left here. `}
              Click the map to jump elsewhere.
            </div>
            <WallCanvas
              geometry={detail}
              bitmap={bitmap}
              cellW={minimapSize.cellW}
              cellH={minimapSize.cellH}
              activeChunk={chunk}
              onPickChunk={loadChunk}
              title="Click to jump to another rectangle"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default InfiniteApp;
