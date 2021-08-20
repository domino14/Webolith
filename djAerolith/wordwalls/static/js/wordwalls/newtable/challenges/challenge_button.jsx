import React from 'react';
import PropTypes from 'prop-types';

const TODAY_REGEX = /Today's (\d+)s/;

const ChallengeButton = (props) => {
  let extraClassName = '';
  const challengeName = props.challenge.name;
  let displayName = challengeName;
  const matches = TODAY_REGEX.exec(challengeName);
  const lengthIndex = 1;
  // Try to match to the Today's {number}s format.
  if (matches) {
    displayName = matches[lengthIndex];
  }

  if (props.selectedChallenge === props.challenge.id) {
    extraClassName = 'btn-info';
  } else if (props.solvedChallenges.includes(props.challenge.id)) {
    extraClassName = 'btn-link';
  } else {
    extraClassName = 'btn-default';
  }
  const btnClassName = `btn ${extraClassName}`;
  return (
    <button
      type="button"
      className={btnClassName}
      onClick={props.onClick(props.challenge.id)}
    >
      {displayName}
    </button>
  );
};

ChallengeButton.propTypes = {
  challenge: PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  solvedChallenges: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedChallenge: PropTypes.number.isRequired,
};

const ChallengeButtonRow = (props) => {
  let groupClassName = 'btn-group';
  if (props.size !== 'md') {
    groupClassName += ` btn-group-${props.size}`;
  }
  // Create button row.
  const buttons = [];
  const { onChallengeClick, solvedChallenges } = props;

  props.challenges.forEach((challenge) => {
    buttons.push(<ChallengeButton
      key={challenge.id}
      challenge={challenge}
      onClick={onChallengeClick}
      solvedChallenges={solvedChallenges}
      selectedChallenge={props.selectedChallenge}
    />);
  });

  return (
    <div className="row" style={{ marginTop: '0.75em' }}>
      <div className="col-sm-12">
        <div className="row">
          <div className="col-sm-12">
            <span className="label label-default">{props.title}</span>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <div className={groupClassName} role="group">
              {buttons}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ChallengeButtonRow.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'lg', 'md']).isRequired,
  title: PropTypes.string.isRequired,
  challenges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    seconds: PropTypes.number,
    numQuestions: PropTypes.number,
    name: PropTypes.string,
    orderPriority: PropTypes.number,
  })).isRequired,
  onChallengeClick: PropTypes.func.isRequired,
  solvedChallenges: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedChallenge: PropTypes.number.isRequired,
};

export default ChallengeButtonRow;
