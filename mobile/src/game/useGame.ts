/**
 * React hook that drives the WordWalls game loop.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './GameEngine';
import type { VisibleQuestion } from './GameEngine';
import { startGame, sendGuess, timerEnded as rpcTimerEnded, giveUp as rpcGiveUp } from '../api/wordwalls';

export type GamePhase = 'loading' | 'playing' | 'ended';

export interface UseGameReturn {
  phase: GamePhase;
  error: string | null;

  visibleQuestions: VisibleQuestion[];
  solvedWords: number;
  totalWords: number;

  selectedAlpha: string | null;
  selectAlpha: (alpha: string) => void;

  tappedIndices: number[];
  currentWord: string;
  tapTile: (index: number) => void;
  undoTile: () => void;
  clearInput: () => void;

  // Blank tile designation
  pendingBlankIndex: number | null;
  designateBlank: (letter: string) => void;
  cancelBlank: () => void;

  secondsLeft: number;
  giveUp: () => Promise<void>;
  cleanup: () => void;
}

export function useGame(tablenum: number): UseGameReturn {
  const engineRef = useRef(new GameEngine());

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [visibleQuestions, setVisibleQuestions] = useState<VisibleQuestion[]>([]);
  const [solvedWords, setSolvedWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  const [selectedAlpha, setSelectedAlpha] = useState<string | null>(null);
  const selectedAlphaRef = useRef<string | null>(null);
  const [tappedIndices, setTappedIndices] = useState<number[]>([]);
  const tappedIndicesRef = useRef<number[]>([]);

  // Blank tile state
  const [pendingBlankIndex, setPendingBlankIndex] = useState<number | null>(null);
  const [blankDesignations, setBlankDesignations] = useState<Map<number, string>>(new Map());
  const blankDesignationsRef = useRef<Map<number, string>>(new Map());

  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerEndedRef = useRef(false);
  const wrongAnswersRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Core helpers
  // ---------------------------------------------------------------------------

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endGame = useCallback(() => {
    stopTimer();
    setPhase('ended');
  }, [stopTimer]);

  const syncEngine = useCallback(() => {
    const engine = engineRef.current;
    setVisibleQuestions([...engine.visibleQuestions]);
    setSolvedWords(engine.solvedWords);
  }, []);

  /** Update tappedIndices in both ref (sync) and state (render), optionally clearing blanks. */
  const setIndices = useCallback((next: number[]) => {
    tappedIndicesRef.current = next;
    setTappedIndices(next);
    if (next.length === 0) {
      blankDesignationsRef.current = new Map();
      setBlankDesignations(new Map());
    }
  }, []);

  const setSelectedAlphaSync = useCallback((alpha: string | null) => {
    selectedAlphaRef.current = alpha;
    setSelectedAlpha(alpha);
  }, []);

  // ---------------------------------------------------------------------------
  // Load + start
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await startGame(tablenum);
        if (cancelled) return;

        const engine = engineRef.current;
        engine.load(data.questions);
        setTotalWords(engine.totalWords);
        syncEngine();

        const first = engine.visibleQuestions[0];
        if (first) setSelectedAlphaSync(first.a);

        setSecondsLeft(data.time);
        timerRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              stopTimer();
              if (!timerEndedRef.current) {
                timerEndedRef.current = true;
                rpcTimerEnded(tablenum).finally(() => {
                  if (!cancelled) endGame();
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setPhase('playing');
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to start game');
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablenum]);

  // ---------------------------------------------------------------------------
  // Guess submission
  // ---------------------------------------------------------------------------

  const submitGuess = useCallback(
    async (word: string) => {
      try {
        const resp = await sendGuess(tablenum, word, wrongAnswersRef.current);

        if (!resp.C) {
          if (!resp.g) endGame();
          return;
        }

        const result = engineRef.current.solve(resp.w, resp.C);
        syncEngine();

        if (result.alphagramComplete && resp.C === selectedAlphaRef.current) {
          const remaining = engineRef.current.visibleQuestions;
          // Advance to the next slot down the list.
          // - hadReplacement: slot was refilled in-place → next slot is solvedIndex + 1
          // - no replacement: slot was spliced out → solvedIndex now points to what was next
          const targetIndex = result.hadReplacement
            ? Math.min(result.solvedIndex + 1, remaining.length - 1)
            : Math.min(result.solvedIndex, remaining.length - 1);
          const next = remaining[targetIndex] ?? null;
          setSelectedAlphaSync(next?.a ?? null);
          setIndices([]);
        }

        if (!resp.g) endGame();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Guess failed');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tablenum, setIndices, setSelectedAlphaSync],
  );

  // ---------------------------------------------------------------------------
  // Tile tap management
  // ---------------------------------------------------------------------------

  /** Build the word from current indices + blank designations using a given question. */
  const buildWord = useCallback(
    (indices: number[], q: VisibleQuestion, designations: Map<number, string>): string => {
      return indices
        .map((i) => {
          const letter = q.displayedAs[i];
          return letter === '?' ? (designations.get(i) ?? '') : letter;
        })
        .join('');
    },
    [],
  );

  /** Common append + submit logic used by both tapTile and designateBlank. */
  const appendAndMaybeSubmit = useCallback(
    (newIndices: number[], q: VisibleQuestion, designations: Map<number, string>) => {
      const newWord = buildWord(newIndices, q, designations);

      // Word isn't full yet (undesignated blanks map to '' which shortens the word).
      if (newWord.length < q.displayedAs.length) {
        setIndices(newIndices);
        return;
      }

      if (engineRef.current.answerExists(newWord)) {
        setIndices([]);
        submitGuess(newWord);
      } else {
        wrongAnswersRef.current++;
        const alphagram = engineRef.current.guessInUnansweredQuestions(newWord);
        if (alphagram) {
          engineRef.current.markWrongGuess(alphagram);
          syncEngine();
          setTimeout(() => {
            engineRef.current.clearWrongGuess(alphagram);
            syncEngine();
          }, 600);
        }
        setIndices([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildWord, setIndices, syncEngine],
  );

  const selectAlpha = useCallback((alpha: string) => {
    setSelectedAlphaSync(alpha);
    setIndices([]);
  }, [setSelectedAlphaSync, setIndices]);

  const clearInput = useCallback(() => setIndices([]), [setIndices]);

  const undoTile = useCallback(() => {
    const next = tappedIndicesRef.current.slice(0, -1);
    // Also remove any blank designation for the popped tile.
    const popped = tappedIndicesRef.current[tappedIndicesRef.current.length - 1];
    if (popped != null && blankDesignationsRef.current.has(popped)) {
      const newDesignations = new Map(blankDesignationsRef.current);
      newDesignations.delete(popped);
      blankDesignationsRef.current = newDesignations;
      setBlankDesignations(newDesignations);
    }
    tappedIndicesRef.current = next;
    setTappedIndices(next);
  }, []);

  const tapTile = useCallback(
    (index: number) => {
      if (!selectedAlpha || phase !== 'playing') return;
      const q = engineRef.current.visibleQuestions.find((v) => v.a === selectedAlpha);
      if (!q) return;

      // Blank tile — prompt for letter designation before appending.
      if (q.displayedAs[index] === '?') {
        setPendingBlankIndex(index);
        return;
      }

      appendAndMaybeSubmit(
        [...tappedIndicesRef.current, index],
        q,
        blankDesignationsRef.current,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedAlpha, phase, appendAndMaybeSubmit],
  );

  const designateBlank = useCallback(
    (letter: string) => {
      if (pendingBlankIndex === null || !selectedAlpha) return;
      const q = engineRef.current.visibleQuestions.find((v) => v.a === selectedAlpha);
      if (!q) return;

      const newDesignations = new Map(blankDesignationsRef.current);
      newDesignations.set(pendingBlankIndex, letter);
      blankDesignationsRef.current = newDesignations;
      setBlankDesignations(newDesignations);

      const blankIdx = pendingBlankIndex;
      setPendingBlankIndex(null);

      appendAndMaybeSubmit(
        [...tappedIndicesRef.current, blankIdx],
        q,
        newDesignations,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingBlankIndex, selectedAlpha, appendAndMaybeSubmit],
  );

  const cancelBlank = useCallback(() => setPendingBlankIndex(null), []);

  // ---------------------------------------------------------------------------
  // Derived: current word for display (blank tiles shown as lowercase letter)
  // ---------------------------------------------------------------------------

  const currentWord = (() => {
    if (!selectedAlpha) return '';
    const q = engineRef.current.visibleQuestions.find((v) => v.a === selectedAlpha);
    if (!q) return '';
    return tappedIndices
      .map((i) => {
        const letter = q.displayedAs[i];
        if (letter !== '?') return letter;
        const designated = blankDesignations.get(i);
        return designated ? designated.toLowerCase() : '?';
      })
      .join('');
  })();

  // ---------------------------------------------------------------------------
  // Give up + cleanup
  // ---------------------------------------------------------------------------

  const giveUp = useCallback(async () => {
    await rpcGiveUp(tablenum).catch(() => {});
    endGame();
  }, [tablenum, endGame]);

  const cleanup = useCallback(() => stopTimer(), [stopTimer]);
  useEffect(() => () => cleanup(), [cleanup]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    phase,
    error,
    visibleQuestions,
    solvedWords,
    totalWords,
    selectedAlpha,
    selectAlpha,
    tappedIndices,
    currentWord,
    tapTile,
    undoTile,
    clearInput,
    pendingBlankIndex,
    designateBlank,
    cancelBlank,
    secondsLeft,
    giveUp,
    cleanup,
  };
}
