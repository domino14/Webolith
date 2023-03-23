import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

import DatePicker from '../../forms/date_picker';
import ChallengeResults from './challenge_results';
import ChallengeButtonRow from './challenge_button';

// XXX merge with similar function in blanks/dialog_container.js
function getLexiconName(availableLexica, lexicon) {
  return availableLexica.find((el) => el.id === lexicon).lexicon;
}

const ALL_TIME_TOUGHIE_LEXICA = ['CSW21', 'NWL20'];

function ChallengeDialog(props) {
  // For the different order priorities, make different buttons.
  const rows = [];
  const challs = props.challengesDoneAtDate.map((el) => el.challengeID);

  rows.push(<ChallengeButtonRow
    title="By Word Length"
    size="md"
    key="ch2"
    challenges={props.challengeInfo.filter((ch) => ch.orderPriority === 1)}
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  if (props.specialChallengeInfo.length) {
    rows.push(<ChallengeButtonRow
      title="Special Challenges"
      size="sm"
      key="ch6"
      challenges={props.specialChallengeInfo.filter((ch) => ch.orderPriority === 5)}
      onChallengeClick={props.onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={props.currentChallenge}
    />);
  }

  rows.push(<ChallengeButtonRow
    title="Word Builder"
    size="sm"
    key="ch5"
    challenges={props.challengeInfo.filter((ch) => ch.orderPriority === 4)}
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  // Bingo toughies
  rows.push(<ChallengeButtonRow
    title="Bingo Toughies"
    size="sm"
    key="ch3"
    challenges={
      // Leave out the "Common Words (long)" for now, and all-time toughies
      // for all but permitted lexica.
      props.challengeInfo.filter((ch) => {
        if (ch.orderPriority !== 6) {
          return false;
        }
        if ((ch.id === 28 || ch.id === 29) && !ALL_TIME_TOUGHIE_LEXICA.includes(
          getLexiconName(props.availableLexica, props.lexicon),
        )) {
          return false;
        }
        return true;
      })
    }
    onChallengeClick={props.onChallengeSelected}
    solvedChallenges={challs}
    selectedChallenge={props.currentChallenge}
  />);

  // Longer challenges
  rows.push(<ChallengeButtonRow
    title="Longer challenges"
    size="sm"
    key="ch3"
    challenges={props.challengeInfo.filter((ch) => ch.orderPriority === 2)}
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
    challenges={props.challengeInfo.filter((ch) => ch.orderPriority === 3)}
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
          type="button"
        >
          Play!
        </button>
      </div>
      <div className="col-sm-5">
        <ChallengeResults
          challengeData={props.challengeLeaderboardData}
          hideErrors={props.hideErrors}
          height={400}
          fixedLayout
        />
      </div>
    </div>
  );
}

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
  lexicon: PropTypes.number.isRequired,
  availableLexica: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    lexicon: PropTypes.string,
    description: PropTypes.string,
  })).isRequired,
  hideErrors: PropTypes.bool.isRequired,
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
