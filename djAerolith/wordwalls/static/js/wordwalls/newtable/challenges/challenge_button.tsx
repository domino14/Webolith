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
  size?: ButtonSize;
}

function ChallengeButton({
  challenge,
  onClick,
  solvedChallenges,
  selectedChallenge,
  size,
}: ChallengeButtonProps) {
  let extraClassName = '';
  let customStyle: React.CSSProperties = {};
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
    extraClassName = 'btn-outline-primary';
    customStyle = {
      backgroundColor: '#f8f9fa',
      borderColor: '#dee2e6',
      color: '#495057',
      opacity: 0.8,
    };
  } else {
    extraClassName = 'btn-outline-primary';
  }
  let btnClassName = `btn ${extraClassName}`;
  if (size === 'xs' || size === 'sm') {
    btnClassName += ' btn-sm';
  }
  return (
    <button
      type="button"
      className={btnClassName}
      style={customStyle}
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
  // Bootstrap 5 removed btn-group-xs, we'll use btn-group-sm for xs
  if (size === 'xs' || size === 'sm') {
    groupClassName += ' btn-group-sm';
  } else if (size === 'lg') {
    groupClassName += ' btn-group-lg';
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
      size={size}
    />);
  });

  return (
    <div className="row" style={{ marginTop: '0.75em' }}>
      <div className="col-sm-12">
        <div className="row">
          <div className="col-sm-12">
            <span className="badge bg-secondary">{title}</span>
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
