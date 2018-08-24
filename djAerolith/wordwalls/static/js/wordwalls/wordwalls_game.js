/* eslint-disable new-cap */
/**
 * @fileOverview Contains logic for wrong word hashes, etc. Used as a
 * helper to calculate state for the react app in app.jsx.
 *
 * We also use this as a sort of state store for the questions.
 */
import Immutable from 'immutable';
import _ from 'underscore';

class Game {
  constructor() {
    this.curQuestions = Immutable.List();
    this.origQuestions = Immutable.OrderedMap();
    this.answeredBy = Immutable.Map();
    this.wrongWordsHash = {};
    this.originalWordsHash = {};
  }
  /**
   * Initializes the main data structures when a new array comes in.
   * @param  {Array.<Object>} questions The array of questions.
   * @return {Immutable} The original questions as an immutable.
   */
  init(questions) {
    const qMap = {};
    const reducedQuestions = [];
    this.wrongWordsHash = {};
    this.originalWordsHash = {};
    // Hash of "alphagram strings" to indices in curQuestions.
    this.alphaIndexHash = {};
    this.alphagramsLeft = 0;
    // answeredBy is an Immutable map - with keys being usernames and values
    // being the answered words.
    this.answeredBy = Immutable.Map();
    this.totalWords = 0;
    this.maxOnScreenQuestions = 52; // Default.
    questions.forEach((question, aidx) => {
      const newWMap = {};
      question.ws.forEach((word, idx) => {
        this.wrongWordsHash[word.w] = idx;
        this.originalWordsHash[word.w] = {
          idx,
          word,
        };
        this.totalWords += 1;
        newWMap[word.w] = word;
      });
      question.answersRemaining = question.ws.length; // eslint-disable-line no-param-reassign
      this.alphaIndexHash[question.a] = aidx;
      qMap[question.a] = question;
      reducedQuestions.push({
        a: question.a,
        wMap: newWMap,
        displayedAs: question.a,
      });
    });
    this.alphagramsLeft = questions.length;
    this.origQuestions = Immutable.fromJS(qMap).toOrderedMap();
    // This structure is used just for the initial display.
    this.curQuestions = Immutable.fromJS(reducedQuestions);
  }

  miss(alphagram) {
    this.origQuestions = this.origQuestions.update(alphagram, (aObj) => {
      const newObj = aObj.set('solved', false);
      return newObj;
    });
  }

  /**
   * Check if the guess is actually a valid one. This is so we don't
   * submit bad guesses to the server.
   * @param  {string} guess
   * @return {boolean}
   */
  answerExists(guess) {
    const widx = this.wrongWordsHash[guess];
    return widx != null;
  }

  /**
   * Check if the guess ever existed. This is so we differentiate between
   * an already-guessed word and a wrong word.
   * @param  {string} guess
   * @return {boolean}
   */
  originalAnswerExists(guess) {
    return this.originalWordsHash[guess] != null;
  }

  getRemainingAnswers() {
    return Object.keys(this.wrongWordsHash);
  }

  addToAnswered(wObj, solver) {
    // Update the "answeredByMap" at key solver with a new list caused by
    // appending wObj to the existing list at that key. If that key doesn't
    // exist, it creates one with an empty list.
    this.answeredBy = this.answeredBy.update(
      solver, Immutable.List(),
      existingList => existingList.push(wObj),
    );
  }
  /**
   * @param {string} word
   * @return {boolean} Whether the word is in a CSW lexicon and not America.
   */
  isCSW(word) {
    const w = this.originalWordsHash[word];
    if (!w) {
      return false;
    }
    return w.word.s.includes('#');
  }

  /**
   * Solve a word. This will modify the elements in the hashes, which
   * modifies the state.
   * @param {string} word
   * @param {string} alphagram
   * @param {string} solver The screenname of the solver
   * @return {boolean} Solving successfully updated variables.
   */
  solve(word, alphagram, solver) {
    const widx = this.wrongWordsHash[word];
    if (widx == null) {
      return false;
    }
    // Don't solve if the alphagram doesn't match.
    if (!this.origQuestions.get(alphagram)) {
      return false;
    }
    delete this.wrongWordsHash[word];

    // Update the word object; add a solved property.
    this.origQuestions = this.origQuestions.updateIn([alphagram, 'ws', widx], (wObj) => {
      this.addToAnswered(wObj, solver);
      return wObj.set('solved', true);
    });

    // Look up the index of this alphagram in the alphaIndex hash.
    // This index is mutable and represents the current display position.
    const aidx = this.alphaIndexHash[alphagram];
    // Delete the word from the curQuestions word map.
    this.curQuestions = this.curQuestions.deleteIn([aidx, 'wMap', word]);

    this.origQuestions = this.origQuestions.update(alphagram, (aObj) => {
      let replacementAlpha;
      let newObj = aObj.set(
        'answersRemaining',
        aObj.get('answersRemaining') - 1,
      );
      if (newObj.get('answersRemaining') !== 0) {
        return newObj;
      }
      // Otherwise, the alphagram is fully solved.
      // Set it to solved in the original questions, and delete the alphagram
      // from the alphaIndexHash.
      newObj = newObj.set('solved', true);
      this.alphagramsLeft -= 1;
      delete this.alphaIndexHash[alphagram];
      // Replace the alphagram in curQuestions with a blank space.
      this.curQuestions = this.curQuestions.update(aidx, () =>
        // Create an empty map. This will not be rendered by the front end.
        Immutable.fromJS({}));

      if (this.alphagramsLeft >= this.maxOnScreenQuestions) {
        // If we can't fit all the words in the screen, we want to replace
        // the word we just solved.
        replacementAlpha = this.curQuestions.last();

        // Set the alpha at `aidx` to the last alpha in the list.
        this.curQuestions = this.curQuestions.pop().set(aidx, replacementAlpha);
        // Change the index in this.alphaIndexHash to aidx, for the new
        // alphagram (replace in place).
        this.alphaIndexHash[replacementAlpha.get('a')] = aidx;
      }
      return newObj;
    });
    return true;
  }

  setMaxOnScreenQuestions(n) {
    this.maxOnScreenQuestions = n;
  }
  /**
   * Get the current question state.
   * @return {Immutable.List}
   */
  getQuestionState() {
    return this.curQuestions;
  }

  /**
   * Get the original question state.
   * @return {Immutable.List}
   */
  getOriginalQuestionState() {
    return this.origQuestions;
  }

  getTotalNumWords() {
    return this.totalWords;
  }

  getAnsweredBy() {
    return this.answeredBy;
  }

  /**
   * Shuffle the element at the index given by which.
   * @param  {number} which
   */
  shuffle(which) {
    this.curQuestions = this.curQuestions.update(which, (aObj) => {
      const newObj = aObj.set('displayedAs', _.shuffle(aObj.get('a')).join(''));
      return newObj;
    });
  }

  shuffleAll() {
    if (!this.curQuestions) {
      return;
    }
    for (let i = 0; i < this.curQuestions.size; i += 1) {
      // XXX can we speed this up with `withMutations`?
      this.shuffle(i);
    }
  }

  resetAllOrders() {
    let i;
    const updateFunction = (aObj) => {
      const modObj = aObj.set('displayedAs', aObj.get('a'));
      return modObj;
    };
    if (!this.curQuestions) {
      return;
    }
    for (i = 0; i < this.curQuestions.size; i += 1) {
      this.curQuestions = this.curQuestions.update(i, updateFunction);
    }
  }

  setCustomLetterOrder(order) {
    let i;
    /**
     * Sorts a string into the custom order given by `order`.
     * @param  {string} letters
     * @return {string}
     */
    const customOrder = (letters) => {
      const sortedLetters = _.sortBy(letters, letter => order.indexOf(letter));
      return sortedLetters.join('');
    };

    const updateFunction = (aObj) => {
      const modObj = aObj.set('displayedAs', customOrder(aObj.get('a')));
      return modObj;
    };

    if (!order || !this.curQuestions) {
      return;
    }

    for (i = 0; i < this.curQuestions.size; i += 1) {
      this.curQuestions = this.curQuestions.update(i, updateFunction);
    }
  }
}

export default Game;
