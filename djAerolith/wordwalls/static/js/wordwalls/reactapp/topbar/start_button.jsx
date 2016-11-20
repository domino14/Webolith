import React from 'react';
import $ from 'jquery';

const DISABLE_BUTTON_TIMEOUT = 1000;

class StartButton extends React.Component {
  constructor() {
    super();
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  handleButtonClick() {
    if (this.props.gameGoing) {
      this.props.handleGiveup();
    } else {
      this.props.handleStart();
    }
    $(this.button).prop('disabled', true);
    window.setTimeout(() => $(this.button).prop('disabled', false),
      DISABLE_BUTTON_TIMEOUT);
  }

  render() {
    let buttonText;
    let buttonClass;
    if (this.props.gameGoing) {
      buttonText = 'Give Up';
      buttonClass = 'btn btn-danger btn-sm';
    } else {
      buttonText = 'Start';
      buttonClass = 'btn btn-primary btn-sm';
    }

    return (
      <button
        className={buttonClass}
        ref={btn => (this.button = btn)}
        onClick={this.handleButtonClick}
        style={{
          marginTop: '-6px',
        }}
      >{buttonText}</button>
    );
  }
}

StartButton.propTypes = {
  gameGoing: React.PropTypes.bool,
  handleGiveup: React.PropTypes.func,
  handleStart: React.PropTypes.func,
};

export default StartButton;
