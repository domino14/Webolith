import React from 'react';
import moment from 'moment';

import DatePicker from '../forms/date_picker';
import ChallengeResults from '../challenge_results';
import ChallengeButtonRow from './challenge_button';

const ChallengeDialog = (props) => {
  // For the different order priorities, make different buttons.
  const rows = [];
  const challs = props.challengesDoneAtDate.map(el => el.challengeID);

  rows.push(
    <ChallengeButtonRow
      title="By Word Length"
      size="lg"
      key="ch2"
      challenges={props.challengeInfo.filter(ch => ch.orderPriority === 1)}
      onChallengeClick={props.onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={props.currentChallenge}
    />);

  // Hard challenges
  rows.push(
    <ChallengeButtonRow
      title="Tougher Challenges"
      size="sm"
      key="ch3"
      challenges={
        props.challengeInfo.filter(
          // Leave out the "Common Words (long)" for now.
          ch => ch.orderPriority === 2 && ch.id !== 19)
      }
      onChallengeClick={props.onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={props.currentChallenge}
    />);

  // Finally, some uncommon challenges.

  rows.push(
    <ChallengeButtonRow
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
        >Play!</button>
      </div>
      <div className="col-sm-5">
        <ChallengeResults
          challengeData={props.challengeData}
          height={400}
        />
      </div>
    </div>
  );
};

ChallengeDialog.propTypes = {
  challengeInfo: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  })),
  challengesDoneAtDate: React.PropTypes.arrayOf(React.PropTypes.shape({
    challengeID: React.PropTypes.number,
  })),
  currentDate: React.PropTypes.instanceOf(moment),
  onDateChange: React.PropTypes.func,
  onChallengeSelected: React.PropTypes.func,
  onChallengeSubmit: React.PropTypes.func,
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.arrayOf(React.PropTypes.shape({
      user: React.PropTypes.string,
      score: React.PropTypes.number,
      tr: React.PropTypes.number,
      addl: React.PropTypes.string,
    })),
    challengeName: React.PropTypes.string,
    lexicon: React.PropTypes.string,
    maxScore: React.PropTypes.number,
  }),
  currentChallenge: React.PropTypes.number,
};

export default ChallengeDialog;
