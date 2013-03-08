"use strict";
WW.App.View = Backbone.View.extend({
  el: $("body"),
  events: {
    "click #start": "requestStart",
    "click #giveup": "giveUp",
    "click #solutions": "showSolutions",
    "click #save": "saveGame",
    "click #customize": "customize",
    "click #exit": "exit",
    "click #shuffle": "shuffle",
    "click #alphagram": "alphagram",
    "keypress #guessText": "readSpecialKeypress"
  },
  initialize: function() {
    this.guessInput = this.$("#guessText");

    this.setupPopupEvent();
    this.wordwallsGame = new WW.WordwallsGame();
    this.listenTo(this.wordwallsGame, 'tick', _.bind(
      this.updateTimeDisplay, this));
    this.listenTo(this.wordwallsGame, 'timerExpired', _.bind(
      this.processQuizEnded, this));
    this.listenTo(this.wordwallsGame, 'gotQuestionData', _.bind(
      this.gotQuestionData, this));
    this.listenTo(this.wordwallsGame, 'message', this.updateMessages);
    this.listenTo(this.wordwallsGame, 'updateQStats', _.bind(
      this.renderQStats, this));
    this.messageTextBoxLimit = 3000;  // characters
    this.viewConfig = null;
    this.$questionsList = this.$("#questions > .questionList");
    this.questionViewsByAlphagram = {};
    this.defsDiv = this.$("#defs_popup_content");
    //this.$("#avatarLabel").
    // handle text box 'enter' press. We have to do this after
    //  defining the text apparently

    // TODO: re-enable
    // window.onbeforeunload = unloadEventHandler;
    // disableSelection(this.$('#shuffle')[0]);
    // disableSelection(this.$('#alphagram')[0]);

  },
  setupPopupEvent: function() {
    // setup definition popup event
    //Close Popups and Fade Layer
    $('img.btn_close, #fade').live('click', function() {
      //When clicking on the close or fade layer...
      $('#fade , .popup_block').fadeOut();
      return false;
    });
  },
  // setOptions: function(options) {
  //   tableUrl = options.tableUrl;
  //   username = options.username;
  //   addParams = $.parseJSON(options.params);
  //   if (addParams) {
  //     if (_.has(addParams, 'saveName')) {
  //       this.$("#saveListName").val(addParams.saveName);
  //       autoSave = true;
  //       updateMessages("Autosave is on! Aerolith will save your list " +
  //                      "progress at the end of every round.");
  //     }
  //   }
  // },

  /**
   * Tries to get an event keycode in a browser-independent way.
   * @param  {Object} e The keypress event.
   * @return {[type]}   [description]
   */
  getKeyCode: function(e) {
    var charCode = e.which || e.keyCode;
    return charCode;
  },
  readSpecialKeypress: function(e) {
    var guessText, keyCode;
    guessText = this.guessInput.val();
    keyCode = this.getKeyCode(e);
    if (keyCode === 13 || keyCode === 32) {  // Return/Enter or Spacebar
      if (guessText.length < 1 || guessText.length > 18) {
        return;   // ignore
      }
      this.guessInput.val("");
      this.submitGuess(guessText);
    } else if (keyCode === 49) {
      // 1 -- shuffle
      this.shuffle();
      e.preventDefault();
    } else if (keyCode === 50) {
      // 2 -- alphagram
      this.alphagram();
      e.preventDefault();
    }
  },

  requestStart: function() {
    this.guessInput.focus();
    $.post('', {action: "start"}, _.bind(this.processStartData, this), 'json');
  },

  giveUp: function() {
    $.post('', {action: "giveUp"}, _.bind(this.processGiveUp, this),
      'json');
  },

  showSolutions: function() {
    $('#definitions_popup').fadeIn();

    //Define margin for center alignment (vertical + horizontal) - we add 80 to the height/width to accomodate for the padding + border width defined in the css
    var popMargTop = ($('#definitions_popup').height() + 80) / 2;
    var popMargLeft = ($('#definitions_popup').width() + 80) / 2;

    //Apply Margin to Popup
    $('#definitions_popup').css({
      'margin-top' : -popMargTop,
      'margin-left' : -popMargLeft
    });

    //Fade in Background
    $('#fade').fadeIn(); //Fade in the fade layer
  },

  customize: function() {
    $('#customize_popup').fadeIn();
    var popMargTop = ($('#customize_popup').height() + 80) / 2;
    var popMargLeft = ($('#customize_popup').width() + 80) / 2;

    //Apply Margin to Popup
    $('#customize_popup').css({
      'margin-top' : -popMargTop,
      'margin-left' : -popMargLeft
    });
  },

  saveGame: function() {
    var text = this.$("#saveListName").val();
    if (!text) {
      this.updateMessages("You must enter a list name for saving!");
    } else {
      $.post('', {action: "save", listname: text},
        _.bind(this.processSaveResponse, this), 'json');
    }
  },
  processSaveResponse: function(data) {
    if (_.has(data, 'success') && data.success) {
      this.updateMessages("Saved as " + text);
      if (this.autoSave === false) {
        this.updateMessages([
          "Autosave is now on! Aerolith will save your ",
          "list progress at the end of every round."].join(''));
        this.autoSave = true;
      }
    } else if (_.has(data, 'info')) {
      this.updateMessages(data.info);
    }
  },
  exit: function() {
    window.location = "/wordwalls";
  },

  shuffle: function() {
    this.guessInput.focus();
    _.each(this.questionViewsByAlphagram, function(view, key) {
      view.shuffle();
    });
  },

  alphagram: function() {
    this.guessInput.focus();
    _.each(this.questionViewsByAlphagram, function(view, key) {
      view.alphagram();
    });
  },

  processStartData: function (data) {
    /* Probably should track gameGoing with a signal from wordwallsGame? */
    if (!this.wordwallsGame.get('gameGoing')) {
      this.wordwallsGame.set('gameGoing', true);
      if (_.has(data, 'serverMsg')) {
        this.updateMessages(data['serverMsg']);
        this.wordwallsGame.set(
          'quizzingOnMissed', data.serverMsg.indexOf('missed') !== -1);
      }
      if (_.has(data, 'error')) {
        this.updateMessages(data['error']);
        this.wordwallsGame.set(
          'quizOverForever', data.error.indexOf('nice day') !== -1);
      }
      if (_.has(data, 'questions')) {
        this.wordwallsGame.processQuestionObj(data['questions']);
      }
      if (_.has(data, 'time')) {
        // +1 since we're about to call this function
        this.wordwallsGame.startTimer(data['time']);
      }
      if (_.has(data, 'gameType')) {
        this.wordwallsGame.set('challenge', data.gameType === 'challenge');
      }
    }
  },

  processGiveUp: function(data) {
    if (_.has(data, 'g') && !data.g) {
      this.processQuizEnded();
    }
  },
  render: function() {},
  updateTimeDisplay: function(currentTimer) {
    var mins, secs, pad, text, originalTimer;
    originalTimer = currentTimer;
    currentTimer = Math.round(currentTimer);
    mins = Math.floor(currentTimer / 60);
    secs = currentTimer % 60;
    pad = "";
    if (secs < 10) {
      pad = "0";
    }
    text = mins + ":" + pad + secs;
    this.$("#gameTimer").text(text);
  },
  updateMessages: function(message) {
    this.updateTextBox(message, 'messages');
  },
  updateCorrectAnswer: function(answer) {
    this.updateTextBox(answer, 'correctAnswers');
  },
  updateGuesses: function(guess) {
    this.updateTextBox(guess, 'guesses');
  },
  updateTextBox: function(message, textBoxId) {
    var $box, newMessage;
    $box = $('#' + textBoxId);
    newMessage = $box.html() + message + '<BR>';
    if (newMessage.length > this.messageTextBoxLimit) {
      newMessage = newMessage.substr(
        newMessage.length - this.messageTextBoxLimit);
    }
    $box.html(newMessage);
    $box.scrollTop($box[0].scrollHeight - $box.height());
  },
  /**
   * This function gets triggered when the wordwalls game model gets a
   * collection of questions from the server.
   * @param  {Object} questionCollection An instance of
   *                                     WW.Alphagram.Collection.
   */
  gotQuestionData: function(questionCollection) {
    /*
     * Create a view for each alphagram, and render it. First empty out the
     * display list.
     */
    var $defsTable, totalAnswers;
    this.$questionsList.html("");
    this.questionViewsByAlphagram = {};
    this.defsDiv.html(ich.solutionsTable({}));
    totalAnswers = 0;
    $defsTable = this.defsDiv.children("#solutionsTable");
    questionCollection.each(function(question) {
      var questionView;
      questionView = new WW.Alphagram.View({
        model: question,
        viewConfig: this.viewConfig
      });
      this.viewConfig.on('change', questionView.changeConfig, questionView);
      this.$questionsList.append(questionView.render().el);
      this.questionViewsByAlphagram[question.get('alphagram')] = questionView;
      /* Populate the solutions table now and hide it. */
      question.get('words').each(function(word, index) {
        var wordSolutionView;
        wordSolutionView = new WW.Word.WordSolutionView({
          model: word});
        $defsTable.append(wordSolutionView.render().el);
        totalAnswers++;
      }, this);
    }, this);
    $defsTable.hide();
    this.renderQStats(totalAnswers, 0);
  },
  /**
   * Renders question stats - num total answered correctly, percentages, etc.
   */
  renderQStats: function(total, gotten) {
    var fractionText, percentText;
    fractionText = gotten + '/' + total;
    percentText = (gotten / total * 100).toFixed(1) + '%';
    this.$("#pointsLabelFraction").text(fractionText);
    this.$("#pointsLabelPercent").text(percentText);
    this.$("#solstats").text(fractionText + ' (' + percentText + ')');
  },
  /**
   * When Configure.Model changes, this function gets triggered.
   * @param  {Object} configuration An instance of WW.Configure.Model
   */
  configChange: function(configuration) {
    this.viewConfig = configuration;
    /* Render table / canvas backgrounds as appropriate. */
    if (configuration.get('showCanvas')) {
      $("body").removeClass().addClass("canvasBg");
    } else {
      $("body").removeClass();
    }
    if (configuration.get('showTable')) {
      $("#questions").removeClass().addClass("tableBg");
    } else {
      $("#questions").removeClass();
    }
  },
  /**
   * Submits a guess to the back-end server.
   * @param  {string} guessText A guess.
   */
  submitGuess: function(guessText) {
    var ucGuess;
    ucGuess = $.trim(guessText.toUpperCase());
    $.post('', {
      action: "guess", guess: guessText
    }, _.bind(this.processGuessResponse, this, ucGuess),
    'json');
  },
  /**
   * Processes a back-end response to a guess.
   * @param {string} ucGuess The upper-cased guess.
   * @param {Object} data The data object returned by the back-end server
   *                      in response to a guess.
   */
  processGuessResponse: function(ucGuess, data) {
    var view, wordsRemaining;
    if (_.has(data, 'C')) {
      if (data.C !== '') {
        /* data.C contains the alphagram. */
        view = this.questionViewsByAlphagram[data.C];
        wordsRemaining = view.model.get('wordsRemaining') - 1;
        /* Trigger an update of the view here. */
        view.model.set({
          wordsRemaining: wordsRemaining
        });
        this.wordwallsGame.correctGuess(ucGuess);
        if (wordsRemaining === 0) {
          this.wordwallsGame.finishedAlphagram(data.C);
        }
        this.updateCorrectAnswer(ucGuess);
      }
      this.updateGuesses(ucGuess);
    }
    if (_.has(data, 'g') && !data.g) {
      this.processQuizEnded();
    }
  },

  processQuizEnded: function() {
    this.wordwallsGame.endGame();
    this.$questionsList.html("");
    this.$("#gameTimer").text("0:00");
    this.defsDiv.children("#solutionsTable").show();
  },
  unloadEventHandler: function() {
    if (this.wordwallsGame.get('gameGoing')) {
      $.ajax({
         url: '',
         async: false,
         data: {
          action: "giveUpAndSave",
          listname: $("#saveListName").val()
         },
         type: "POST"
      });
    }
  }


});