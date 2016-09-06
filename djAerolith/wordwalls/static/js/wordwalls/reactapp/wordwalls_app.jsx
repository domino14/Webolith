define([
  'react',
  'jquery',
  'underscore',

  'jsx!reactapp/topbar/game_timer',
  'jsx!reactapp/topbar/shufflebuttons',
  'jsx!reactapp/topbar/start_button',
  'jsx!reactapp/topbar/save_list',
  'jsx!reactapp/topbar/preferences',

  'jsx!reactapp/bottombar/chatbox',
  'jsx!reactapp/bottombar/guessbox',
  'jsx!reactapp/bottombar/guesses',

  'jsx!reactapp/gameboard',
  'jsx!reactapp/player_ranks',
  'jsx!reactapp/user_box',

  'immutable',
  'reactapp/wordwalls_game'
], function(React, $, _, GameTimer, ShuffleButtons, StartButton, ListSaveBar,
    Preferences, ChatBox,
    GuessBox, Guesses, GameBoard, PlayerRanks, UserBox,
    Immutable, WordwallsGame) {

  "use strict";
  var WordwallsApp, game;

  game = new WordwallsGame();

  WordwallsApp = React.createClass({
    getInitialState: function() {
      return {
        gameGoing: false,
        initialGameTime: 0,
        // Contains the original questions. This list should remain in
        // a fixed order, and the only mutable things should be the
        // "correct" state of words/alphagrams.
        origQuestions: Immutable.List(),
        // Similar to origQuestions, but this list is what is directly
        // being rendered in the game board. Questions should be removed
        // from it as they are solved, and they can be shuffled around.
        curQuestions: Immutable.List(),
        messages: [],
        isChallenge: false
      };
    },

    /**
     *
     *
     *  <TopBar
            handleStart={this.handleStart}
            handleGiveup={this.handleGiveup}
            initialGameTime={this.state.initialGameTime}
            gameGoing={this.state.gameGoing}/>

          <BottomBar
            messages={this.state.messages}
            onGuessSubmit={this.onGuessSubmit}/>

     */

    render: function() {
      var canvasClass;
      if (this.props.displayStyle.bc && this.props.displayStyle.bc.showCanvas) {
        canvasClass = 'canvasBg';
      }
      return (
        <div className={canvasClass || ''}>
          <div className="row">
            <div className="col-md-4">
            <ListSaveBar
              initialListName={this.props.listName}
              initialAutoSave={this.props.autoSave}
            />
            </div>
            <div className="col-md-1">
              <Preferences />
            </div>
            <div className="col-md-2 col-md-offset-3">
              <StartButton
                handleStart={this.handleStart}
                handleGiveup={this.handleGiveup}
                gameGoing={this.state.gameGoing} />
            </div>
          </div>
          <div className="row">
            <ShuffleButtons />
            <GameTimer
              initialGameTime={this.state.initialGameTime}
              gameGoing={this.state.gameGoing} />
          </div>


          <div id="encloser" className="row">
            <GameBoard
              curQuestions={this.state.curQuestions}
              // Maybe this should be state.
              displayStyle={this.props.displayStyle}/>
            <PlayerRanks/>
            <UserBox/>
          </div>

          <GuessBox onGuessSubmit={this.onGuessSubmit}/>
          <ChatBox messages={this.state.messages}/>
          <Guesses/>

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
      if (this.state.gameGoing) {
        return;
      }
      if (_.has(data, 'serverMsg')) {
        this.addServerMessage(data['serverMsg']);
      }
      if (_.has(data, 'questions')) {
        game.init(data.questions);
        this.setState({
          'origQuestions': game.getOriginalQuestionState(),
          'curQuestions': game.getQuestionState()
        });
      }
      if (_.has(data, 'error')) {
        this.addServerMessage(data['error'], 'error');
      }
      if (_.has(data, 'time')) {
        // Convert time to milliseconds.
        this.setState({
          'initialGameTime': data.time * 1000,
          'gameGoing': true
        });
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
          this.setState({
            'curQuestions': game.getQuestionState(),
            'origQuestions': game.getOriginalQuestionState()
          });
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
        gameGoing: false
      });
    }
  });

  return WordwallsApp;
});