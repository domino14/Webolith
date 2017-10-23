/**
 * @fileOverview The actual Start button.
 */
import React from 'react';
import PropTypes from 'prop-types';

const StartButton = props => (
  <button
    className={props.buttonClass}
    onClick={props.handleButtonClick}
    style={{
      marginTop: '-6px',
    }}
  >{props.buttonText}
  </button>
);


StartButton.propTypes = {
  handleButtonClick: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired,
  buttonClass: PropTypes.string.isRequired,
};

export default StartButton;

