import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import ChallengeDialog from './dialog';
import WordwallsAPI from '../../wordwalls_api';

const CHALLENGERS_URL = '/wordwalls/api/challengers/';
const NEW_CHALLENGE_URL = '/wordwalls/api/new_challenge/';
const CHALLENGES_PLAYED_URL = '/wordwalls/api/challenges_played/';
const DATE_FORMAT_STRING = 'YYYY-MM-DD';

class ChallengeDialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDate: moment(),
      challengesDoneAtDate: [],
      currentChallenge: 0,
      challengeData: {},
    };
    this.challengeSubmit = this.challengeSubmit.bind(this);
    this.onChallengeSelected = this.onChallengeSelected.bind(this);
  }

  componentDidMount() {
    this.loadChallengePlayedInfo();
  }

  componentDidUpdate(prevProps, prevState) {
    let loaded = false;
    if ((prevProps.lexicon !== this.props.lexicon) ||
        (prevState.currentDate.format(DATE_FORMAT_STRING) !==
        this.state.currentDate.format(DATE_FORMAT_STRING))) {
      this.loadChallengePlayedInfo();
      loaded = true;
    }
    if ((prevState.currentChallenge !== this.state.currentChallenge) ||
        loaded) {
      this.loadChallengeLeaderboardData();
    }
  }

  onChallengeSelected(challID) {
    const challenge = this.props.challengeInfo.find(c => c.id === challID);
    this.setState({
      currentChallenge: challID,
    });
    this.props.setTimeAndQuestions({
      desiredTime: String(challenge.seconds / 60),
      questionsPerRound: challenge.numQuestions,
    });
  }

  loadChallengeLeaderboardData() {
    if (!this.state.currentChallenge) {
      return;
    }
    this.props.showSpinner();
    this.props.api.call(CHALLENGERS_URL, {
      lexicon: this.props.lexicon,
      date: this.state.currentDate.format(DATE_FORMAT_STRING),
      challenge: this.state.currentChallenge,
    }, 'GET')
      .then(data => this.setState({
        challengeData: data || {},
      }))
      .catch(error => this.props.notifyError(error))
      .finally(() => this.props.hideSpinner());
  }

  /**
   * Submit a challenge to the backend.
   */
  challengeSubmit() {
    this.props.showSpinner();
    this.props.api.call(NEW_CHALLENGE_URL, {
      lexicon: this.props.lexicon,
      date: this.state.currentDate.format(DATE_FORMAT_STRING),
      challenge: this.state.currentChallenge,
      tablenum: this.props.tablenum,
    })
      .then(data => this.props.onLoadNewList(data))
      .catch(error => this.props.notifyError(error))
      .finally(() => this.props.hideSpinner());
  }

  loadChallengePlayedInfo() {
    // Load the challenge-related stuff.
    this.props.showSpinner();
    this.props.api.call(CHALLENGES_PLAYED_URL, {
      lexicon: this.props.lexicon,
      date: this.state.currentDate.format(DATE_FORMAT_STRING),
    }, 'GET')
      .then(data => this.setState({
        challengesDoneAtDate: data,
      }))
      .catch(error => this.props.notifyError(error))
      .finally(() => this.props.hideSpinner());
  }

  render() {
    return (
      <ChallengeDialog
        challengeInfo={this.props.challengeInfo}
        disabled={this.state.currentChallenge === 0}
        currentChallenge={this.state.currentChallenge}
        challengesDoneAtDate={this.state.challengesDoneAtDate}
        challengeData={this.state.challengeData}
        onDateChange={(date) => {
          this.setState({
            currentDate: moment(date),
          });
        }}
        currentDate={this.state.currentDate}
        onChallengeSubmit={() => this.props.preSubmitHook(this.challengeSubmit)}
        onChallengeSelected={challID => () => this.onChallengeSelected(challID)}
      />
    );
  }
}

ChallengeDialogContainer.propTypes = {
  challengeInfo: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  })).isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  api: PropTypes.instanceOf(WordwallsAPI).isRequired,
  setTimeAndQuestions: PropTypes.func.isRequired,
  tablenum: PropTypes.number.isRequired,
  onLoadNewList: PropTypes.func.isRequired,
  lexicon: PropTypes.number.isRequired,
  preSubmitHook: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
};

export default ChallengeDialogContainer;

