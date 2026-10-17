// Test functions for wordvault_review.ts

import WordwallsGame from '../wordwalls_game';
import {
  countRatings,
  rateRound,
  Score,
  scoresToSubmit,
  type ReviewSession,
} from '../wordvault_review';

const word = (w: string) => ({
  w, d: '', fh: '', bh: '', s: '', ifh: false, ibh: false,
});

const questions = () => [
  {
    a: 'AEINRST', p: 1, idx: 0, ws: [word('RETAINS'), word('STAINER')],
  },
  { a: 'ADEEGMMO', p: 2, idx: 1, ws: [word('GAMODEME')] },
  { a: 'ACST', p: 3, idx: 2, ws: [word('CATS'), word('SCAT')] },
  // Not one of the session's cards.
  { a: 'DGO', p: 4, idx: 3, ws: [word('DOG'), word('GOD')] },
];

const newSession = (): ReviewSession => ({
  tablenum: 3,
  listName: 'WordVault review on 2026-10-16',
  lexicon: 'NWL23',
  // WordVault may store an alphagram in a different letter order.
  cards: { AEINRST: 'AEINRST', ADEEGMMO: 'ADEEGMMO', ACST: 'CAST' },
  wrong: [],
  ratings: {},
  status: 'playing',
});

describe('rateRound', () => {
  it('rates fully solved cards Good and the rest Missed', () => {
    const game = new WordwallsGame();
    game.init(questions(), 'regular');
    game.solve('RETAINS', 'AEINRST', 'me');
    game.solve('STAINER', 'AEINRST', 'me');
    // Partly solved counts as missed.
    game.solve('CATS', 'ACST', 'me');

    const { ratings, wrong } = rateRound(newSession(), game.getOriginalQuestionState());
    expect(ratings).toEqual({
      AEINRST: Score.GOOD,
      ADEEGMMO: Score.AGAIN,
      ACST: Score.AGAIN,
    });
    expect(wrong).toEqual([]);
  });

  it('keeps a card missed after a wrong guess, even once solved', () => {
    const game = new WordwallsGame();
    game.init(questions(), 'regular');
    expect(game.markPotentialIncorrectGuess('GAMODEEM')).toBe(true);
    game.solve('GAMODEME', 'ADEEGMMO', 'me');

    const session = newSession();
    const first = rateRound(session, game.getOriginalQuestionState());
    expect(first.ratings.ADEEGMMO).toBe(Score.AGAIN);
    expect(first.wrong).toEqual(['ADEEGMMO']);

    // After a reload the game no longer knows about the wrong guess, but the
    // session does.
    const resumed = new WordwallsGame();
    resumed.init(questions(), 'regular');
    resumed.solve('GAMODEME', 'ADEEGMMO', 'me');
    const again = rateRound(
      { ...session, ...first },
      resumed.getOriginalQuestionState(),
    );
    expect(again.ratings.ADEEGMMO).toBe(Score.AGAIN);
  });
});

describe('submitting', () => {
  it('counts ratings and sends stored alphagrams', () => {
    const session: ReviewSession = {
      ...newSession(),
      ratings: { AEINRST: Score.GOOD, ADEEGMMO: Score.AGAIN, ACST: Score.EASY },
    };
    expect(countRatings(session)).toEqual(new Map([
      [Score.GOOD, 1], [Score.AGAIN, 1], [Score.EASY, 1],
    ]));
    expect(scoresToSubmit(session)).toEqual([
      { alphagram: 'AEINRST', score: Score.GOOD },
      { alphagram: 'ADEEGMMO', score: Score.AGAIN },
      { alphagram: 'CAST', score: Score.EASY },
    ]);
  });
});
