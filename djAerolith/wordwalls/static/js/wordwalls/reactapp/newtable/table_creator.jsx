/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import $ from 'jquery';
import moment from 'moment';

import ModalSkeleton from '../modal_skeleton';
import Select from '../forms/select';
import Pills from './pills';
import ChallengeDialog from './challenge_dialog';
// import WordSearchDialog from './word_search_dialog';
// import SavedListDialog from './saved_list_dialog';
// import AerolithListDialog from './aerolith_list_dialog';

const GAME_TYPE_NEW = 'New';
const GAME_TYPE_JOIN = 'Join';
const SEARCH_TYPE_CHALLENGE = 'Challenges';
const SEARCH_TYPE_WORDSEARCH = 'Word Search';
const SEARCH_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const SEARCH_TYPE_SAVED_LIST = 'My saved lists';

const DATE_FORMAT_STRING = 'YYYY-MM-DD';
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

      currentLexicon: String(this.props.defaultLexicon),
      currentDate: moment(),
      challengesDoneAtDate: [],
      // Challenge data is leaderboard data.
      challengeData: {},
      currentChallenge: null,
    };
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
      this.loadTableCreationInfo();
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

  /**
   * Submit a challenge to the backend.
   */
  challengeSubmit() {
    $.ajax({
      url: '/wordwalls/api/new_challenge',
      data: JSON.stringify({
        lexicon: this.state.currentLexicon,
        date: this.state.currentDate.format(DATE_FORMAT_STRING),
        challenge: this.state.currentChallenge,
        tablenum: this.props.tablenum,
      }),
      method: 'POST',
    })
    .done(data => console.log(data));
  }

  loadTableCreationInfo() {
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
            onChallengeSelected={challID => () => {
              this.setState({
                currentChallenge: challID,
              });
            }}
            currentChallenge={this.state.currentChallenge}
          />);
        break;
      // case SEARCH_TYPE_WORDSEARCH:
      //   selectedQuizSearchDialog = WordSearchDialog;
      //   break;
      // case SEARCH_TYPE_SAVED_LIST:
      //   selectedQuizSearchDialog = SavedListDialog;
      //   break;
      // case SEARCH_TYPE_AEROLITH_LISTS:
      //   selectedQuizSearchDialog = AerolithListDialog;
      //   break;
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
                      selectedValue={this.state.currentLexicon}
                      options={getLexiconOptions(this.props.availableLexica)}
                      onChange={e => this.setState({
                        currentLexicon: e.target.value,
                      })}
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
                onPillClick={option => () => this.setState({
                  activeSearchType: option,
                })}
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
};


export default TableCreator;
