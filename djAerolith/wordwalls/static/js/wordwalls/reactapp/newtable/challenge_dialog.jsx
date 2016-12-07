import React from 'react';
import moment from 'moment';

import DatePicker from '../forms/date_picker';
import ChallengeResults from '../challenge_results';
import ChallengeButton, { ChallengeButtonRow } from './challenge_button';

const ChallengeDialog = (props) => {
  // For the different order priorities, make different buttons.
  const rows = [];
  const challs = props.challengesDoneAtDate.map(el => el.challengeID);
  // Add the challenges one by one.
  // rows.push(
  //   <ChallengeButtonRow title="Common Words" size="md" key="ch1">
  //     <ChallengeButton
  //       challenge={{ name: 'Common Words (short)' }}
  //       onClick={() => {}}
  //     />
  //     <ChallengeButton
  //       challenge={{ name: 'Common Words (long)' }}
  //       onClick={() => {}}
  //     />
  //   </ChallengeButtonRow>);
  // Common letter lengths.
  let buttons = [];
  for (let i = 3; i <= 9; i += 1) {
    buttons.push(
      <ChallengeButton
        challenge={{ name: `${i}` }}
        key={i}
        onClick={props.onChallengeSelected(i - 1)}
        active={challs.includes(i - 1)/* XXX: Hardcode for now. Fix later.*/}
      />);
  }
  rows.push(
    <ChallengeButtonRow title="By Word Length" size="lg" key="ch2">
      {buttons}
    </ChallengeButtonRow>);

  // Hard challenges
  rows.push(
    <ChallengeButtonRow title="Tougher Challenges" size="sm" key="ch3">
      <ChallengeButton
        challenge={{ name: 'Week\'s Bingo Toughies' }}
        onClick={props.onChallengeSelected(15)}
        active={challs.includes(15)}
      />
      <ChallengeButton
        challenge={{ name: 'Bingo Marathon' }}
        onClick={props.onChallengeSelected(17)}
        active={challs.includes(17)}
      />
      <ChallengeButton
        challenge={{ name: 'Blank Bingos' }}
        onClick={props.onChallengeSelected(16)}
        active={challs.includes(16)}
      />
    </ChallengeButtonRow>);

  // Finally, some uncommon challenges.
  buttons = [];
  for (let i = 2; i <= 15; i += 1) {
    if (i >= 3 && i <= 9) {
      continue; // eslint-disable-line no-continue
    }
    buttons.push(
      <ChallengeButton
        challenge={{ name: `${i}` }}
        key={i}
        onClick={props.onChallengeSelected(i - 1)}
        active={challs.includes(i - 1)}
      />);
  }
  rows.push(
    <ChallengeButtonRow title="Other Word Lengths" size="sm" key="ch4">
      {buttons}
    </ChallengeButtonRow>);

  return (
    <div className="row">
      <div className="col-sm-8">
        <DatePicker
          id="challenge-date"
          label="Challenge Date"
          value={props.currentDate}
          onDateChange={props.onDateChange}
          startDate={new Date(2011, 5, 14)}
        />

        {rows}

        <button
          className="btn btn-info"
          style={{ marginTop: '0.75em' }}
        >Play!</button>
      </div>
      <div className="col-sm-4">
        <ChallengeResults
          challengeData={props.challengeData}
        />
      </div>
    </div>
  );
};

ChallengeDialog.propTypes = {
  // challengeInfo: React.PropTypes.arrayOf(React.PropTypes.shape({
  //   id: React.PropTypes.number,
  //   seconds: React.PropTypes.number,
  //   numQuestions: React.PropTypes.number,
  //   name: React.PropTypes.string,
  //   orderPriority: React.PropTypes.number,
  // })),
  challengesDoneAtDate: React.PropTypes.arrayOf(React.PropTypes.shape({
    challengeID: React.PropTypes.number,
  })),
  currentDate: React.PropTypes.instanceOf(moment),
  onDateChange: React.PropTypes.func,
  onChallengeSelected: React.PropTypes.func,
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.arrayOf(React.PropTypes.shape({
      user: React.PropTypes.string,
      score: React.PropTypes.number,
      tr: React.PropTypes.number,
      addl: React.PropTypes.string,
    })),
    challengeName: React.PropTypes.string,
    lexicon: React.PropTypes.string,
  }),
};

export default ChallengeDialog;
