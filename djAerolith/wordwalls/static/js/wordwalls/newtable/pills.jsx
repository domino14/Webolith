/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events,jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';

const Pill = props => (
  <li role="presentation" className={props.active ? 'active' : ''}>
    <a onClick={props.onPillClick}>{props.name}</a>
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
  const pills = props.options.map(option => (
    <Pill
      active={activePill === option}
      onPillClick={props.onPillClick(option)}
      name={option}
      key={option}
    />));
  return (
    <ul className={className}>
      {pills}
    </ul>
  );
};

Pills.propTypes = {
  activePill: PropTypes.string.isRequired,
  stacked: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPillClick: PropTypes.func.isRequired,
};

export default Pills;
