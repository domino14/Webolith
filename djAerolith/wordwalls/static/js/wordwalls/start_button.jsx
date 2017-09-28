/**
 * @fileOverview The actual Start button.
 */
import React from 'react';

const StartButton = props => (
  <button
    className={props.buttonClass}
    onClick={props.handleButtonClick}
    style={{
      marginTop: '-6px',
    }}
  >{props.buttonText}</button>
);


StartButton.propTypes = {
  handleButtonClick: React.PropTypes.func,
  buttonText: React.PropTypes.string,
  buttonClass: React.PropTypes.string,
};

export default StartButton;

