/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import $ from 'jquery';
import moment from 'moment';

import ModalSkeleton from '../modal_skeleton';
import Select from '../forms/select';
import NumberInput from '../forms/number_input';
import Pills from './pills';
import ChallengeDialog from './challenge_dialog';
import WordSearchDialog from './word_search_dialog';
import Notifications from '../notifications';
// import SavedListDialog from './saved_list_dialog';
import AerolithListDialog from './aerolith_list_dialog';

const GAME_TYPE_NEW = 'New';
const GAME_TYPE_JOIN = 'Join';
const SEARCH_TYPE_CHALLENGE = 'Challenges';
const SEARCH_TYPE_WORDSEARCH = 'Word Search';
const SEARCH_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const SEARCH_TYPE_SAVED_LIST = 'My saved lists';

const DATE_FORMAT_STRING = 'YYYY-MM-DD';

const NO_LOAD_WHILE_PLAYING = (
  'Cannot load a game while you are in the middle of another one...');
/**
 * Get lexicon options from the given object in a Select-friendly format.
 * @param  {Array.<Object>} lexicaObject
 * @return {Array.<Object>}
 */
function getLexiconOptions(lexicaObject) {
  return lexicaObject.map(obj => ({
    value: String(obj.id),
    displayValue: obj.lexicon,
  }));
}

/**
 * TableCreator should mostly manage its own state, do its own AJAX queries,
 * etc.. It is mostly an independent app. It will have parallels to
 * WordwallsApp, even though it is a part of it.
 */
class TableCreator extends React.Component {
  // We must pass the props to the constructor if we want to use
  // them in the state initializer.
  constructor(props) {
    super(props);
    this.state = {
      activeGameType: GAME_TYPE_NEW,
      activeSearchType: SEARCH_TYPE_CHALLENGE,

      currentLexicon: this.props.defaultLexicon,

      desiredTime: 5,   // minutes
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
    };
    this.challengeSubmit = this.challengeSubmit.bind(this);
    this.onChallengeSelected = this.onChallengeSelected.bind(this);
    this.searchParamChange = this.searchParamChange.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
  }

  // On mounting of this element, we need to create the various things
  // it needs from the backend - the saved lists, named lists, and
  // challenge-related information.
  componentDidMount() {
    this.loadTableCreationInfo();
  }

  /**
   * If certain fields in the state have changed, we should make
   * some network requests.
   */
  componentDidUpdate(prevProps, prevState) {
    if ((prevState.currentLexicon !== this.state.currentLexicon) ||
        (prevState.currentDate !== this.state.currentDate)) {
      this.loadChallengePlayedInfo();
    }
    if (prevState.currentChallenge !== this.state.currentChallenge) {
      // The challenge changed. We should load challenge leaderboard data.
      $.ajax({
        url: '/wordwalls/api/challengers/',
        data: {
          lexicon: this.state.currentLexicon,
          date: this.state.currentDate.format(DATE_FORMAT_STRING),
          challenge: this.state.currentChallenge,
        },
        method: 'GET',
      })
      .done(data => this.setState({ challengeData: data || {} }));
    }
  }

  onChallengeSelected(challID) {
    const challenge = this.props.challengeInfo.find(c => c.id === challID);
    this.setState({
      currentChallenge: challID,
      desiredTime: challenge.seconds / 60,
      questionsPerRound: challenge.numQuestions,
    });
  }

  /**
   * Submit a challenge to the backend.
   */
  challengeSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('small', 'error', NO_LOAD_WHILE_PLAYING);
      return;
    }
    $.ajax({
      url: '/wordwalls/api/new_challenge/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
        challenge: this.state.currentChallenge,
        tablenum: this.props.tablenum,
      }),
      method: 'POST',
    })
    .done(data => this.props.onLoadNewList(data))
    .fail(jqXHR => Notifications.alert('small', 'Error',
      `Failed to load challenge: ${jqXHR.responseJSON}`));
  }

  searchSubmit() {
    if (this.props.gameGoing) {
      Notifications.alert('small', 'Error', NO_LOAD_WHILE_PLAYING);
      return;
    }
    $.ajax({
      url: '/wordwalls/api/new_search/',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        probMin: parseInt(this.state.probMin, 10),
        probMax: parseInt(this.state.probMax, 10),
        wordLength: this.state.wordLength,
        desiredTime: this.state.desiredTime,
        questionsPerRound: this.state.questionsPerRound,
        tablenum: this.props.tablenum,
      }),
      method: 'POST',
    })
    .done(data => this.props.onLoadNewList(data))
    .fail(jqXHR => Notifications.alert('small', 'Error',
      `Failed to load search: ${jqXHR.responseJSON}`));
  }

  loadChallengePlayedInfo() {
    // Load the challenge-related stuff.
    $.ajax({
      url: '/wordwalls/api/challenges_played/',
      data: {
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
      },
      method: 'GET',
    })
    .done(data => this.setState({ challengesDoneAtDate: data }));
  }

  loadTableCreationInfo() {
    this.loadChallengePlayedInfo();
  }

  searchParamChange(paramName, paramValue) {
    const curState = {};
    curState[paramName] = paramValue;
    this.setState(curState);
  }

  render() {
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
            onChallengeSelected={challID => () => this.onChallengeSelected(challID)}
            currentChallenge={this.state.currentChallenge}
          />);
        break;
      case SEARCH_TYPE_WORDSEARCH:
        selectedQuizSearchDialog = (
          <WordSearchDialog
            lexicon={this.state.currentLexicon}
            availableLexica={this.props.availableLexica}
            onSearchSubmit={this.searchSubmit}
            onSearchParamChange={this.searchParamChange}
            wordLength={this.state.wordLength}
            probMin={this.state.probMin}
            probMax={this.state.probMax}
          />);

        break;
      // case SEARCH_TYPE_SAVED_LIST:
      //   selectedQuizSearchDialog = SavedListDialog;
      //   break;
      case SEARCH_TYPE_AEROLITH_LISTS:
        selectedQuizSearchDialog = AerolithListDialog;
        break;
      default:
        selectedQuizSearchDialog = null;
    }
    return (
      <ModalSkeleton
        title="New Table"
        modalClass="table-modal"
      >
        <div className="modal-body">
          <div className="row">
            <div className="col-sm-2">
              <Pills
                stacked
                options={[GAME_TYPE_NEW, GAME_TYPE_JOIN]}
                activePill={this.state.activeGameType}
                onPillClick={option => () => this.setState({
                  activeGameType: option,
                })}
              />
              <div className="row">
                <div className="col-sm-12">
                  <form>
                    <Select
                      colSize={10}
                      label="Lexicon"
                      selectedValue={String(this.state.currentLexicon)}
                      options={getLexiconOptions(this.props.availableLexica)}
                      onChange={e => this.setState({
                        currentLexicon: parseInt(e.target.value, 10),
                      })}
                    />
                    <NumberInput
                      colSize={10}
                      label="Minutes"
                      value={String(this.state.desiredTime)}
                      onChange={e => this.setState({
                        desiredTime: parseFloat(e.target.value, 10),
                      })}
                      disabled={this.state.activeSearchType === SEARCH_TYPE_CHALLENGE}
                    />
                    <NumberInput
                      colSize={10}
                      label="Questions Per Round"
                      value={String(this.state.questionsPerRound)}
                      onChange={e => this.setState({
                        questionsPerRound: parseFloat(e.target.value, 10),
                      })}
                      disabled={this.state.activeSearchType === SEARCH_TYPE_CHALLENGE}
                    />
                  </form>
                </div>
              </div>
            </div>
            <div className="col-sm-10">
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
                      desiredTime: 5,
                      questionsPerRound: 50,
                    });
                  }
                }}
              />
              {selectedQuizSearchDialog}
            </div>

          </div>
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
};


export default TableCreator;
