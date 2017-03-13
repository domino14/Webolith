import React from 'react';

const BUTTON_STATE_START = 1;
const BUTTON_STATE_GIVEUP = 2;
const BUTTON_STATE_YOUSURE = 3;

const YOU_SURE_TIMEOUT = 3000;

class StartButton extends React.Component {
  constructor() {
    super();
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.state = {
      buttonState: BUTTON_STATE_START,
    };
  }

  handleButtonClick() {
    if (this.props.gameGoing) {
      if (this.state.buttonState === BUTTON_STATE_GIVEUP) {
        this.setState({
          buttonState: BUTTON_STATE_YOUSURE,
        });

        window.setTimeout(() => {
          if (this.props.gameGoing) {
            this.setState({
              buttonState: BUTTON_STATE_GIVEUP,
            });
          } else {
            this.setState({
              buttonState: BUTTON_STATE_START,
            });
          }
        }, YOU_SURE_TIMEOUT);
      } else if (this.state.buttonState === BUTTON_STATE_YOUSURE) {
        this.props.handleGiveup();
        window.clearTimeout(this.state.changeTimeout);
        this.setState({
          buttonState: BUTTON_STATE_START,
          changeTimeout: null,
        });
      }
    } else {
      this.props.handleStart();
      this.setState({
        buttonState: BUTTON_STATE_GIVEUP,
      });
    }
  }

  render() {
    let buttonText;
    let buttonClass;

    // No matter what, if the game isn't going, display a Start button.
    if (!this.props.gameGoing) {
      buttonText = 'Start';
      buttonClass = 'btn btn-primary btn-sm';
    } else if (this.state.buttonState === BUTTON_STATE_GIVEUP) {
      buttonText = 'Give Up';
      buttonClass = 'btn btn-danger btn-sm';
    } else if (this.state.buttonState === BUTTON_STATE_YOUSURE) {
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
