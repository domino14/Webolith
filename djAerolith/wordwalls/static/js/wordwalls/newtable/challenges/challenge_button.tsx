import React from 'react';

const TODAY_REGEX = /Today's (\d+)s/;

interface Challenge {
  id: number;
  seconds: number;
  numQuestions: number;
  name: string;
  orderPriority: number;
}

interface ChallengeButtonProps {
  challenge: Challenge;
  onClick: (challengeId: number) => () => void;
  solvedChallenges: number[];
  selectedChallenge: number;
}

function ChallengeButton({
  challenge,
  onClick,
  solvedChallenges,
  selectedChallenge,
}: ChallengeButtonProps) {
  let extraClassName = '';
  const challengeName = challenge.name;
  let displayName = challengeName;
  const matches = TODAY_REGEX.exec(challengeName);
  const lengthIndex = 1;
  // Try to match to the Today's {number}s format.
  if (matches) {
    displayName = matches[lengthIndex];
  }

  if (selectedChallenge === challenge.id) {
    extraClassName = 'btn-info';
  } else if (solvedChallenges.includes(challenge.id)) {
    extraClassName = 'btn-link';
  } else {
    extraClassName = 'btn-default';
  }
  const btnClassName = `btn ${extraClassName}`;
  return (
    <button
      type="button"
      className={btnClassName}
      onClick={onClick(challenge.id)}
    >
      {displayName}
    </button>
  );
}

type ButtonSize = 'xs' | 'sm' | 'lg' | 'md';

interface ChallengeButtonRowProps {
  size: ButtonSize;
  title: string;
  challenges: Challenge[];
  onChallengeClick: (challengeId: number) => () => void;
  solvedChallenges: number[];
  selectedChallenge: number;
}

function ChallengeButtonRow({
  size,
  title,
  challenges,
  onChallengeClick,
  solvedChallenges,
  selectedChallenge,
}: ChallengeButtonRowProps) {
  let groupClassName = 'btn-group';
  if (size !== 'md') {
    groupClassName += ` btn-group-${size}`;
  }
  // Create button row.
  const buttons: React.ReactElement[] = [];

  challenges.forEach((challenge) => {
    buttons.push(<ChallengeButton
      key={challenge.id}
      challenge={challenge}
      onClick={onChallengeClick}
      solvedChallenges={solvedChallenges}
      selectedChallenge={selectedChallenge}
    />);
  });

  return (
    <div className="row" style={{ marginTop: '0.75em' }}>
      <div className="col-sm-12">
        <div className="row">
          <div className="col-sm-12">
            <span className="label label-default">{title}</span>
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
}

export default ChallengeButtonRow;
