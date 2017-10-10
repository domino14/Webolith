// Test functions for wordwalls_game.js
/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import { should } from 'chai';
import { describe, it, beforeEach } from 'jest';

import WordwallsGame from '../wordwalls_game';

const hadBetter = should();

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
      game.getOriginalQuestionState().size.should.equal(7);
      game.getQuestionState().size.should.equal(7);
      game.getAnsweredBy().size.should.equal(0);
      game.getTotalNumWords().should.equal(12);
    });
  });

  describe('Basic Functionality', () => {
    it('should give correct values for answerExists method', () => {
      game.answerExists('REATA').should.be.true;
      game.answerExists('LERON').should.be.false;
    });
    it('should solve a word', () => {
      game.answerExists('ENROL').should.be.true;
      game.getQuestionState().getIn([2, 'wMap', 'ENROL']).should.be.ok;
      game.solve('ENROL', 'ELNOR', 'cesar');
      game.answerExists('ENROL').should.be.false;
      game.getAnsweredBy().size.should.equal(1);
      game.getAnsweredBy().get('cesar').size.should.equal(1);
      game.getOriginalQuestionState().getIn(['ELNOR',
        'answersRemaining']).should.equal(2);
      // lol:
      hadBetter.not.exist(game.getQuestionState().getIn([2, 'wMap', 'ENROL']));
    });
    it('should not solve a word that is not in the answers', () => {
      game.solve('DERON', 'DENOR', 'cesar');
      game.getAnsweredBy().size.should.equal(0);
      game.getOriginalQuestionState().getIn(['DENOR',
        'answersRemaining']).should.equal(3);
      game.alphagramsLeft.should.equal(7);
    });
    it('should not solve an alphagram that is not in the answers', () => {
      game.solve('ANEAR', 'AAAAA', 'cesar');
      game.getAnsweredBy().size.should.equal(0);
      game.getOriginalQuestionState().getIn(['AAENR',
        'answersRemaining']).should.equal(2); // ANEAR ARENA
    });
    it('should correctly calculate alphagrams left', () => {
      game.solve('ANEAR', 'AAENR', 'cesar');
      game.solve('ARENA', 'AAENR', 'cesar');
      game.getAnsweredBy().size.should.equal(1);
      game.getAnsweredBy().get('cesar').size.should.equal(2);
      game.getOriginalQuestionState().getIn(['AAENR',
        'answersRemaining']).should.equal(0);
      game.alphagramsLeft.should.equal(6);
    });
  });
});
