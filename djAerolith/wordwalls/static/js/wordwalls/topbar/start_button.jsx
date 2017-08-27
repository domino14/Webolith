import React from 'react';

const BUTTON_STATE_IDLE = 1;
const BUTTON_STATE_COUNTING_DOWN = 2;
const BUTTON_STATE_GIVEUP_TIMING_OUT = 3;

const YOU_SURE_TIMEOUT = 3000;
const COUNTDOWN_SECS = 3;

class StartButton extends React.Component {
  constructor() {
    super();
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.state = {
      buttonState: BUTTON_STATE_IDLE,
      countdown: 0,
    };
    this.countdownTimeout = null;
    this.youSureTimeout = null;
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.gameGoing && nextProps.gameGoing) {
      // Give the button the correct IDLE state once the game starts.
      this.setState({
        buttonState: BUTTON_STATE_IDLE,
      });
    }
  }

  handleClickDuringGame() {
    if (this.state.buttonState === BUTTON_STATE_IDLE) {
      this.setState({
        buttonState: BUTTON_STATE_GIVEUP_TIMING_OUT,
      });
      this.youSureTimeout = window.setTimeout(() => {
        this.setState({
          buttonState: BUTTON_STATE_IDLE,
        });
      }, YOU_SURE_TIMEOUT);
    } else if (this.state.buttonState === BUTTON_STATE_GIVEUP_TIMING_OUT) {
      this.props.handleGiveup();
      this.setState({
        buttonState: BUTTON_STATE_IDLE,
      });
      window.clearTimeout(this.youSureTimeout);
    }
  }

  handleClickOutsideOfGame() {
    if (this.state.buttonState === BUTTON_STATE_IDLE) {
      if (this.props.canStartAndGiveUp) {
        this.setState({
          buttonState: BUTTON_STATE_COUNTING_DOWN,
        });
        this.countdownTimeout = window.setTimeout(() => {
          this.props.handleStart();
        }, COUNTDOWN_SECS * 1000);
        this.props.handleStartCountdown(COUNTDOWN_SECS);
      } else {
        // Try to start the game right away. This will send a message to the
        // server telling everyone that this user wants to start the game,
        // but won't actually start it.
        this.props.handleStart();
      }
    } else if (this.state.buttonState === BUTTON_STATE_COUNTING_DOWN) {
      this.setState({
        buttonState: BUTTON_STATE_IDLE,
      });
      window.clearTimeout(this.countdownTimeout);
      this.props.handleStartCountdownCancel();
    }
  }

  handleButtonClick() {
    if (this.props.gameGoing) {
      this.handleClickDuringGame();
    } else {
      this.handleClickOutsideOfGame();
    }
  }

  render() {
    let buttonText;
    let buttonClass;

    // No matter what, if the game isn't going, display a Start button.
    if (!this.props.gameGoing) {
      if (this.state.buttonState === BUTTON_STATE_COUNTING_DOWN) {
        buttonText = 'Starting...';
        buttonClass = 'btn btn-warning btn-sm';
      } else {
        buttonText = 'Start';
        buttonClass = 'btn btn-primary btn-sm';
      }
    } else if (this.state.buttonState === BUTTON_STATE_IDLE) {
      buttonText = 'Give Up';
      buttonClass = 'btn btn-danger btn-sm';
    } else if (this.state.buttonState === BUTTON_STATE_GIVEUP_TIMING_OUT) {
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
  handleStartCountdown: React.PropTypes.func,
  handleStartCountdownCancel: React.PropTypes.func,
  canStartAndGiveUp: React.PropTypes.bool,
};

export default StartButton;
