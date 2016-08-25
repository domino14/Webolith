define([
  'react',
  'jquery',
  'underscore',

  'jsx!reactapp/topbar',
  'jsx!reactapp/gameboard',
  'jsx!reactapp/bottombar',

  'reactapp/wordwalls_game'
], function(React, $, _, TopBar, GameBoard, BottomBar, WordwallsGame) {
  "use strict";
  var WordwallsApp, game;

  game = new WordwallsGame();

  WordwallsApp = React.createClass({
    getInitialState: function() {
      return {
        gameGoing: false,
        initialTime: 0,
        questions: [],
        messages: [],
        isChallenge: false
      };
    },
    render: function() {
      var canvasClass;
      if (this.props.displayStyle.bc && this.props.displayStyle.bc.showCanvas) {
        canvasClass = 'canvasBg';
      }
      console.log('this', this.props.displayStyle);
      return (
        <div className={canvasClass || ''}>
          <TopBar
            handleStart={this.handleStart}
            handleGiveup={this.handleGiveup}
            initialTimeRemaining={this.state.initialTime}/>

          <div id="encloser">
            <GameBoard
              questions={this.state.questions}
              // Maybe this should be state.
              displayStyle={this.props.displayStyle}/>
          </div>
          <BottomBar
            messages={this.state.messages}
            onGuessSubmit={this.onGuessSubmit}/>
        </div>
      );
    },
    handleGiveup: function() {
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        data: {action: 'giveUp'}
      })
      .done(this.handleGiveupReceived);
    },
    handleGiveupReceived: function(data) {
      if (_.has(data, 'g') && !data.g) {
        this.processGameEnded();
      }
    },
    handleStart: function() {
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        data: {action: 'start'}
      })
      .done(this.handleStartReceived);
    },
    handleStartReceived: function(data) {
      var questionState;
      if (this.state.gameGoing) {
        return;
      }
      if (_.has(data, 'serverMsg')) {
        this.addServerMessage(data['serverMsg']);
      }
      if (_.has(data, 'questions')) {
        // `init` mutates the state to add helper structures on it.
        // (is that an anti-pattern?)
        // Should use an immutable.
        questionState = game.init(data.questions);
        this.setState({'questions': questionState});
      }
      if (_.has(data, 'error')) {
        this.addServerMessage(data['error'], 'error');
      }
      if (_.has(data, 'time')) {
        // Convert time to milliseconds.
        this.setState({'initialTime': data.time * 1000});
      }
      if (_.has(data, 'gameType')) {
        this.setState({'isChallenge': data.gameType === 'challenge'});
      }
    },

    onGuessSubmit: function(guess) {
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        // That's a lot of guess
        data: {action: 'guess', guess: guess}
      })
      .done(this.handleGuessResponse)
      .fail(this.handleGuessFailure);
    },

    handleGuessResponse: function(data) {
      console.log('Got guess data back', data);
      if (_.has(data, 'C')) {
        if (data.C !== '') {
          // data.C contains the alphagram.
          game.solve(data.w, data.C);
          this.setState(game.getQuestionState());
        }
      }
    },

    addServerMessage: function(serverMsg, optType) {
      var messages = this.state.messages;
      messages.push({
        'author': '',
        'id': _.uniqueId('msg_'),
        'content': serverMsg,
        'type': optType || 'server'
      });
      this.setState({'messages': messages});
    },

    processGameEnded: function() {
      this.setState({
        gameGoing: false,
        initialTime: 0
      });
    }
  });

  return WordwallsApp;
});