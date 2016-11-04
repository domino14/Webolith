/**
 * Heavily based on
 * https://github.com/uken/react-countdown-timer
 * MIT licensed.
 */
define([
  'react'
], function(React) {
  // A millisecond timer.
  "use strict";
  return React.createClass({
    getDefaultProps: function() {
      return {
        warningCountdown: 10000,
        interval: 500,
        completeCallback: null,
        gameGoing: false
      };
    },
    propTypes: {
      gameGoing: React.PropTypes.bool,
      initialGameTime: React.PropTypes.number.isRequired,
      interval: React.PropTypes.number,
      completeCallback: React.PropTypes.func
    },

    getInitialState: function() {
      return {
        timeRemaining: this.props.initialGameTime,
        timeoutId: null,
        prevTime: null
      };
    },
    componentDidMount: function() {
      this.tick();
    },
    /**
     * Called when component is about to receive new props (typically
     * when timer is reset).
     * @param  {Object} newProps
     */
    componentWillReceiveProps: function(newProps) {

      if (!newProps.gameGoing) {
        this.setState({
          prevTime: null,
          timeRemaining: 0
        });
        return;   // The game has stopped.
      } else {
        if (this.props.gameGoing) {
          // The game was already going. Don't reset the timer.
          return;
        }
      }
      // Otherwise, newProps.gameGoing is true. Restart the timer.
      this.setState({
        prevTime: null,
        timeRemaining: newProps.initialGameTime
      });
    },
    componentDidUpdate: function() {
      if ((!this.state.prevTime) && this.state.timeRemaining > 0) {
        this.tick();
      }
    },
    tick: function() {
      var currentTime = Date.now();
      var dt = this.state.prevTime ? (currentTime - this.state.prevTime) : 0;
      var interval = this.props.interval;

      // correct for small variations in actual timeout time
      var timeRemainingInInterval = (interval - (dt % interval));
      var timeout = timeRemainingInInterval;

      if (timeRemainingInInterval < (interval / 2.0)) {
        timeout += interval;
      }

      var timeRemaining = Math.max(this.state.timeRemaining - dt, 0);
      var countdownComplete = (this.state.prevTime && timeRemaining <= 0);
      if (this.state.timeoutId) {
        clearTimeout(this.state.timeoutId);
      }
      this.setState({
        timeoutId: countdownComplete ? null : setTimeout(this.tick, timeout),
        prevTime: currentTime,
        timeRemaining: timeRemaining
      });

      if (countdownComplete) {
        if (this.props.completeCallback) {
          this.props.completeCallback();
        }
        return;
      }
    },
    componentWillUnmount: function() {
      clearTimeout(this.state.timeoutId);
    },
    getFormattedTime: function(milliseconds) {
      var totalSeconds, seconds, minutes;
      totalSeconds = Math.round(milliseconds / 1000);
      seconds = parseInt(totalSeconds % 60, 10);
      minutes = parseInt(totalSeconds / 60, 10) % 60;

      seconds = seconds < 10 ? '0' + seconds : seconds;
      minutes = minutes < 10 ? '0' + minutes : minutes;

      return minutes + ':' + seconds;
    },
    render: function() {
      var cn;
      if (this.state.timeRemaining <= this.props.warningCountdown) {
        cn = "label label-warning";
      } else {
        cn = "label label-info";
      }
      return (
        <h3
          style={{
            display: 'inline-block',
            marginLeft: '5px',
            marginTop: '0px' }}
        >
          <span className={cn}>
            {this.getFormattedTime(this.state.timeRemaining)}
          </span>
        </h3>
      );
    }
  });
});