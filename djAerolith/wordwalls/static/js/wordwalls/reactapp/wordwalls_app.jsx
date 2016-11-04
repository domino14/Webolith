/* global JSON, window */
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
  'reactapp/wordwalls_game',
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
        displayStyle: this.props.displayStyle,
        numberOfRounds: 0,
        listName: this.props.listName,
        autoSave: this.props.autoSave
      };
    },

    componentDidMount: function () {
      // Set up beforeUnloadEventHandler here.
      window.onbeforeunload = this.beforeUnload;
    },

    beforeUnload: function() {
      if (this.state.gameGoing) {
        $.ajax({
          url: this.props.tableUrl,
          async: false,
          data: {
            action: 'giveUpAndSave',
            // Fool the endpoint; if autosave is not on, don't actually
            // save with a listname.
            listname: this.state.autoSave ? this.state.listName : '',
          },
          method: 'POST',
        });
      }
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

    handleListNameChange: function(listName) {
      this.setState({
        listName: listName
      });
    },

    handleAutoSaveChange: function(autoSave) {
      this.setState({
        autoSave: autoSave
      });
      if (autoSave) {
        if (!this.state.gameGoing) {
          this.saveGame();
        }
        this.addServerMessage(`Autosave is now on! Aerolith will save your
          list progress to ${this.state.listName} at the end of every round.`);
      } else {
        this.addServerMessage(`Autosave is off.`, 'error');
      }
    },

    render: function() {
      return (
        <div>
          <div className="row">
            <div
              className="col-xs-6 col-sm-4 col-md-4 col-lg-4"
            >
              <ListSaveBar
                listName={this.state.listName}
                autoSave={this.state.autoSave}
                onListNameChange={this.handleListNameChange}
                onAutoSaveChange={this.handleAutoSaveChange}
              />
            </div>
            <div className="col-xs-1 col-sm-1 col-md-1 col-lg-1">
              <Preferences
                displayStyle={this.state.displayStyle}
                onSave={this.setDisplayStyle}
              />
            </div>
            <div className="col-xs-5 col-sm-3 col-md-2 col-lg-2">
              <StartButton
                handleStart={this.handleStart}
                handleGiveup={this.handleGiveup}
                gameGoing={this.state.gameGoing}
              />
              <GameTimer
                initialGameTime={this.state.initialGameTime}
                completeCallback={this.timerRanOut}
                gameGoing={this.state.gameGoing}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
              }}
            >
              <span className="text-danger"><i
                className="fa fa-times fa-2x"
                onClick={() => (window.location = '/wordwalls')}
              /></span>
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12 col-sm-9 col-md-9 col-lg-7">
              <GameBoard
                numberOfRounds={this.state.numberOfRounds}
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
            <div className="col-xs-4 col-sm-3 col-md-3 col-lg-2">
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
            <div className="col-xs-4 col-sm-5 col-md-4 col-lg-4">
              <GuessBox
                onGuessSubmit={this.onGuessSubmit}
                lastGuess={this.state.lastGuess}
                onHotKey={this.onHotKey}
                ref={gb => this.guessBox = gb}
              />
            </div>
            <div className="col-xs-8 col-sm-7 col-md-5 col-lg-5">
              <ShuffleButtons
                shuffle={this.handleShuffleAll}
                alphagram={this.handleAlphagram}
                customOrder={this.handleCustomOrder}
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
      .done(data => {
        if (_.has(data, 'g') && !data.g) {
          this.processGameEnded();
        }
      });
    },

    handleStart: function() {
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        data: {action: 'start'}
      })
      .done(this.handleStartReceived)
      .fail(jqXHR => {
        this.addServerMessage(jqXHR.responseJSON.error, 'error');
        // XXX: This is a hack; use proper error codes.
        if (jqXHR.responseJSON.error.indexOf('currently running') !== -1) {
          this.setState({
            gameGoing: true
          });
        }
      });
    },

    handleStartReceived: function(data) {
      if (this.state.gameGoing) {
        return;
      }
      if (_.has(data, 'serverMsg')) {
        this.addServerMessage(data.serverMsg);
      }
      if (_.has(data, 'questions')) {
        game.init(data.questions);
        this.setState({
          numberOfRounds: this.state.numberOfRounds + 1,
          origQuestions: game.getOriginalQuestionState(),
          curQuestions: game.getQuestionState(),
          totalWords: game.getTotalNumWords()
        });
        this.guessBox.setFocus();
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
      .done(data => {
        if (_.has(data, 'g') && !data.g) {
          this.processGameEnded();
        }
      });
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
      if (!this.state.gameGoing) {
        // Don't bother submitting guess if the game is over.
        return;
      }
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
      .done(data => {
        if (data.success === true) {
          game.miss(alphagram);
          this.setState({
            'origQuestions': game.getOriginalQuestionState()
          });
        }
      });
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
      if (this.state.autoSave) {
        this.saveGame();
      }
    },

    /**
     * Save the game on the server.
     */
    saveGame: function() {
      if (this.state.listName === '') {
        this.addServerMessage('You must enter a list name for saving!',
          'error');
        return;
      }
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        data: {action: 'save', listname: this.state.listName},
        dataType: 'json'
      }).
      done(data => {
        if (data.success === true) {
          this.addServerMessage(`Saved as ${data.listname}`);
        }
        if (data.info) {
          this.addServerMessage(data.info);
        }
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