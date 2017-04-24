/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
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
import Lobby from '../lobby/main';

const GAME_TYPE_NEW = 'New';
const GAME_TYPE_JOIN = 'Join';
const SEARCH_TYPE_CHALLENGE = 'Challenges';
const SEARCH_TYPE_WORDSEARCH = 'Word Search';
const SEARCH_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const SEARCH_TYPE_SAVED_LIST = 'My saved lists';
const FLASHCARD_URL = '/flashcards/';

const DATE_FORMAT_STRING = 'YYYY-MM-DD';

const NO_LOAD_WHILE_PLAYING = (
  'Cannot load a game while you are in the middle of another one...');

const NO_DELETE_WHILE_PLAYING = (
  'Please wait until the end of the game to delete a list.');

const COLLINS_LEX_ID = 1;
const COLLINS_LICENSE_TEXT = `
The Collins Official Scrabble Words 2015 (CSW15) is copyright of
HarperCollins Publishers 2015 and used with permission.`;

const DEFAULT_TIME_PER_QUIZ = '5';  // minutes

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
  // We must pass the props to the constructor if we want to use
  // them in the state initializer.
  constructor(props) {
    super(props);
    this.state = {
      activeGameType: GAME_TYPE_NEW,
      activeSearchType: SEARCH_TYPE_CHALLENGE,

      currentLexicon: this.props.defaultLexicon,

      desiredTime: DEFAULT_TIME_PER_QUIZ,
      questionsPerRound: 50,
      // Challenge-related
      currentDate: moment(),
      challengesDoneAtDate: [],
      // Challenge data is leaderboard data.
      challengeData: {},
      currentChallenge: null,
      // Word-search related
      probMin: '1',
      probMax: '50',
      wordLength: 2,
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
    this.selectedListChange = this.selectedListChange.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.flashcardSearchSubmit = this.flashcardSearchSubmit.bind(this);
    this.aerolithListSubmit = this.aerolithListSubmit.bind(this);
    this.flashcardAerolithListSubmit = this.flashcardAerolithListSubmit.bind(this);
    this.savedListSubmit = this.savedListSubmit.bind(this);
    this.flashcardSavedListSubmit = this.flashcardSavedListSubmit.bind(this);
    this.listUpload = this.listUpload.bind(this);
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
      this.loadInfoForSearchType(this.state.activeSearchType);
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

  loadInfoForSearchType(option) {
    switch (option) {
      case SEARCH_TYPE_CHALLENGE:
        this.loadChallengePlayedInfo();
        break;

      case SEARCH_TYPE_SAVED_LIST:
        this.loadSavedListInfo();
        break;

      case SEARCH_TYPE_AEROLITH_LISTS:
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
    this.loadInfoForSearchType(this.state.activeSearchType);
    if (this.state.activeSearchType === SEARCH_TYPE_CHALLENGE) {
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
  /**
   * Submit a challenge to the backend.
   */
  challengeSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
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
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to load challenge: ${jqXHR.responseJSON}`))
    .always(() => this.hideSpinner());
  }

  searchSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
    this.showSpinner();
    $.ajax({
      url: '/wordwalls/api/new_search/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        probMin: parseInt(this.state.probMin, 10),
        probMax: parseInt(this.state.probMax, 10),
        wordLength: this.state.wordLength,
        desiredTime: parseFloat(this.state.desiredTime),
        questionsPerRound: this.state.questionsPerRound,
        tablenum: this.props.tablenum,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
    .done(data => this.props.onLoadNewList(data))
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to load search: ${jqXHR.responseJSON}`))
    .always(() => this.hideSpinner());
  }

  /**
   * Submit search params to flashcard function. We use a legacy
   * "WhitleyCards" API here, which is not quite JSON. This will have
   * to be moved over to my new Cards program in the future.
   */
  flashcardSearchSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
    this.showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action: 'searchParamsFlashcard',
        lexicon: this.state.currentLexicon,
        wordLength: this.state.wordLength,
        probabilityMin: parseInt(this.state.probMin, 10),
        probabilityMax: parseInt(this.state.probMax, 10),
      },
    })
    .done(data => TableCreator.redirectUrl(data.url))
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to process: ${jqXHR.responseJSON.error}`))
    .always(() => this.hideSpinner());
  }

  aerolithListSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
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
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to load list: ${jqXHR.responseJSON}`))
    .always(() => this.hideSpinner());
  }

  flashcardAerolithListSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
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
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to process: ${jqXHR.responseJSON.error}`))
    .always(() => this.hideSpinner());
  }

  savedListSubmit(listID, action) {
    if (this.props.gameGoing) {
      Notifications.alert('Error',
        action !== PlayOptions.PLAY_DELETE ? NO_LOAD_WHILE_PLAYING :
          NO_DELETE_WHILE_PLAYING);
      return;
    }
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
        Notifications.alert('Error',
          `Failed to delete list: ${jqXHR.responseJSON}`);
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
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to load list: ${jqXHR.responseJSON}`))
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
        listOption: '1',  // This is a hack to make the form validator pass.
                          // This variable has no effect.
                          // XXX: This flashcard app is a legacy app and we
                          // will hopefully replace it soon.
      },
    })
    .done(data => TableCreator.redirectUrl(data.url))
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to process: ${jqXHR.responseJSON.error}`))
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
    .fail(jqXHR => Notifications.alert('Error',
      `Failed to upload list: ${jqXHR.responseJSON}`))
    .always(() => this.hideSpinner());
  }

  searchParamChange(paramName, paramValue) {
    const curState = {};
    curState[paramName] = paramValue;
    this.setState(curState);
  }

  selectedListChange(listId) {
    this.setState({
      selectedList: listId,
    });
  }

  renderQuizSearch() {
    let selectedQuizSearchDialog;
    switch (this.state.activeSearchType) {
      case SEARCH_TYPE_CHALLENGE:
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
            onChallengeSubmit={this.challengeSubmit}
            onChallengeSelected={/* currying */
              challID => () => this.onChallengeSelected(challID)}
            currentChallenge={this.state.currentChallenge}
          />);
        break;
      case SEARCH_TYPE_WORDSEARCH:
        selectedQuizSearchDialog = (
          <WordSearchDialog
            lexicon={this.state.currentLexicon}
            availableLexica={this.props.availableLexica}
            onSearchSubmit={this.searchSubmit}
            onFlashcardSubmit={this.flashcardSearchSubmit}
            onSearchParamChange={this.searchParamChange}
            wordLength={this.state.wordLength}
            probMin={this.state.probMin}
            probMax={this.state.probMax}
          />);

        break;
      case SEARCH_TYPE_SAVED_LIST:
        selectedQuizSearchDialog = (
          <SavedListDialog
            listOptions={this.state.savedLists}
            onListSubmit={this.savedListSubmit}
            onListUpload={this.listUpload}
            onListFlashcard={this.flashcardSavedListSubmit}
          />);
        break;
      case SEARCH_TYPE_AEROLITH_LISTS:
        selectedQuizSearchDialog = (
          <AerolithListDialog
            listOptions={this.state.aerolithLists}
            selectedList={this.state.selectedList}
            onSelectedListChange={this.selectedListChange}
            onListSubmit={this.aerolithListSubmit}
            onFlashcardSubmit={this.flashcardAerolithListSubmit}
          />);
        break;
      default:
        selectedQuizSearchDialog = null;
    }
    return (
      <div>
        <Pills
          options={[
            SEARCH_TYPE_CHALLENGE,
            SEARCH_TYPE_WORDSEARCH,
            SEARCH_TYPE_AEROLITH_LISTS,
            SEARCH_TYPE_SAVED_LIST,
          ]}
          activePill={this.state.activeSearchType}
          onPillClick={option => () => {
            this.setState({
              activeSearchType: option,
            });
            if (option !== SEARCH_TYPE_CHALLENGE) {
              // Reset the time back to the defaults.
              this.setState({
                desiredTime: DEFAULT_TIME_PER_QUIZ,
                questionsPerRound: 50,
              });
            }
            this.loadInfoForSearchType(option);
          }}
        />
        {selectedQuizSearchDialog}
      </div>);
  }

  renderLobbyAndJoin() {
    return (
      <Lobby
        username={this.props.username}
        onChatSubmit={this.props.onChatSubmit}
        messages={this.props.messages}
      />
    );
  }

  render() {
    let mainDialog = null;
    if (this.state.activeGameType === GAME_TYPE_NEW) {
      mainDialog = this.renderQuizSearch();
    } else if (this.state.activeGameType === GAME_TYPE_JOIN) {
      mainDialog = this.renderLobbyAndJoin();
    }
    return (
      <ModalSkeleton
        title="New Word List"
        modalClass="table-modal"
        ref={el => (this.modal = el)}
        size="modal-xl"
      >
        <div className="modal-body">
          <div className="row">
            <div className="col-sm-2">
              <Sidebar
                gameTypes={[GAME_TYPE_NEW, GAME_TYPE_JOIN]}
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
                  this.state.activeSearchType === SEARCH_TYPE_CHALLENGE}
              />
            </div>
            <div className="col-sm-10">
              {mainDialog}
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
  defaultLexicon: React.PropTypes.number,
  availableLexica: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    lexicon: React.PropTypes.string,
    description: React.PropTypes.string,
    counts: React.PropTypes.object,
  })),
  challengeInfo: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  })),
  tablenum: React.PropTypes.number,
  onLoadNewList: React.PropTypes.func,
  gameGoing: React.PropTypes.bool,
  setLoadingData: React.PropTypes.func,
  username: React.PropTypes.string,
  onChatSubmit: React.PropTypes.func,
  messages: React.PropTypes.arrayOf(React.PropTypes.shape({
    author: React.PropTypes.string,
    id: React.PropTypes.string,
    content: React.PropTypes.string,
    type: React.PropTypes.string,
  })),
};


export default TableCreator;
