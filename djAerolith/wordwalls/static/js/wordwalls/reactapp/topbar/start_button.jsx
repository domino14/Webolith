import React from 'react';

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
        onClick={this.handleButtonClick}
        style={{
          marginTop: '-4px',
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
