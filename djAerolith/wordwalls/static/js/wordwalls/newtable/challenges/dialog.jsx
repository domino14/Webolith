import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

import DatePicker from '../../forms/date_picker';
import ChallengeResults from './challenge_results';
import ChallengeButtonRow from './challenge_button';

const ChallengeDialog = (props) => {
  // For the different order priorities, make different buttons.
  const rows = [];
  const challs = props.challengesDoneAtDate.map(el => el.challengeID);

  rows.push(<ChallengeButtonRow
    title="By Word Length"
    size="md"
    key="ch2"
    challenges={props.challengeInfo.filter(ch => ch.orderPriority === 1)}
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  if (props.specialChallengeInfo.length) {
    rows.push(<ChallengeButtonRow
      title="Special Challenges"
      size="sm"
      key="ch6"
      challenges={props.specialChallengeInfo.filter(ch => ch.orderPriority === 5)}
      onChallengeClick={props.onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={props.currentChallenge}
    />);
  }

  rows.push(<ChallengeButtonRow
    title="Word Builder"
    size="sm"
    key="ch5"
    challenges={props.challengeInfo.filter(ch => ch.orderPriority === 4)}
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  // Hard challenges
  rows.push(<ChallengeButtonRow
    title="Tougher Challenges"
    size="sm"
    key="ch3"
    challenges={
      // Leave out the "Common Words (long)" for now.
      props.challengeInfo.filter(ch => ch.orderPriority === 2 && ch.id !== 19)
    }
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  // Finally, some uncommon challenges.

  rows.push(<ChallengeButtonRow
    title="Other Word Lengths"
    size="sm"
    key="ch4"
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
    challenges={props.challengeInfo.filter(ch => ch.orderPriority === 3)}
  />);

  return (
    <div className="row">
      <div className="col-sm-7">
        <DatePicker
          id="challenge-date"
          label="Challenge Date"
          value={props.currentDate}
          onDateChange={props.onDateChange}
          startDate={new Date(2011, 5, 14)}
        />

        {rows}

        <button
          className="btn btn-primary"
          style={{ marginTop: '0.75em' }}
          onClick={props.onChallengeSubmit}
          data-dismiss="modal"
          disabled={props.disabled ? 'disabled' : ''}
        >Play!
        </button>
      </div>
      <div className="col-sm-5">
        <ChallengeResults
          challengeData={props.challengeLeaderboardData}
          height={400}
        />
      </div>
    </div>
  );
};

ChallengeDialog.propTypes = {
  challengeInfo: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  })).isRequired,
  challengesDoneAtDate: PropTypes.arrayOf(PropTypes.shape({
    challengeID: PropTypes.number,
  })).isRequired,
  currentDate: PropTypes.instanceOf(moment).isRequired,
  onDateChange: PropTypes.func.isRequired,
  onChallengeSelected: PropTypes.func.isRequired,
  onChallengeSubmit: PropTypes.func.isRequired,
  challengeLeaderboardData: PropTypes.shape({
    entries: PropTypes.arrayOf(PropTypes.shape({
      user: PropTypes.string,
      score: PropTypes.number,
      tr: PropTypes.number,
      w: PropTypes.number,
      addl: PropTypes.string,
    })),
    challengeName: PropTypes.string,
    lexicon: PropTypes.string,
    maxScore: PropTypes.number,
  }).isRequired,
  specialChallengeInfo: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  })).isRequired,
  currentChallenge: PropTypes.number.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default ChallengeDialog;
