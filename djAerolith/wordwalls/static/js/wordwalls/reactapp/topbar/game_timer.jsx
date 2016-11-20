/**
 * Heavily based on
 * https://github.com/uken/react-countdown-timer
 * MIT licensed.
 */

import React from 'react';

class GameTimer extends React.Component {
  static getFormattedTime(milliseconds) {
    let seconds;
    let minutes;
    const totalSeconds = Math.round(milliseconds / 1000);
    seconds = parseInt(totalSeconds % 60, 10);
    minutes = parseInt(totalSeconds / 60, 10) % 60;

    seconds = seconds < 10 ? `0${seconds}` : seconds;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${minutes}:${seconds}`;
  }

  constructor(props) {
    super(props);
    this.state = {
      timeRemaining: this.props.initialGameTime,
      timeoutId: null,
      prevTime: null,
    };
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.tick();
  }

  /**
   * Called when component is about to receive new props (typically
   * when timer is reset).
   * @param  {Object} newProps
   */
  componentWillReceiveProps(newProps) {
    if (!newProps.gameGoing) {
      this.setState({
        prevTime: null,
        timeRemaining: 0,
      });
      return;   // The game has stopped.
    }

    if (this.props.gameGoing) {
      // The game was already going. Don't reset the timer.
      return;
    }

    // Otherwise, newProps.gameGoing is true. Restart the timer.
    this.setState({
      prevTime: null,
      timeRemaining: newProps.initialGameTime,
    });
  }

  componentDidUpdate() {
    if ((!this.state.prevTime) && this.state.timeRemaining > 0) {
      this.tick();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.state.timeoutId);
  }

  tick() {
    const currentTime = Date.now();
    const dt = this.state.prevTime ? (currentTime - this.state.prevTime) : 0;
    const interval = this.props.interval;

    // correct for small variations in actual timeout time
    const timeRemainingInInterval = (interval - (dt % interval));
    let timeout = timeRemainingInInterval;

    if (timeRemainingInInterval < (interval / 2.0)) {
      timeout += interval;
    }

    const newTimeRemaining = Math.max(this.state.timeRemaining - dt, 0);
    const countdownComplete = (this.state.prevTime && newTimeRemaining <= 0);
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
    this.setState({
      timeoutId: countdownComplete ? null : setTimeout(this.tick, timeout),
      prevTime: currentTime,
      timeRemaining: newTimeRemaining,
    });

    if (countdownComplete) {
      if (this.props.completeCallback) {
        this.props.completeCallback();
      }
    }
  }

  render() {
    let cn;
    if (this.state.timeRemaining <= this.props.warningCountdown) {
      cn = 'label label-warning';
    } else {
      cn = 'label label-info';
    }
    return (
      <span
        className={cn}
        style={{ fontSize: '1.3em', marginLeft: '2px' }}
      >
        {GameTimer.getFormattedTime(this.state.timeRemaining)}
      </span>
    );
  }
}

GameTimer.defaultProps = {
  warningCountdown: 10000,
  interval: 500,
  completeCallback: null,
  gameGoing: false,
};

GameTimer.propTypes = {
  gameGoing: React.PropTypes.bool,
  initialGameTime: React.PropTypes.number.isRequired,
  interval: React.PropTypes.number,
  completeCallback: React.PropTypes.func,
  warningCountdown: React.PropTypes.number,
};

export default GameTimer;
