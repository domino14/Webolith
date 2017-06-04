import React from 'react';

const BUTTON_STATE_IDLE = 1;
const BUTTON_STATE_TIMING_OUT = 3;

const YOU_SURE_TIMEOUT = 3000;

class StartButton extends React.Component {
  constructor() {
    super();
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.state = {
      buttonState: BUTTON_STATE_IDLE,
    };
  }

  handleButtonClick() {
    if (this.props.gameGoing) {
      if (this.state.buttonState === BUTTON_STATE_IDLE) {
        this.setState({
          buttonState: BUTTON_STATE_TIMING_OUT,
        });

        window.setTimeout(() => {
          this.setState({
            buttonState: BUTTON_STATE_IDLE,
          });
        }, YOU_SURE_TIMEOUT);
      } else if (this.state.buttonState === BUTTON_STATE_TIMING_OUT) {
        this.props.handleGiveup();
        window.clearTimeout(this.state.changeTimeout);
        this.setState({
          buttonState: BUTTON_STATE_IDLE,
          changeTimeout: null,
        });
      }
    } else {
      this.props.handleStart();
    }
  }

  render() {
    let buttonText;
    let buttonClass;

    // No matter what, if the game isn't going, display a Start button.
    if (!this.props.gameGoing) {
      buttonText = 'Start';
      buttonClass = 'btn btn-primary btn-sm';
    } else if (this.state.buttonState === BUTTON_STATE_IDLE) {
      buttonText = 'Give Up';
      buttonClass = 'btn btn-danger btn-sm';
    } else if (this.state.buttonState === BUTTON_STATE_TIMING_OUT) {
      buttonText = 'Are you sure?';
      buttonClass = 'btn btn-danger btn-sm';
    }

    return (
      <button
        className={buttonClass}
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
