/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';

import ModalSkeleton from '../modal_skeleton';
import Pills from './pills';
import Notifications from '../notifications';
import Sidebar from './sidebar';
import WordwallsAPI from '../wordwalls_api';

import ChallengeDialogContainer from './challenges/dialog_container';
import BlankSearchDialogContainer from './blanks/dialog_container';
import WordSearchDialogContainer from './search/dialog_container';
import SavedListDialog, { PlayOptions } from './saved_list_dialog';
import AerolithListDialog from './aerolith_list_dialog';

// This auto-generated code has no exports. We will import it and use
// its globals.
import { createAnagrammerClient } from '../gen/rpc/wordsearcher/searcher_pb_twirp';

const GAME_TYPE_NEW = 'Load New List';
const LIST_TYPE_CHALLENGE = 'Single-Player Challenges';
const LIST_TYPE_WORDSEARCH = 'Word Search';
const LIST_TYPE_BLANKS = 'Blanks';
const LIST_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const LIST_TYPE_SAVED_LIST = 'My Saved Lists';
const FLASHCARD_URL = '/flashcards/';

const NO_LOAD_WHILE_PLAYING = (
  'Please wait until the end of the game to perform that action.');

const COLLINS_LEX_ID = 1;
const NWL20_LEX_ID = 15;
const FISE2_LEX_ID = 10;
const OSPS_LEX_ID = 11;
const COLLINS_19_LEX_ID = 12;
const COLLINS_LICENSE_TEXT = `
The Collins Official Scrabble Words 2015 (CSW15) is copyright of
HarperCollins Publishers 2015 and used with permission.`;
const NASPA_LICENSE_TEXT = `
NASPA Word List, 2020 Edition (NWL20), © 2020 North American Word Game
Players Association.  All rights reserved.`;
const FISE2_LICENSE_TEXT = `
© 2016 FISE (Federación Internacional de Scrabble en Español).
Reservados Todos Los Derechos.`;
const OSPS_LICENSE_TEXT = `
Copyright 2019 Polska Federacja Scrabble. Used with permission.`;
const COLLINS_19_LICENSE_TEXT = `
Collins Official Scrabble Words 2019 © HarperCollins Publishers 2019`;

const DEFAULT_TIME_PER_QUIZ = '5'; // minutes
const DEFAULT_TIME_PER_BLANK_QUIZ = '10';

const notifyError = (error) => {
  Notifications.alert('Error', `${error}`);
};

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

    this.selectedListChange = this.selectedListChange.bind(this);
    this.aerolithListSubmit = this.aerolithListSubmit.bind(this);
    this.flashcardAerolithListSubmit = this.flashcardAerolithListSubmit.bind(this);
    this.savedListSubmit = this.savedListSubmit.bind(this);
    this.flashcardSavedListSubmit = this.flashcardSavedListSubmit.bind(this);
    this.listUpload = this.listUpload.bind(this);
    this.preSubmitHook = this.preSubmitHook.bind(this);
    this.setTimeAndQuestions = this.setTimeAndQuestions.bind(this);

    this.showSpinner = this.showSpinner.bind(this);
    this.hideSpinner = this.hideSpinner.bind(this);
    this.api = new WordwallsAPI();
    this.wordServerRPC = createAnagrammerClient('/word_db_server');
  }

  /**
   * If certain fields in the state have changed, we should make
   * some network requests.
   */
  componentDidUpdate(prevProps, prevState) {
    // XXX: this should be moved to individual dialog containers.
    // If the lexicon changes, we have to load new word lists no matter what.
    if (prevState.currentLexicon !== this.state.currentLexicon) {
      // We may need to load new lists.
      this.loadInfoForListType(this.state.activeListType);
    }
  }

  setTimeAndQuestions(o) {
    this.setState({
      desiredTime: o.desiredTime,
      questionsPerRound: o.questionsPerRound,
    });
  }

  loadInfoForListType(option) {
    switch (option) {
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
    if (this.challengeDialogContainer) {
      // XXX: This is an anti-pattern, but modals and React don't play
      // 100% well together.
      this.challengeDialogContainer.loadChallengePlayedInfo();
      this.challengeDialogContainer.loadChallengeLeaderboardData();
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

  renderLicenseText() {
    switch (this.state.currentLexicon) {
      case COLLINS_LEX_ID:
        return (<span>{COLLINS_LICENSE_TEXT}</span>);
      case COLLINS_19_LEX_ID:
        return (<span>{COLLINS_19_LICENSE_TEXT}</span>);
      case NWL20_LEX_ID:
        return (<span>{NASPA_LICENSE_TEXT}</span>);
      case FISE2_LEX_ID:
        return (<span>{FISE2_LICENSE_TEXT}</span>);
      case OSPS_LEX_ID:
        return (<span>{OSPS_LICENSE_TEXT}</span>);
      default:
        return null;
    }
  }

  renderQuizSearch() {
    let selectedQuizSearchDialog;
    switch (this.state.activeListType) {
      case LIST_TYPE_CHALLENGE:
        selectedQuizSearchDialog = (
          <ChallengeDialogContainer
            tablenum={this.props.tablenum}
            onLoadNewList={this.props.onLoadNewList}
            challengeInfo={this.props.challengeInfo}
            hideErrors={this.props.hideErrors}
            showSpinner={this.showSpinner}
            hideSpinner={this.hideSpinner}
            lexicon={this.state.currentLexicon}
            api={this.api}
            preSubmitHook={this.preSubmitHook}
            notifyError={notifyError}
            setTimeAndQuestions={this.setTimeAndQuestions}
            disabled={this.props.gameGoing}
            ref={(ref) => {
              this.challengeDialogContainer = ref;
            }}
          />);
        break;
      case LIST_TYPE_WORDSEARCH:
        selectedQuizSearchDialog = (
          <WordSearchDialogContainer
            tablenum={this.props.tablenum}
            onLoadNewList={this.props.onLoadNewList}
            showSpinner={this.showSpinner}
            hideSpinner={this.hideSpinner}
            lexicon={this.state.currentLexicon}
            desiredTime={parseFloat(this.state.desiredTime)}
            questionsPerRound={this.state.questionsPerRound}
            notifyError={notifyError}
            redirectUrl={TableCreator.redirectUrl}
            api={this.api}
            disabled={this.props.gameGoing}
          />);

        break;
      case LIST_TYPE_BLANKS:
        selectedQuizSearchDialog = (
          <BlankSearchDialogContainer
            tablenum={this.props.tablenum}
            onLoadNewList={this.props.onLoadNewList}
            showSpinner={this.showSpinner}
            hideSpinner={this.hideSpinner}
            lexicon={this.state.currentLexicon}
            availableLexica={this.props.availableLexica}
            desiredTime={parseFloat(this.state.desiredTime)}
            questionsPerRound={this.state.questionsPerRound}
            notifyError={notifyError}
            redirectUrl={TableCreator.redirectUrl}
            api={this.api}
            wordServerRPC={this.wordServerRPC}
            disabled={this.props.gameGoing}
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
            LIST_TYPE_BLANKS,
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
              if (option !== LIST_TYPE_BLANKS) {
                this.setState({
                  desiredTime: DEFAULT_TIME_PER_QUIZ,
                  questionsPerRound: 50,
                });
              } else {
                this.setState({
                  desiredTime: DEFAULT_TIME_PER_BLANK_QUIZ,
                  questionsPerRound: 50,
                });
              }
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
                defaultLexicon={this.props.defaultLexicon}
                availableLexica={this.props.availableLexica}
                setLexicon={lex => this.setState({
                  currentLexicon: lex,
                })}
                setDefaultLexicon={this.props.setDefaultLexicon}
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
          >{this.renderLicenseText()}
          </small>
        </div>
      </ModalSkeleton>
    );
  }
}

TableCreator.propTypes = {
  defaultLexicon: PropTypes.number.isRequired,
  setDefaultLexicon: PropTypes.func.isRequired,
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
  hideErrors: PropTypes.bool.isRequired,
};


export default TableCreator;
