/**
 * @fileOverview The reducer that handles the logic for the game itself.
 * Questions, game going, game time, etc.
 */
import WordwallsGame from '../wordwalls_game';

const wwg = new WordwallsGame();

const game = (state = {}, action) => {
  switch (action.type) {
    case 'GAME_STARTED':
      return Object.assign({}, state, {
        gameGoing: true,
        initialGameTime: action.time * 1000,
        isChallenge: action.gameType === 'challenge',
      });
    case 'QUESTIONS_RECEIVED':
      wwg.init(action.questions);
      return Object.assign({}, state, {
        numberOfRounds: state.numberOfRounds + 1,
        origQuestions: wwg.getOriginalQuestionState(),
        curQuestions: wwg.getQuestionState(),
        answeredBy: wwg.getAnsweredBy(),
        totalWords: wwg.getTotalNumWords(),
      });
      // Also this.wwApp.setGuessBoxFocus(); somewhere

    default:
      return state;
  }
};

export default game;
