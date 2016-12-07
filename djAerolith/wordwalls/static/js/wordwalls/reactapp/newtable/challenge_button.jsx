import React from 'react';

const ChallengeButton = props => (
  <button
    type="button"
    className={`btn btn-default${props.active ? ' btn-danger' : ''}`}
    onClick={props.onClick}
  >{props.challenge.name}
  </button>
);

ChallengeButton.propTypes = {
  challenge: React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  }),
  onClick: React.PropTypes.func,
  active: React.PropTypes.bool,
};

const ChallengeButtonRow = (props) => {
  let groupClassName = 'btn-group';
  if (props.size !== 'md') {
    groupClassName += ` btn-group-${props.size}`;
  }
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
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </div>);
};

ChallengeButtonRow.propTypes = {
  size: React.PropTypes.oneOf(['xs', 'sm', 'lg', 'md']),
  children: React.PropTypes.node,
  title: React.PropTypes.string,
};

export default ChallengeButton;
export { ChallengeButtonRow };
