import React from 'react';

const TODAY_REGEX = /Today's (\d+)s/;


const ChallengeButton = (props) => {
  let extraClassName = '';
  const challengeName = props.challenge.name;
  let displayName = challengeName;
  const matches = TODAY_REGEX.exec(challengeName);
  // Try to match to the Today's {number}s format.
  if (matches) {
    displayName = matches[1];
  }

  if (props.selectedChallenge === props.challenge.id) {
    extraClassName = 'btn-info';
  } else if (props.activeChalls.includes(props.challenge.id)) {
    extraClassName = 'btn-danger';
  }
  const btnClassName = `btn btn-default ${extraClassName}`;
  return (
    <button
      type="button"
      className={btnClassName}
      onClick={props.onClick(props.challenge.id)}
    >{displayName}
    </button>
  );
};

ChallengeButton.propTypes = {
  challenge: React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  }),
  onClick: React.PropTypes.func,
  activeChalls: React.PropTypes.arrayOf(React.PropTypes.number),
  selectedChallenge: React.PropTypes.number,
};

const ChallengeButtonRow = (props) => {
  let groupClassName = 'btn-group';
  if (props.size !== 'md') {
    groupClassName += ` btn-group-${props.size}`;
  }
  // Create button row.
  const buttons = [];
  const onChallengeClick = props.onChallengeClick;
  const solvedChallenges = props.solvedChallenges;

  props.challenges.forEach((challenge) => {
    buttons.push(
      <ChallengeButton
        key={challenge.id}
        challenge={challenge}
        onClick={onChallengeClick}
        activeChalls={solvedChallenges}
        selectedChallenge={props.selectedChallenge}
      />);
  });

  return (
    <div className="row" style={{ marginTop: '0.75em' }}>
      <div className="col-sm-12">
        <div className="row">
          <div className="col-sm-12">
            <span className="label label-info">{props.title}</span>
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
    </div>);
};

ChallengeButtonRow.propTypes = {
  size: React.PropTypes.oneOf(['xs', 'sm', 'lg', 'md']),
  title: React.PropTypes.string,
  challenges: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  })),
  onChallengeClick: React.PropTypes.func,
  solvedChallenges: React.PropTypes.arrayOf(React.PropTypes.number),
  selectedChallenge: React.PropTypes.number,
};

export default ChallengeButtonRow;
