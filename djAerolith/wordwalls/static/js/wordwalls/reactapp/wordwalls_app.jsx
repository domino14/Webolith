/* global JSON */
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

  'jsx!reactapp/gameboard',
  'jsx!reactapp/player_ranks',
  'jsx!reactapp/user_box',

  'immutable',
  'reactapp/wordwalls_game'
], function(React, $, _, GameTimer, ShuffleButtons, StartButton, ListSaveBar,
    Preferences, ChatBox,
    GuessBox, GameBoard, PlayerRanks, UserBox,
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
        isChallenge: false,
        totalWords: 0,
        answeredByMe: [],
        lastGuess: '',
        displayStyle: this.props.displayStyle
      };
    },

    /**
     * Set the display style. (Yes, this is a useless comment)
     * @param {Object} style
     */
    setDisplayStyle: function(style) {
      this.setState({
        displayStyle: style
      });
      // Also persist to the backend.
      $.ajax({
        url: '/wordwalls/api/configure/',
        method: 'POST',
        dataType: 'json',
        data: this.serializeStyle(style)
      });
    },

    /**
     * Turn style into a JSON representation that the backend will
     * understand.
     * @param  {Object} style
     * @return {Object}
     */
    serializeStyle: function(style) {
      return JSON.stringify(style);
    },

    render: function() {
      return (
        <div>
          <div className="row">
            <div className="col-sm-6">
            <ListSaveBar
              initialListName={this.props.listName}
              initialAutoSave={this.props.autoSave}
            />
            </div>
            <div className="col-sm-1 col-sm-offset-1">
              <Preferences
                displayStyle={this.state.displayStyle}
                onSave={this.setDisplayStyle}
              />
            </div>
            <div className="col-sm-2 col-sm-offset-2">
              <StartButton
                handleStart={this.handleStart}
                handleGiveup={this.handleGiveup}
                gameGoing={this.state.gameGoing} />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-5">
              <ShuffleButtons
                shuffle={this.handleShuffleAll}
                alphagram={this.handleAlphagram}
                customOrder={this.handleCustomOrder}
              />
            </div>
            <div className="col-sm-2 col-sm-offset-5">
              <GameTimer
                initialGameTime={this.state.initialGameTime}
                completeCallback={this.timerRanOut}
                gameGoing={this.state.gameGoing} />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8 col-md-9">
              <GameBoard
                curQuestions={this.state.curQuestions}
                origQuestions={this.state.origQuestions}
                displayStyle={this.state.displayStyle}
                totalWords={this.state.totalWords}
                answeredByMe={this.state.answeredByMe}
                onShuffle={this.onShuffleQuestion}
                gameGoing={this.state.gameGoing}
                markMissed={this.markMissed}
                lexicon={this.props.lexicon}
                />
            </div>
            <div className="col-lg-2 col-md-3">
              <PlayerRanks/>
              <UserBox
                showLexiconSymbols={
                  !this.state.displayStyle.bc.hideLexiconSymbols}
                answeredByMe={this.state.answeredByMe}
                totalWords={this.state.totalWords}
                username={this.props.username}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-9">
              <GuessBox
                onGuessSubmit={this.onGuessSubmit}
                lastGuess={this.state.lastGuess}
                onHotKey={this.onHotKey}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm-8">
              <ChatBox messages={this.state.messages}/>
            </div>
          </div>
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
          'curQuestions': game.getQuestionState(),
          'totalWords': game.getTotalNumWords()
        });
      }
      if (_.has(data, 'error')) {
        this.addServerMessage(data['error'], 'error');
        // XXX: This is a temporary hack to make it possible to give up.
        this.setState({
          'gameGoing': true
        });
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

    /**
     * Called when the front-end timer runs out. Make a call to the
     * back-end to possibly end the game.
     */
    timerRanOut: function() {
      // Only send this if the game is going.
      if (!this.state.gameGoing) {
        return;
      }
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        data: {action: 'gameEnded'},
        dataType: 'json'
      })
      .done(function(data) {
        if (_.has(data, 'g') && !data.g) {
          this.processGameEnded();
        }
      }.bind(this));
    },

    /**
     * Maybe modify the guess to replace spanish digraph tiles with their
     * proper code. Only if lexicon is Spanish.
     * @param  {string} guess
     * @return {string}
     */
    maybeModifyGuess: function(guess) {
      if (this.props.lexicon !== 'FISE09') {
        return guess;
      }
      // Replace.
      guess = guess.replace(/CH/g, '1').replace(/LL/g, '2').replace(/RR/g, '3');
      return guess;
    },

    onGuessSubmit: function(guess) {
      var modifiedGuess;
      this.setState({'lastGuess': guess});
      modifiedGuess = this.maybeModifyGuess(guess);
      if (!game.answerExists(modifiedGuess)) {
        // If the guess wasn't valid, don't bother submitting it to
        // the server.
        return;
      }
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        // That's a lot of guess
        data: {action: 'guess', guess: modifiedGuess}
      })
      .done(this.handleGuessResponse)
      .fail(this.handleGuessFailure);
    },

    handleGuessResponse: function(data) {
      if (_.has(data, 'C')) {
        if (data.C !== '') {
          // data.C contains the alphagram.
          game.solve(data.w, data.C);
          this.setState({
            'curQuestions': game.getQuestionState(),
            'origQuestions': game.getOriginalQuestionState(),
            'answeredByMe': game.getAnsweredByMe()
          });
        }
      }
      if (_.has(data, 'g') && !data.g) {
        this.processGameEnded();
      }
    },

    // TODO: handle guess failure the old way.
    handleGuessFailure: function() {

    },

    markMissed: function(alphaIdx, alphagram) {
      // Mark the alphagram missed.
      $.ajax({
        url: this.props.tableUrl + 'missed/',
        method: 'POST',
        dataType: 'json',
        data: {'idx': alphaIdx}
      })
      .done(function(data) {
        if (data && data.success) {
          game.miss(alphagram);
          this.setState({
            'origQuestions': game.getOriginalQuestionState()
          });
        }
      }.bind(this));
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
    },

    onHotKey: function(key) {
      // Hot key map.
      var fnMap = {'1': this.handleShuffleAll,
       '2': this.handleAlphagram,
       '3': this.handleCustomOrder};
       fnMap[key]();
    },
    /**
     * Handle the shuffling of tiles for display.
     * @param  {number?} which The index (or undefined for all).
     */
    handleShuffleAll: function() {
      game.shuffleAll();
      this.setState({
        'curQuestions': game.getQuestionState()
      });
    },

    onShuffleQuestion: function(idx) {
      game.shuffle(idx);
      this.setState({
        'curQuestions': game.getQuestionState()
      });
    },

    handleAlphagram: function() {
      game.resetAllOrders();
      this.setState({
        'curQuestions': game.getQuestionState()
      });
    },

    handleCustomOrder: function() {
      if (!(this.state.displayStyle && this.state.displayStyle.tc)) {
        return;
      }
      game.setCustomLetterOrder(this.state.displayStyle.tc.customOrder);
      this.setState({
        'curQuestions': game.getQuestionState()
      });
    }
  });

  return WordwallsApp;
});