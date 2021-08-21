import React from 'react';
import PropTypes from 'prop-types';

const Pill = (props) => (
  <li role="presentation" className="nav-item">
    <button
      className={`nav-link${props.active ? ' active' : ''}`}
      role="tab"
      type="button"
      onClick={props.onPillClick}
    >
      {props.name}
    </button>
  </li>
);

Pill.propTypes = {
  active: PropTypes.bool.isRequired,
  onPillClick: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

const Pills = (props) => {
  let className;
  if (props.stacked) {
    className = 'nav nav-pills nav-stacked';
  } else {
    className = 'nav nav-pills';
  }
  // For every option, create a pill.
  const { activePill } = props;
  const pills = props.options.map((option) => (
    <Pill
      active={activePill === option}
      onPillClick={props.onPillClick(option)}
      name={option}
      key={option}
    />
  ));
  return (
    <ul className={className} role="tablist">
      {pills}
    </ul>
  );
};

Pills.defaultProps = {
  stacked: false,
};

Pills.propTypes = {
  activePill: PropTypes.string.isRequired,
  stacked: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPillClick: PropTypes.func.isRequired,
};

export default Pills;
