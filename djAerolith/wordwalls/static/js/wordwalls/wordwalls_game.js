/* eslint-disable new-cap */
/**
 * @fileOverview Contains logic for wrong word hashes, etc. Used as a
 * helper to calculate state for the react app in app.jsx.
 *
 * We also use this as a sort of state store for the questions.
 */
import Immutable from 'immutable';
import _ from 'underscore';

const LETTER_SORT_MAP = {};
const SORT_STRING_ORDER = 'AĄBCĆ1DEĘFGHIJKLŁ2MNŃÑOÓPQR3SŚTUVWXYZŹŻ?';

function makeLetterSortMap() {
  for (let i = 0; i < SORT_STRING_ORDER.length; i += 1) {
    LETTER_SORT_MAP[SORT_STRING_ORDER[i]] = i;
  }
}

/**
 * Alphagrammize the word. Note - this follows the same "ghetto" function
 * used in models.py, and handles Spanish, English, and Polish. This may need
 * to be reworked.
 * @param {string} word
 */
function alphagrammize(word) {
  if (_.size(LETTER_SORT_MAP) === 0) {
    makeLetterSortMap();
  }
  return word
    .split('')
    .sort((a, b) => LETTER_SORT_MAP[a] - LETTER_SORT_MAP[b])
    .join('');
}

/**
 * Return an object counting the number of letters of the word.
 * @param {string} word
 * @returns Object.<string, number>
 */
function letterCounts(word) {
  const lc = {};
  for (let i = 0; i < word.length; i += 1) {
    if (_.has(lc, word[i])) {
      lc[word[i]] += 1;
    } else {
      lc[word[i]] = 1;
    }
  }
  return lc;
}

function anagramOfQuestion(guessLetters, question, buildMode, minLength, maxLength) {
  const alphaLC = letterCounts(question);
  for (let i = 0; i < guessLetters.length; i += 1) {
    if (_.has(alphaLC, guessLetters[i])) {
      alphaLC[guessLetters[i]] -= 1;
      if (alphaLC[guessLetters[i]] === 0) {
        delete alphaLC[guessLetters[i]];
      }
    } else if (_.has(alphaLC, '?')) {
      alphaLC['?'] -= 1;
      if (alphaLC['?'] === 0) {
        delete alphaLC['?'];
      }
    } else {
      return false;
    }
  }
  if ((buildMode && guessLetters.length >= minLength && guessLetters.length <= maxLength)
    || (!buildMode && _.size(alphaLC) === 0)) {
    return true;
  }
  return false;
}

/**
 * Return the specific key if the guess is an anagram of any of the
 * keys of the passed in alphaHash. The alphaHash may have blanks in
 * its keys.
 * Otherwise return undefined.
 * @param {string} guess
 * @param {Object.<string, bool>} alphaHash
 * @param {boolean} buildMode
 * @param {number=} minLength The minimum length of words to accept, only
 *  used for build mode.
 * @param {number=} maxLength The maximum length of words to accept, only
 *  used for build mode.
 * @returns {string=}
 */
function anagramOfQuestions(guess, alphaHash, buildMode, minLength, maxLength) {
  const guessLetters = guess.split('');
  return Object.keys(alphaHash).find(val => anagramOfQuestion(
    guessLetters,
    val,
    buildMode,
    minLength,
    maxLength,
  ));
}

class Game {
  constructor() {
    this.curQuestions = Immutable.List();
    this.origQuestions = Immutable.OrderedMap();
    this.answeredBy = Immutable.Map();
    this.missedWordsHash = {};
    this.originalWordsHash = {};
  }
  /**
   * Initializes the main data structures when a new array comes in.
   * @param  {Array.<Object>} questions The array of questions.
   * @param {string} gameType The type of game
   * @return {Immutable} The original questions as an immutable.
   */
  init(questions, gameType) {
    const qMap = {};
    const reducedQuestions = [];
    this.missedWordsHash = {};
    this.originalWordsHash = {};
    // A simple set of alphagrams of answers. We don't reuse the alphaIndexHash
    // below as that one can contain blanks or be the superset of a subword
    // challenge, for example.
    this.alphaAnswersHash = {};
    // Hash of "alphagram strings" to indices in curQuestions.
    this.alphaIndexHash = {};
    this.alphagramsLeft = 0;
    // answeredBy is an Immutable map - with keys being usernames and values
    // being the answered words.
    this.answeredBy = Immutable.Map();
    this.totalWords = 0;
    this.maxOnScreenQuestions = 52; // Default.
    this.gameType = gameType;
    this.hasBlanks = false;
    this.minLength = 100;
    this.maxLength = -100;
    questions.forEach((question, aidx) => {
      const newWMap = {};
      question.ws.forEach((word, idx) => {
        this.missedWordsHash[word.w] = idx;
        this.originalWordsHash[word.w] = {
          idx,
          word,
        };
        this.alphaAnswersHash[alphagrammize(word.w)] = true;
        this.totalWords += 1;
        newWMap[word.w] = word;
        if (word.w.length < this.minLength) {
          this.minLength = word.w.length;
        }
        if (word.w.length > this.maxLength) {
          this.maxLength = word.w.length;
        }
      });
      question.answersRemaining = question.ws.length; // eslint-disable-line no-param-reassign
      this.alphaIndexHash[question.a] = aidx;
      qMap[question.a] = question;
      if (question.a.includes('?')) {
        this.hasBlanks = true;
      }
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
    const widx = this.missedWordsHash[guess];
    return widx != null;
  }

  /**
   * Check if the guess is an anagram of the right word. This is typically
   * called when the answer doesn't exist in the hash.
   * @param  {string} guess
   * @return {boolean}
   */
  markPotentialIncorrectGuess(guess) {
    // If the guess ever existed, it shouldn't be marked as an incorrect
    // guess.
    if (this.originalAnswerExists(guess)) {
      return false;
    }
    // Check if the guess is an anagram of any of the unanswered questions.
    // (Or a subanagram in applicable cases)
    const question = this.guessInUnansweredQuestions(guess);
    if (!question) {
      return false;
    }
    this.origQuestions = this.origQuestions.update(question, (aObj) => {
      const newObj = aObj.set('wrongGuess', true);
      return newObj;
    });
    return true;
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

  /**
   * Return the specific question string if the guess is an anagram of
   * any of the unanswered questions, or null.
   * @param {string} guess
   * @return {string?}
   */
  guessInUnansweredQuestions(guess) {
    const buildMode = this.gameType.includes('build');
    if (!this.hasBlanks && !buildMode) {
      // alphagrammize the word.
      const alph = alphagrammize(guess);
      // Check in the alphagram hash directly.
      if (this.alphaAnswersHash[alph]) {
        return alph;
      }
    } else {
      return anagramOfQuestions(
        guess, this.alphaIndexHash, buildMode,
        this.minLength, this.maxLength,
      );
    }
    return null;
  }

  getRemainingAnswers() {
    return Object.keys(this.missedWordsHash);
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
   * @return {boolean} Whether the word is in a CSW lexicon and not NWL18.
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
    const widx = this.missedWordsHash[word];
    if (widx == null) {
      return false;
    }
    // Don't solve if the alphagram doesn't match.
    if (!this.origQuestions.get(alphagram)) {
      return false;
    }
    delete this.missedWordsHash[word];

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
      if (_.has(this.alphaAnswersHash, alphagram)) {
        delete this.alphaAnswersHash[alphagram];
      }
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
export function Internal() {
  return {
    letterCounts,
    anagramOfQuestions,
    anagramOfQuestion,
    alphagrammize,
  };
}
