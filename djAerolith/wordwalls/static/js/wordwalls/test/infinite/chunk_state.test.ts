import ChunkState from '../../infinite/chunk_state';
import { DEFAULT_CHUNK_H, DEFAULT_CHUNK_W, type WallGeometry } from '../../infinite/geometry';

const CHUNK_SIZE = DEFAULT_CHUNK_W * DEFAULT_CHUNK_H;
const GEO = {
  numAlphagrams: 21223,
  chunkCols: 25,
  chunkRows: 7,
  numChunks: 166,
  chunkWidth: DEFAULT_CHUNK_W,
  chunkHeight: DEFAULT_CHUNK_H,
  chunkSize: CHUNK_SIZE,
  width: 200,
  height: 112,
} as WallGeometry;
import type { QuestionPacket, WordPacket } from '../../infinite/rpc';

function word(w: string, symbols = ''): WordPacket {
  return {
    w, d: `def ${w}`, fh: '', bh: '', s: symbols, ifh: false, ibh: false,
  };
}

/** A rectangle payload as the server builds it: cell-ordered, unsolved only. */
function packet(cell: number, alphagram: string, words: WordPacket[]): QuestionPacket {
  return { a: alphagram, ws: words, g: cell };
}

// Rectangle 2 covers cells 256..383, so slots are cell - 256.
const CHUNK = 2;
const BASE = CHUNK * CHUNK_SIZE;
const NRU = packet(BASE, 'NRU', [word('RUN'), word('URN')]);
const AEINRST = packet(BASE + 5, 'AEINRST', [word('NASTIER'), word('RETAINS')]);
const CSW_ONLY = packet(BASE + CHUNK_SIZE - 1, 'AEIOU', [word('AUEIO', '#')]);

function loaded(): ChunkState {
  const state = new ChunkState();
  state.init(GEO, CHUNK, [NRU, AEINRST, CSW_ONLY]);
  return state;
}

describe('ChunkState layout', () => {
  it('always has exactly 128 slots so the 8x16 board is fully addressed', () => {
    expect(loaded().getQuestionState().size).toBe(CHUNK_SIZE);
    expect(CHUNK_SIZE).toBe(128);
  });

  it('places each question at its cell offset within the rectangle', () => {
    const slots = loaded().getQuestionState();
    expect(slots.getIn([0, 'a'])).toBe('NRU');
    expect(slots.getIn([5, 'a'])).toBe('AEINRST');
    expect(slots.getIn([CHUNK_SIZE - 1, 'a'])).toBe('AEIOU');
  });

  it('leaves unfilled slots empty so they render as placeholders', () => {
    const slots = loaded().getQuestionState();
    // svg_board renders any slot without `displayedAs` as an invisible cell.
    expect(slots.get(1)?.size).toBe(0);
    expect(slots.getIn([1, 'displayedAs'])).toBeUndefined();
  });

  it('starts displayedAs at the alphagram', () => {
    expect(loaded().getQuestionState().getIn([0, 'displayedAs'])).toBe('NRU');
  });

  it('counts outstanding alphagrams and words', () => {
    const state = loaded();
    expect(state.getAlphagramsLeft()).toBe(3);
    expect(state.getWordsLeft()).toBe(5);
    expect(state.getChunk()).toBe(CHUNK);
  });

  it('clears back to empty', () => {
    const state = loaded();
    state.clear();
    expect(state.getQuestionState().size).toBe(0);
    expect(state.getAlphagramsLeft()).toBe(0);
    expect(state.getChunk()).toBe(-1);
  });
});

describe('ChunkState guessing', () => {
  it('recognises outstanding words', () => {
    const state = loaded();
    expect(state.answerExists('RUN')).toBe(true);
    expect(state.answerExists('NOTHERE')).toBe(false);
  });

  it('keeps a partly solved alphagram on the board with fewer words', () => {
    const state = loaded();
    const result = state.solve('RUN', 'NRU');
    expect(result).toEqual({ slot: 0, alphagram: 'NRU', alphagramSolved: false });
    // The chip reads wMap.size, so it now correctly shows 1 remaining.
    expect(state.getQuestionState().getIn([0, 'wMap', 'RUN'])).toBeUndefined();
    expect((state.getQuestionState().getIn([0, 'wMap']) as Map<string, unknown>).size)
      .toBe(1);
    expect(state.getAlphagramsLeft()).toBe(3);
    expect(state.getWordsLeft()).toBe(4);
  });

  it('empties the slot once every word is found', () => {
    const state = loaded();
    state.solve('RUN', 'NRU');
    const result = state.solve('URN', 'NRU');
    expect(result?.alphagramSolved).toBe(true);
    expect(state.getQuestionState().get(0)?.size).toBe(0);
    expect(state.getAlphagramsLeft()).toBe(2);
  });

  it('ignores a duplicate solve so a repeated response cannot double count', () => {
    const state = loaded();
    state.solve('RUN', 'NRU');
    expect(state.solve('RUN', 'NRU')).toBeNull();
    expect(state.getWordsLeft()).toBe(4);
  });

  it('refuses to solve when the alphagram does not match the slot', () => {
    const state = loaded();
    expect(state.solve('RUN', 'AEINRST')).toBeNull();
    expect(state.getWordsLeft()).toBe(5);
  });

  it('remembers words it has already served, to tell stale from wrong', () => {
    const state = loaded();
    state.solve('RUN', 'NRU');
    expect(state.answerExists('RUN')).toBe(false);
    expect(state.originalAnswerExists('RUN')).toBe(true);
    expect(state.originalAnswerExists('NOTHERE')).toBe(false);
  });

  it('flags the question an anagram-shaped wrong guess was aiming at', () => {
    const state = loaded();
    // NUR is an anagram of NRU but is not one of its words.
    expect(state.markPotentialIncorrectGuess('NUR')).toBe(true);
    expect(state.getQuestionState().getIn([0, 'wrongGuess'])).toBe(true);
  });

  it('does not flag anything for a guess unrelated to the rectangle', () => {
    const state = loaded();
    expect(state.markPotentialIncorrectGuess('ZZZZZ')).toBe(false);
  });

  it('does not flag a word it already served', () => {
    const state = loaded();
    state.solve('RUN', 'NRU');
    expect(state.markPotentialIncorrectGuess('RUN')).toBe(false);
    expect(state.getQuestionState().getIn([0, 'wrongGuess'])).toBeUndefined();
  });

  it('stops flagging a solved alphagram', () => {
    const state = loaded();
    state.solve('RUN', 'NRU');
    state.solve('URN', 'NRU');
    expect(state.markPotentialIncorrectGuess('NUR')).toBe(false);
  });

  it('reports CSW-only words for the octothorp setting', () => {
    const state = loaded();
    expect(state.isCSW('AUEIO')).toBe(true);
    expect(state.isCSW('RUN')).toBe(false);
    expect(state.isCSW('NOTHERE')).toBe(false);
  });
});

describe('ChunkState tile ordering', () => {
  it('shuffles one question without touching the others', () => {
    const state = loaded();
    state.shuffle(0);
    const displayed = state.getQuestionState().getIn([0, 'displayedAs']) as string;
    expect(displayed.split('').sort().join('')).toBe('NRU');
    expect(state.getQuestionState().getIn([5, 'displayedAs'])).toBe('AEINRST');
  });

  it('resets every question back to alphagram order', () => {
    const state = loaded();
    state.shuffleAll();
    state.resetAllOrders();
    expect(state.getQuestionState().getIn([0, 'displayedAs'])).toBe('NRU');
    expect(state.getQuestionState().getIn([5, 'displayedAs'])).toBe('AEINRST');
  });

  it('applies a custom letter order', () => {
    const state = loaded();
    // Vowels first, as the wordwalls custom-order setting allows.
    state.setCustomLetterOrder('AEIOUBCDFGHJKLMNPQRSTVWXYZ');
    expect(state.getQuestionState().getIn([5, 'displayedAs'])).toBe('AEINRST');
    expect(state.getQuestionState().getIn([0, 'displayedAs'])).toBe('UNR');
  });

  it('ignores an empty custom order', () => {
    const state = loaded();
    state.setCustomLetterOrder('');
    expect(state.getQuestionState().getIn([0, 'displayedAs'])).toBe('NRU');
  });

  it('leaves empty slots alone when reordering', () => {
    const state = loaded();
    state.shuffleAll();
    expect(state.getQuestionState().get(1)?.size).toBe(0);
    expect(state.getQuestionState().size).toBe(CHUNK_SIZE);
  });
});
