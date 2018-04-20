/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';
import moment from 'moment';

import ModalSkeleton from '../modal_skeleton';
import Pills from './pills';
import Notifications from '../notifications';
import Sidebar from './sidebar';

import ChallengeDialog from './challenge_dialog';
import WordSearchDialog from './word_search_dialog';
import SavedListDialog, { PlayOptions } from './saved_list_dialog';
import AerolithListDialog from './aerolith_list_dialog';
import { SearchTypesEnum, searchCriterionToAdd } from './search_row';

const GAME_TYPE_NEW = 'Load New List';
const LIST_TYPE_CHALLENGE = 'Single-Player Challenges';
const LIST_TYPE_WORDSEARCH = 'Word Search';
const LIST_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const LIST_TYPE_SAVED_LIST = 'My Saved Lists';
const FLASHCARD_URL = '/flashcards/';

const DATE_FORMAT_STRING = 'YYYY-MM-DD';

const NO_LOAD_WHILE_PLAYING = (
  'Please wait until the end of the game to perform that action.');

const COLLINS_LEX_ID = 1;
const COLLINS_LICENSE_TEXT = `
The Collins Official Scrabble Words 2015 (CSW15) is copyright of
HarperCollins Publishers 2015 and used with permission.`;

const DEFAULT_TIME_PER_QUIZ = '5'; // minutes

/**
 * TableCreator should mostly manage its own state, do its own AJAX queries,
 * etc.. It is mostly an independent app. It will have parallels to
 * WordwallsApp, even though it is a part of it.
 */
class TableCreator extends React.Component {
  /**
   * Redirect to the given URL. This forces the user to leave the table
   * they are currently in.
   * @param  {string} url
   */
  static redirectUrl(url) {
    window.location.href = url;
  }

  static joinClicked(tablenum) {
    TableCreator.redirectUrl(`/wordwalls/table/${tablenum}`);
  }

  // We must pass the props to the constructor if we want to use
  // them in the state initializer.
  constructor(props) {
    super(props);
    this.state = {
      activeGameType: GAME_TYPE_NEW,
      activeListType: LIST_TYPE_CHALLENGE,

      currentLexicon: this.props.defaultLexicon,

      desiredTime: DEFAULT_TIME_PER_QUIZ,
      questionsPerRound: 50,
      // Challenge-related
      currentDate: moment(),
      challengesDoneAtDate: [],
      // Challenge data is leaderboard data.
      challengeData: {},
      currentChallenge: 0,
      // Word-search related
      wordSearchCriteria: [{
        searchType: SearchTypesEnum.LENGTH,
        minValue: 7,
        maxValue: 7,
      }, {
        searchType: SearchTypesEnum.PROBABILITY,
        minValue: 1,
        maxValue: 100,
      }],

      // Aerolith lists
      aerolithLists: [],
      selectedList: '',
      // Saved lists - the format here is a little different because
      // we are using another API 😐
      savedLists: {
        lists: [],
        count: 0,
        limits: {
          total: 0,
          current: 0,
        },
      },

    };
    this.challengeSubmit = this.challengeSubmit.bind(this);
    this.onChallengeSelected = this.onChallengeSelected.bind(this);
    this.searchParamChange = this.searchParamChange.bind(this);
    this.searchTypeChange = this.searchTypeChange.bind(this);
    this.selectedListChange = this.selectedListChange.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.flashcardSearchSubmit = this.flashcardSearchSubmit.bind(this);
    this.aerolithListSubmit = this.aerolithListSubmit.bind(this);
    this.flashcardAerolithListSubmit = this.flashcardAerolithListSubmit.bind(this);
    this.savedListSubmit = this.savedListSubmit.bind(this);
    this.flashcardSavedListSubmit = this.flashcardSavedListSubmit.bind(this);
    this.listUpload = this.listUpload.bind(this);
    this.addSearchRow = this.addSearchRow.bind(this);
    this.removeSearchRow = this.removeSearchRow.bind(this);
  }

  /**
   * If certain fields in the state have changed, we should make
   * some network requests.
   */
  componentDidUpdate(prevProps, prevState) {
    let challengeParamsChanged = false;
    // If the lexicon changes, we have to load new word lists no matter what.
    // If the date changes, we are in the challenges window. We should
    // mark challenge parameters as having changed.
    if ((prevState.currentLexicon !== this.state.currentLexicon) ||
        (prevState.currentDate.format(DATE_FORMAT_STRING) !==
         this.state.currentDate.format(DATE_FORMAT_STRING))) {
      // We may need to load new lists or challenges.
      this.loadInfoForListType(this.state.activeListType);
      challengeParamsChanged = true;
    }
    if (prevState.currentChallenge !== this.state.currentChallenge ||
        challengeParamsChanged) {
      // The challenge changed. We should load challenge leaderboard data.
      this.loadChallengeLeaderboardData();
    }
  }

  onChallengeSelected(challID) {
    const challenge = this.props.challengeInfo.find(c => c.id === challID);
    this.setState({
      currentChallenge: challID,
      desiredTime: String(challenge.seconds / 60),
      questionsPerRound: challenge.numQuestions,
    });
  }

  loadChallengeLeaderboardData() {
    if (!this.state.currentChallenge) {
      return;
    }
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/challengers/',
      data: {
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
        challenge: this.state.currentChallenge,
      },
      method: 'GET',
    })
      .done(data => this.setState({ challengeData: data || {} }))
      .always(() => this.hideSpinner());
  }

  loadInfoForListType(option) {
    switch (option) {
      case LIST_TYPE_CHALLENGE:
        this.loadChallengePlayedInfo();
        break;

      case LIST_TYPE_SAVED_LIST:
        this.loadSavedListInfo();
        break;

      case LIST_TYPE_AEROLITH_LISTS:
        this.loadAerolithListInfo();
        break;
      default:
        // ??
        break;
    }
  }

  // Reset dialog is called from the parent. This is a bit of an anti
  // pattern. We just make sure we reload any lists/etc when a user
  // reopens the dialog.
  resetDialog() {
    this.loadInfoForListType(this.state.activeListType);
    if (this.state.activeListType === LIST_TYPE_CHALLENGE) {
      this.loadChallengeLeaderboardData();
    }
  }

  showModal() {
    this.modal.show();
  }

  showSpinner() {
    this.props.setLoadingData(true);
  }

  hideSpinner() {
    this.props.setLoadingData(false);
  }

  addSearchRow() {
    const toadd = searchCriterionToAdd(this.state.wordSearchCriteria);
    if (!toadd) {
      return; // Don't add any more.
    }

    const newCriteria = this.state.wordSearchCriteria.concat(toadd);
    this.setState({
      wordSearchCriteria: newCriteria,
    });
  }

  removeSearchRow(criteriaIndex) {
    const currentCriteria = this.state.wordSearchCriteria;
    currentCriteria.splice(criteriaIndex, 1);
    this.setState({
      wordSearchCriteria: currentCriteria,
    });
  }

  /**
   * Submit a challenge to the backend.
   */
  challengeSubmit() {
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/new_challenge/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
        challenge: this.state.currentChallenge,
        tablenum: this.props.tablenum,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done(data => this.props.onLoadNewList(data))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to load challenge: ${jqXHR.responseJSON}`,
      ))
      .always(() => this.hideSpinner());
  }

  /**
   * Turn the search criteria into something the back end would understand.
   * @return {Array.<Object>}
   */
  searchCriteriaMapper() {
    return this.state.wordSearchCriteria.map(criterion => Object.assign({}, criterion, {
      searchType: SearchTypesEnum.properties[criterion.searchType].name,
    }));
  }

  searchSubmit() {
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/new_search/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        searchCriteria: this.searchCriteriaMapper(),
        desiredTime: parseFloat(this.state.desiredTime),
        questionsPerRound: this.state.questionsPerRound,
        tablenum: this.props.tablenum,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done(data => this.props.onLoadNewList(data))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to load search: ${jqXHR.responseJSON}`,
      ))
      .always(() => this.hideSpinner());
  }

  /**
   * Submit search params to flashcard function. We use a legacy
   * "WhitleyCards" API here, which is not quite JSON. This will have
   * to be moved over to my new Cards program in the future.
   */
  flashcardSearchSubmit() {
    this.showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action: 'searchParamsFlashcard',
        lexicon: this.state.currentLexicon,
        searchCriteria: this.searchCriteriaMapper(),
      },
    })
      .done(data => TableCreator.redirectUrl(data.url))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to process: ${jqXHR.responseJSON.error}`,
      ))
      .always(() => this.hideSpinner());
  }

  aerolithListSubmit() {
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/load_aerolith_list/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        desiredTime: parseFloat(this.state.desiredTime),
        questionsPerRound: this.state.questionsPerRound,
        selectedList: this.state.selectedList,
        tablenum: this.props.tablenum,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done(data => this.props.onLoadNewList(data))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to load list: ${jqXHR.responseJSON}`,
      ))
      .always(() => this.hideSpinner());
  }

  flashcardAerolithListSubmit() {
    this.showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action: 'namedListsFlashcard',
        lexicon: this.state.currentLexicon,
        namedList: this.state.selectedList,
      },
    })
      .done(data => TableCreator.redirectUrl(data.url))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to process: ${jqXHR.responseJSON.error}`,
      ))
      .always(() => this.hideSpinner());
  }

  savedListSubmit(listID, action) {
    this.showSpinner();
    if (action === PlayOptions.PLAY_DELETE) {
      $.ajax({
        url: `/base/api/saved_list/${listID}`,
        method: 'DELETE',
      })
      // XXX: Probably should do smart updating instead of reloading
      // from the server.
        .done(() => this.loadSavedListInfo()) // This will hide when it's over.
        .fail((jqXHR) => {
          Notifications.alert(
            'Error',
            `Failed to delete list: ${jqXHR.responseJSON}`,
          );
          this.hideSpinner();
        });
      return;
    }
    $.ajax({
      url: '/wordwalls/api/load_saved_list/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        desiredTime: parseFloat(this.state.desiredTime),
        questionsPerRound: this.state.questionsPerRound,
        selectedList: listID,
        tablenum: this.props.tablenum,
        listOption: action,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done((data) => {
        this.props.onLoadNewList(data);
        this.modal.dismiss();
      })
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to load list: ${jqXHR.responseJSON}`,
      ))
      .always(() => this.hideSpinner());
  }

  flashcardSavedListSubmit(listID, action) {
    this.showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action,
        lexicon: this.state.currentLexicon,
        wordList: listID,
        listOption: '1', // This is a hack to make the form validator pass.
        // This variable has no effect.
        // XXX: This flashcard app is a legacy app and we
        // will hopefully replace it soon.
      },
    })
      .done(data => TableCreator.redirectUrl(data.url))
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to process: ${jqXHR.responseJSON.error}`,
      ))
      .always(() => this.hideSpinner());
  }

  loadChallengePlayedInfo() {
    // Load the challenge-related stuff.
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/challenges_played/',
      data: {
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
      },
      method: 'GET',
    })
      .done(data => this.setState({ challengesDoneAtDate: data }))
      .always(() => this.hideSpinner());
  }

  loadAerolithListInfo() {
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/default_lists/',
      data: {
        lexicon: this.state.currentLexicon,
      },
      method: 'GET',
    })
      .done(data => this.setState({
        aerolithLists: data,
        selectedList: data[0] ? String(data[0].id) : '',
      }))
      .always(() => this.hideSpinner());
  }

  loadSavedListInfo() {
    this.showSpinner();
    $.ajax({
      url: '/base/api/saved_lists/',
      data: {
        // Note the API is slightly different. We're using the cards
        // API here to avoid writing yet another saved list API.
        lexicon_id: this.state.currentLexicon,
        order_by: 'modified',
        temp: 0,
        last_saved: 'human',
      },
      method: 'GET',
    })
      .done(data => this.setState({ savedLists: data }))
      .always(() => this.hideSpinner());
  }

  listUpload(files) {
    const data = new FormData();
    data.append('file', files[0]);
    data.append('lexicon', this.state.currentLexicon);
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/ajax_upload/',
      method: 'POST',
      data,
      processData: false,
      contentType: false,
    })
      .done(() => this.loadSavedListInfo())
      .fail(jqXHR => Notifications.alert(
        'Error',
        `Failed to upload list: ${jqXHR.responseJSON}`,
      ))
      .always(() => this.hideSpinner());
  }

  searchParamChange(index, paramName, paramValue) {
    const criteria = this.state.wordSearchCriteria;
    const valueModifier = (val) => {
      if (paramName === 'minValue' || paramName === 'maxValue') {
        return parseInt(val, 10) || 0;
      } else if (paramName === 'valueList') {
        return val.trim();
      }
      return val;
    };

    criteria[index][paramName] = valueModifier(paramValue);
    this.setState({
      wordSearchCriteria: criteria,
    });
  }

  searchTypeChange(index, value) {
    const criteria = this.state.wordSearchCriteria;
    const searchType = parseInt(value, 10);
    criteria[index].searchType = searchType;
    // Reset the values.
    if (searchType !== SearchTypesEnum.TAGS) {
      criteria[index].minValue = SearchTypesEnum.properties[searchType].defaultMin;
      criteria[index].maxValue = SearchTypesEnum.properties[searchType].defaultMax;
    }
    this.setState({
      wordSearchCriteria: criteria,
    });
  }

  selectedListChange(listId) {
    this.setState({
      selectedList: listId,
    });
  }
  /**
   * This hook gets called prior to every submit function, in order to
   * check common things such as the host of the table and whether a game
   * is running.
   * @param {Function} callback
   * @param {string} name
   */
  preSubmitHook(callback) {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
    } else {
      callback();
    }
  }

  renderQuizSearch() {
    let selectedQuizSearchDialog;
    switch (this.state.activeListType) {
      case LIST_TYPE_CHALLENGE:
        selectedQuizSearchDialog = (
          <ChallengeDialog
            challengeInfo={this.props.challengeInfo}
            challengesDoneAtDate={this.state.challengesDoneAtDate}
            challengeData={this.state.challengeData}
            currentDate={this.state.currentDate}
            onDateChange={(date) => {
              this.setState({
                currentDate: moment(date),
              });
            }}
            onChallengeSubmit={() => this.preSubmitHook(this.challengeSubmit)}
            onChallengeSelected={/* currying */
              challID => () => this.onChallengeSelected(challID)}
            currentChallenge={this.state.currentChallenge}
          />);
        break;
      case LIST_TYPE_WORDSEARCH:
        selectedQuizSearchDialog = (
          <WordSearchDialog
            lexicon={this.state.currentLexicon}
            availableLexica={this.props.availableLexica}
            onSearchSubmit={() => this.preSubmitHook(this.searchSubmit)}
            onFlashcardSubmit={() => this.preSubmitHook(this.flashcardSearchSubmit)}
            onSearchTypeChange={this.searchTypeChange}
            onSearchParamChange={this.searchParamChange}
            removeSearchRow={this.removeSearchRow}
            addSearchRow={this.addSearchRow}
            searches={this.state.wordSearchCriteria}
          />);

        break;
      case LIST_TYPE_SAVED_LIST:
        selectedQuizSearchDialog = (
          <SavedListDialog
            listOptions={this.state.savedLists}
            onListSubmit={(listID, action) =>
              this.preSubmitHook(() => this.savedListSubmit(listID, action))}
            onListUpload={this.listUpload}
            onListFlashcard={(listID, action) =>
              this.preSubmitHook(() => this.flashcardSavedListSubmit(listID, action))}
          />);
        break;
      case LIST_TYPE_AEROLITH_LISTS:
        selectedQuizSearchDialog = (
          <AerolithListDialog
            listOptions={this.state.aerolithLists}
            selectedList={this.state.selectedList}
            onSelectedListChange={this.selectedListChange}
            onListSubmit={() => this.preSubmitHook(this.aerolithListSubmit)}
            onFlashcardSubmit={() => this.preSubmitHook(this.flashcardAerolithListSubmit)}
          />);
        break;
      default:
        selectedQuizSearchDialog = null;
    }
    return (
      <div>
        <Pills
          options={[
            LIST_TYPE_CHALLENGE,
            LIST_TYPE_WORDSEARCH,
            LIST_TYPE_AEROLITH_LISTS,
            LIST_TYPE_SAVED_LIST,
          ]}
          activePill={this.state.activeListType}
          onPillClick={option => () => {
            this.setState({
              activeListType: option,
            });
            if (option !== LIST_TYPE_CHALLENGE) {
              // Reset the time back to the defaults.
              this.setState({
                desiredTime: DEFAULT_TIME_PER_QUIZ,
                questionsPerRound: 50,
              });
            }
            this.loadInfoForListType(option);
          }}
        />
        {selectedQuizSearchDialog}
      </div>);
  }

  render() {
    return (
      <ModalSkeleton
        title="Lobby"
        modalClass="table-modal"
        ref={(el) => {
          this.modal = el;
        }}
        size="modal-xl"
      >
        <div className="modal-body">
          <div className="row">
            <div className="col-sm-2">
              <Sidebar
                gameTypes={[GAME_TYPE_NEW]}
                activeGameType={this.state.activeGameType}
                setGameType={option => () => this.setState({
                  activeGameType: option,
                })}
                currentLexicon={this.state.currentLexicon}
                availableLexica={this.props.availableLexica}
                setLexicon={lex => this.setState({
                  currentLexicon: lex,
                })}
                desiredTime={this.state.desiredTime}
                setTime={t => this.setState({
                  desiredTime: t,
                })}
                questionsPerRound={this.state.questionsPerRound}
                setQuestionsPerRound={q => this.setState({
                  questionsPerRound: q,
                })}
                disabledInputs={
                  this.state.activeListType === LIST_TYPE_CHALLENGE}
              />
            </div>
            <div className="col-sm-10">
              {this.renderQuizSearch()}
            </div>

          </div>
        </div>
        <div className="modal-footer">
          <small
            style={{ marginRight: 10 }}
          >{this.state.currentLexicon === COLLINS_LEX_ID ? COLLINS_LICENSE_TEXT : ''}
          </small>
        </div>
      </ModalSkeleton>
    );
  }
}

TableCreator.propTypes = {
  defaultLexicon: PropTypes.number.isRequired,
  availableLexica: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    lexicon: PropTypes.string,
    description: PropTypes.string,
    counts: PropTypes.object,
  })).isRequired,
  challengeInfo: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  })).isRequired,
  tablenum: PropTypes.number.isRequired,
  onLoadNewList: PropTypes.func.isRequired,
  gameGoing: PropTypes.bool.isRequired,
  setLoadingData: PropTypes.func.isRequired,
};


export default TableCreator;
