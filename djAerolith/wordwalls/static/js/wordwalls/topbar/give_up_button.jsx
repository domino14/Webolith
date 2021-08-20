import React from 'react';
import PropTypes from 'prop-types';

const BUTTON_STATE_IDLE = 1;
const BUTTON_STATE_GIVEUP_TIMING_OUT = 3;

const YOU_SURE_TIMEOUT = 3000;

class GiveUpButton extends React.Component {
  constructor() {
    super();
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.state = {
      buttonState: BUTTON_STATE_IDLE,
    };
    this.youSureTimeout = null;
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
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

  handleButtonClick() {
    if (this.props.gameGoing) {
      this.handleClickDuringGame();
    }
  }

  render() {
    let buttonText;
    let buttonClass;

    if (!this.props.gameGoing) {
      return null;
    } if (this.state.buttonState === BUTTON_STATE_IDLE) {
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
        type="button"
      >
        {buttonText}
      </button>
    );
  }
}

GiveUpButton.propTypes = {
  gameGoing: PropTypes.bool.isRequired,
  handleGiveup: PropTypes.func.isRequired,
};

export default GiveUpButton;
