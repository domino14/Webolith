/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';

const Pill = props => (
  <li role="presentation" className={props.active ? 'active' : ''}>
    <a onClick={props.onPillClick}>{props.name}</a>
  </li>
);

Pill.propTypes = {
  active: React.PropTypes.bool,
  onPillClick: React.PropTypes.func,
  name: React.PropTypes.string,
};

const Pills = (props) => {
  let className;
  if (props.stacked) {
    className = 'nav nav-pills nav-stacked';
  } else {
    className = 'nav nav-pills';
  }
  // For every option, create a pill.
  const activePill = props.activePill;
  const pills = props.options.map((option, idx) => (
    <Pill
      active={activePill === option}
      onPillClick={props.onPillClick(option)}
      name={option}
      key={idx}
    />));
  return (
    <ul className={className}>
      {pills}
    </ul>
  );
};

Pills.propTypes = {
  activePill: React.PropTypes.string,
  stacked: React.PropTypes.bool,
  options: React.PropTypes.arrayOf(React.PropTypes.string),
  onPillClick: React.PropTypes.func,
};

export default Pills;
