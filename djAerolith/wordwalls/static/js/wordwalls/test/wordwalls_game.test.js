// Test functions for wordwalls_game.js
/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */

import WordwallsGame, { Internal } from '../wordwalls_game';

const testQuestions = `[
  {
    "a": "AAENR",
    "p": 76,
    "ws": [
      {
        "ibh": false,
        "d": "to approach (to come near or nearer to) [v ANEARED, ANEARING, ANEARS]",
        "bh": "S",
        "s": "",
        "w": "ANEAR",
        "fh": "",
        "ifh": true
      },
      {
        "ibh": false,
        "d": "an enclosed area for contests [n ARENAS]",
        "bh": "S",
        "s": "",
        "w": "ARENA",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 0
  },
  {
    "a": "AAENT",
    "p": 77,
    "ws": [
      {
        "ibh": true,
        "d": "ANTA, a pilaster formed at the termination of a wall [n]",
        "bh": "",
        "s": "",
        "w": "ANTAE",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 1
  },
  {
    "a": "ELNOR",
    "p": 79,
    "ws": [
      {
        "ibh": false,
        "d": "to enroll (to enter the name of in a register, record, or roll) [v ENROLLED, ENROLLING, ENROLS]",
        "bh": "LS",
        "s": "",
        "w": "ENROL",
        "fh": "",
        "ifh": false
      },
      {
        "ibh": true,
        "d": "one that avoids others [n LONERS]",
        "bh": "S",
        "s": "",
        "w": "LONER",
        "fh": "C",
        "ifh": false
      },
      {
        "ibh": false,
        "d": "a fragrant alcohol [n NEROLS]",
        "bh": "IS",
        "s": "",
        "w": "NEROL",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 2
  },
  {
    "a": "ELNOT",
    "p": 80,
    "ws": [
      {
        "ibh": true,
        "d": "a slow musical movement [n LENTOS]",
        "bh": "S",
        "s": "",
        "w": "LENTO",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 3
  },
  {
    "a": "EILOS",
    "p": 75,
    "ws": [
      {
        "ibh": true,
        "d": "SOLEUS, a muscle in the calf of the leg [n]",
        "bh": "",
        "s": "",
        "w": "SOLEI",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 4
  },
  {
    "a": "AAERT",
    "p": 78,
    "ws": [
      {
        "ibh": false,
        "d": "riata (a lasso) [n REATAS]",
        "bh": "S",
        "s": "",
        "w": "REATA",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 5
  },
  {
    "a": "DENOR",
    "p": 81,
    "ws": [
      {
        "ibh": false,
        "d": "to make a continuous low sound [v DRONED, DRONING, DRONES]",
        "bh": "DRS",
        "s": "",
        "w": "DRONE",
        "fh": "",
        "ifh": false
      },
      {
        "ibh": true,
        "d": "DON, to put on [v REDONNED, REDONNING, REDONS]",
        "bh": "ES",
        "s": "",
        "w": "REDON",
        "fh": "",
        "ifh": false
      },
      {
        "ibh": false,
        "d": "a dance in which the dancers move in a circle [n RONDES]",
        "bh": "LS",
        "s": "+",
        "w": "RONDE",
        "fh": "",
        "ifh": false
      }
    ],
    "idx": 6
  }
]`;

let game;

describe('Game State', () => {
  beforeEach(() => {
    game = new WordwallsGame();
    game.init(JSON.parse(testQuestions));
  });

  describe('Initialization', () => {
    it('should initialize state properly', () => {
      expect(game.getOriginalQuestionState().size).toBe(7);
      expect(game.getQuestionState().size).toBe(7);
      expect(game.getAnsweredBy().size).toBe(0);
      expect(game.getTotalNumWords()).toBe(12);
    });
  });

  describe('Basic Functionality', () => {
    it('should give correct values for answerExists method', () => {
      expect(game.answerExists('REATA')).toBe(true);
      expect(game.answerExists('LERON')).toBe(false);
    });
    it('should solve a word', () => {
      expect(game.answerExists('ENROL')).toBe(true);
      expect(game.getQuestionState().getIn([2, 'wMap', 'ENROL'])).toBeTruthy();
      game.solve('ENROL', 'ELNOR', 'cesar');
      expect(game.answerExists('ENROL')).toBe(false);
      expect(game.getAnsweredBy().size).toBe(1);
      expect(game.getAnsweredBy().get('cesar').size).toBe(1);
      expect(game.getOriginalQuestionState().getIn(['ELNOR',
        'answersRemaining'])).toBe(2);
      // lol:
      expect(game.getQuestionState().getIn([2, 'wMap', 'ENROL'])).toBeFalsy();
    });
    it('should not solve a word that is not in the answers', () => {
      game.solve('DERON', 'DENOR', 'cesar');
      expect(game.getAnsweredBy().size).toBe(0);
      expect(game.getOriginalQuestionState().getIn(['DENOR',
        'answersRemaining'])).toBe(3);
      expect(game.alphagramsLeft).toBe(7);
    });
    it('should not solve an alphagram that is not in the answers', () => {
      game.solve('ANEAR', 'AAAAA', 'cesar');
      expect(game.getAnsweredBy().size).toBe(0);
      expect(game.getOriginalQuestionState().getIn(['AAENR',
        'answersRemaining'])).toBe(2); // ANEAR ARENA
    });
    it('should correctly calculate alphagrams left', () => {
      game.solve('ANEAR', 'AAENR', 'cesar');
      game.solve('ARENA', 'AAENR', 'cesar');
      expect(game.getAnsweredBy().size).toBe(1);
      expect(game.getAnsweredBy().get('cesar').size).toBe(2);
      expect(game.getOriginalQuestionState().getIn(['AAENR',
        'answersRemaining'])).toBe(0);
      expect(game.alphagramsLeft).toBe(6);
    });
  });
});

describe('Internal functions', () => {
  describe('letterCounts', () => {
    it('should count letters properly', () => {
      const testArray = [
        ['AEROLITH', {
          A: 1, E: 1, R: 1, O: 1, L: 1, I: 1, T: 1, H: 1,
        }],
        ['FOO', { F: 1, O: 2 }],
        ['BAR?', {
          B: 1, A: 1, R: 1, '?': 1,
        }],
        ['BAR??', {
          B: 1, A: 1, R: 1, '?': 2,
        }],
      ];
      for (let i = 0; i < testArray.length; i += 1) {
        expect(Internal().letterCounts(testArray[i][0])).toEqual(testArray[i][1]);
      }
    });
  });

  describe('inBlankAnagrams', () => {
    const alphaHash = {
      'ACHILORS?': true,
      'AEHILOR?': true,
      'AEHINOR?': true,
      'AEINOR??': true,
      'ABBINOR?': true,
      AEFFGINR: true,
    };

    it('should find alphagram properly, no build mode', () => {
      const testArray = [
        ['AEROLITH', 'AEHILOR?'],
        ['ANTIHERO', 'AEHINOR?'],
        ['ERASIONS', 'AEINOR??'],
        ['RABBONIS', 'ABBINOR?'],
        ['ROBINIAS', undefined],
        ['AERODYNE', undefined],
        ['ACROLITH', undefined],
        ['ACROLITHS', 'ACHILORS?'],
      ];

      for (let i = 0; i < testArray.length; i += 1) {
        expect(Internal().anagramOfQuestions(
          testArray[i][0],
          alphaHash,
        )).toEqual(testArray[i][1]);
      }
    });

    it('should properly calculate anagram of question', () => {
      const testArrayTrue = [
        ['ACROLITH'.split(''), 'ACHILORS?', true, 5, 8],
        ['ACROLITH'.split(''), 'ACHILOR?', true, 5, 8],
        ['ACROLITH'.split(''), 'ACHILORT'],
        ['MUUMUUS'.split(''), 'MMSSUUU?', true, 5, 8],
      ];
      const testArrayFalse = [
        ['MUUMUUS'.split(''), 'MMSSUU?', true, 5, 8],
        ['ACROLITH'.split(''), 'AHHILOR?', true, 5, 8],
        ['ACROLITH'.split(''), 'AEHILORT'],
      ];
      for (let i = 0; i < testArrayTrue.length; i += 1) {
        expect(Internal().anagramOfQuestion.apply(null, testArrayTrue[i])).toBeTruthy();
      }

      for (let i = 0; i < testArrayFalse.length; i += 1) {
        expect(Internal().anagramOfQuestion.apply(null, testArrayFalse[i])).toBeFalsy();
      }
    });

    it('should find alphagram properly, build mode', () => {
      const testArray = [
        ['AEROLITH', 'AEHILOR?', 5, 8],
        ['ANTIHERO', 'AEHINOR?', 5, 8],
        ['ERASIONS', 'AEINOR??', 5, 8],
        ['RABBONIS', 'ABBINOR?', 5, 8],
        ['ROBINIAS', undefined, 5, 8],
        ['AERODYNE', undefined, 5, 8],
        ['ACROLITH', 'ACHILORS?', 5, 8],
        ['ACROLITHS', 'ACHILORS?', 5, 9],
        ['ACROLITHS', undefined, 5, 8],
        ['GRIFF', 'AEFFGINR', 5, 8],
        ['REFFING', 'AEFFGINR', 5, 8],
        ['FIRE', 'AEHILOR?', 4, 7], // assumes dict is ordered based on insertion
        ['FIRE', undefined, 5, 8], // If minimum length is 5, don't find it.
      ];

      for (let i = 0; i < testArray.length; i += 1) {
        expect(Internal().anagramOfQuestions(
          testArray[i][0],
          alphaHash,
          true,
          testArray[i][2],
          testArray[i][3],
        )).toEqual(testArray[i][1]);
      }
    });
  });

  describe('alphagrammize', () => {
    it('should alphagrammize properly', () => {
      const testArray = [
        ['ROBINIA', 'ABIINOR'],
        ['ÑU', 'ÑU'],
        ['PERSPICACITY', 'ACCEIIPPRSTY'],
        ['ĆCZ13ŹÑ', 'CĆ1Ñ3ZŹ'],
      ];
      for (let i = 0; i < testArray.length; i += 1) {
        expect(Internal().alphagrammize(testArray[i][0])).toEqual(testArray[i][1]);
      }
    });
  });
});
