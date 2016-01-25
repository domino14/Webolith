/* global define, django*/
define([
  'backbone',
  'jquery',
  'underscore',
  'models/WordwallsGame',
  'views/AlphagramView',
  'views/WordSolutionView',
  'text!templates/solutionsTable.html',
  'mustache',
  'ChallengeView',
  'wordwalls_tests',
  'utils'
], function(Backbone, $, _, Game, AlphagramView, WordSolutionView,
     SolutionsTable, Mustache, ChallengeView, Tester, utils) {
  "use strict";
  var App;

  App = Backbone.View.extend({
    el: $("body"),
    events: {
      "click #start": "requestStart",
      "click #giveup": "giveUp",
      "click #solutions": "showSolutions",
      "click #save": "saveGame",
      "click #testWordwalls": "enableTester_",
      "click #customize": "customize",
      "click #exit": "exit",
      "click #shuffle": "shuffle",
      "click #alphagram": "alphagram",
      'click #customOrder': 'customOrder',
      "click .dcInfo": "showAddlInfo",
      "keypress #guessText": "readSpecialKeypress"
    },
    /**
     * Enable the wordwalls tester. Please don't use this if you somehow
     * see it.
     */
    enableTester_: function() {
      Tester.setEnabled();
    },
    initialize: function(options) {
      this.guessInput = this.$("#guessText");
      this.lexicon = options.lexicon;
      this.setupPopupEvent();
      this.wordwallsGame = new Game();
      this.listenTo(this.wordwallsGame, 'tick', this.updateTimeDisplay);
      this.listenTo(this.wordwallsGame, 'timerExpired',
        this.processTimerExpired);
      this.listenTo(this.wordwallsGame, 'gotQuestionData',
        this.gotQuestionData);
      this.listenTo(this.wordwallsGame, 'updateQStats', this.renderQStats);
      this.listenTo(this.wordwallsGame, 'saveGame', this.saveGame);
      this.listenTo(this.wordwallsGame, 'challengeEnded',
        this.handleChallengeEnded);

      this.listenTo(this.wordwallsGame, 'autosaveDisabled', function() {
        this.updateMessages(django.gettext(
          "Autosave is NOT on. To save your progress, type in a name " +
          "for this list next to the Save button, and click Save."
        ));
      });
      this.viewConfig = null;
      this.numColumns = 4;
      this.maxScreenQuestions = 50;   // How many questions fit on the screen?
      this.$questionsList = this.$("#questions > .questionList");
      this.questionViewsByAlphagram = {};
      this.questionViews = [];
      this.defsDiv = this.$("#defs_popup_content");
      this.roundTotalAnswers = null;
      this.$('.utilityButton').disableSelection();
      this.setupTesterEvents();
    },
    /**
     * Setup the events for the wordwalls tester.
     */
    setupTesterEvents: function() {
      this.listenTo(Tester, 'testerGuess', _.bind(this.submitGuess, this));
      this.listenTo(Tester, 'msg', _.bind(function(msg) {
        this.updateMessages(msg);
      }, this));
      this.listenTo(Tester, 'endGame', _.bind(this.processTimerExpired, this));
    },
    setTablenum: function(tablenum) {
      this.tablenum = tablenum;
      this.tableUrl = '/wordwalls/table/' + tablenum + '/';
    },
    setupPopupEvent: function() {
      // setup definition popup event
      //Close Popups and Fade Layer
      $(document).on('click', 'img.btn_close, #fade', function() {
        //When clicking on the close or fade layer...
        $('#fade , .popup_block').fadeOut();
        return false;
      });
    },
    setSaveName: function(saveName) {
      this.$("#saveListName").val(saveName);
      this.updateMessages(django.gettext("Autosave is on! ") +
        django.gettext("Aerolith will save your list progress at the end " +
        "of every round.")
      );
      this.wordwallsGame.set('autoSave', true);
    },
    /**
     * Tries to get an event keycode in a browser-independent way.
     * @param  {Object} e The keypress event.
     * @return {number}   keyCode.
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
        if (Tester.getEnabled()) {
          Tester.submitCommand(guessText);
          return;
        }
        this.submitGuess(guessText);
      } else if (keyCode === 49) {
        // 1 -- shuffle
        this.shuffle();
        e.preventDefault();
      } else if (keyCode === 50) {
        // 2 -- alphagram
        this.alphagram();
        e.preventDefault();
      } else if (keyCode === 51) {
        // 3 -- custom order
        this.customOrder();
        e.preventDefault();
      }
    },

    requestStart: function() {
      this.guessInput.focus();
      $.post(this.tableUrl, {action: "start"},
        _.bind(this.processStartData, this), 'json');
    },

    giveUp: function() {
      $.post(this.tableUrl, {action: "giveUp"},
        _.bind(this.processGiveUp, this), 'json');
    },
    fadeInDialog: function(id, fadeLayer) {
      var $dialog, popMargTop, popMargLeft;
      $dialog = $('#' + id);
      $dialog.fadeIn();
      popMargTop = ($dialog.height() + 80) / 2;
      popMargLeft = ($dialog.width() + 80) / 2;
      $dialog.css({
        'margin-top': -popMargTop,
        'margin-left': -popMargLeft
      });
      if (fadeLayer) {
        $('#fade').fadeIn();
      }
    },
    customize: function() {
      this.fadeInDialog('customize_popup', false);
    },
    showAddlInfo: function() {
      this.fadeInDialog('addlInfo_popup', true);
    },
    showSolutions: function() {
      this.fadeInDialog('definitions_popup', true);
    },
    handleChallengeEnded: function() {
      this.updateMessages(django.gettext("The challenge has ended!"));
      $.post(this.tableUrl, {action: 'getDcData'},
        function(data) {
          ChallengeView.processDcResults(data, "addlInfo_content");
        },
        'json');
      this.updateMessages(django.gettext(
        'Click <a class="softLink dcInfo">here</a> to see current results ' +
        'for this challenge.'
      ));
    },
    saveGame: function() {
      var text = this.$("#saveListName").val();
      if (!text) {
        this.updateMessages(django.gettext(
          "You must enter a list name for saving!"));
      } else {
        $.post(this.tableUrl, {action: "save", listname: text},
          _.bind(this.processSaveResponse, this), 'json');
      }
    },
    processSaveResponse: function(data) {
      if (_.has(data, 'success') && data.success) {
        this.updateMessages("Saved as " + data.listname);
        if (this.wordwallsGame.get('autoSave') === false) {
          this.updateMessages(django.gettext(
            "Autosave is now on! ") + django.gettext(
              "Aerolith will save your list progress " +
              "at the end of every round.")
          );
          this.wordwallsGame.set('autoSave', true);
        }
      }
      if (_.has(data, 'info')) {
        this.updateMessages(data.info);
      }
    },
    exit: function() {
      window.location = "/wordwalls";
    },

    shuffle: function() {
      this.guessInput.focus();
      _.each(this.questionViewsByAlphagram, function(view) {
        view.shuffle();
      });
    },

    alphagram: function() {
      this.guessInput.focus();
      _.each(this.questionViewsByAlphagram, function(view) {
        view.alphagram();
      });
    },

    customOrder: function() {
      this.guessInput.focus();
      _.each(this.questionViewsByAlphagram, function(view) {
        view.customOrder();
      });
    },

    processStartData: function (data) {
      /* Probably should track gameGoing with a signal from wordwallsGame? */
      if (!this.wordwallsGame.get('gameGoing')) {
        if (_.has(data, 'serverMsg')) {
          this.updateMessages(data.serverMsg);
        }
        if (_.has(data, 'error')) {
          this.updateMessages(data.error);
        }
        if (_.has(data, 'questions')) {
          this.wordwallsGame.processQuestionObj(data.questions);
          Tester.setQuestionData(data.questions);
        }
        if (_.has(data, 'time')) {
          this.wordwallsGame.set('gameGoing', true);
          this.wordwallsGame.startTimer(data.time);
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
      if (currentTimer < 0) {
        // Don't show a negative time.
        return;
      }
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
      utils.updateTextBox(message, 'messages');
    },
    updateCorrectAnswer: function(answer) {
      utils.updateTextBox(answer, 'correctAnswers');
    },
    updateGuesses: function(guess) {
      utils.updateTextBox(guess, 'guesses');
    },
    /**
     * This function gets triggered when the wordwalls game model gets a
     * collection of questions from the server.
     * @param  {Object} questionCollection An instance of Alphagrams.
     *
     */
    gotQuestionData: function(questionCollection) {
      /*
       * Create a view for each alphagram, and render it. First empty out the
       * display list.
       */
      var $defsTable, track, colCount, length, i, orderArray;
      length = questionCollection.length;
      this.$questionsList.html("");
      this.questionViewsByAlphagram = {};
      this.questionViews = [];
      this.defsDiv.html(Mustache.render(SolutionsTable, {
        i18n_ui_prob: django.gettext('Prob'),
        i18n_ui_alphagram: django.gettext('Alphagram'),
        i18n_ui_word: django.gettext('Word'),
        i18n_ui_definition: django.gettext('Definition'),
        i18n_ui_actions: django.gettext('Actions')
      }));
      /* Fetch the actual table element and hide it. */
      $defsTable = this.defsDiv.children("#solutionsTable");
      $defsTable.hide();
      this.roundTotalAnswers = 0;
      /* Generate an array to help us show solution data vertically. */
      track = 0;
      colCount = 0;
      orderArray = [];
      for (i = 0; i < length; i++) {
        orderArray.push(track);
        track += this.numColumns;
        if (track >= questionCollection.length) {
          colCount++;
          track = colCount;
        }
      }
      questionCollection.each(_.bind(this.renderQuestionData, this));
      /* Render the solutions vertically. */
      for (i = 0; i < length; i++) {
        this.renderSolutionData($defsTable, questionCollection.at(
          orderArray[i]));
      }
      this.renderQStats(this.roundTotalAnswers, 0);
    },
    /**
     * Renders questions on table.
     * @param {Object} question An instance of Alphagram.
     */
    renderQuestionData: function(question) {
      var questionView = new AlphagramView({
        model: question,
        viewConfig: this.viewConfig
      });
      this.$questionsList.append(questionView.render().el);
      this.questionViewsByAlphagram[question.get('alphagram')] = questionView;
      this.questionViews.push(questionView);
    },
    /**
     * Renders solutions.
     * @param {Object} $defsTable A DOM element for the definitions table.
     * @param {Object} question An instance of Alphagram.
     */
    renderSolutionData: function($defsTable, question) {
      question.get('words').each(function(word) {
        var wordSolutionView;
        wordSolutionView = new WordSolutionView({
          model: word,
          lexicon: this.lexicon
        });
        $defsTable.append(wordSolutionView.render().el);
        this.roundTotalAnswers++;
        this.listenTo(wordSolutionView, 'markMissed', _.bind(this.markMissed,
          this));
      }, this);
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
     * @param  {Object} configuration An instance of Configure.
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
      ucGuess = this.modifyGuess($.trim(guessText.toUpperCase()));
      $.post(this.tableUrl, {
        action: "guess",
        guess: ucGuess
      }, _.bind(this.processGuessResponse, this, ucGuess),
      'json').fail(_.bind(function(jqXHR) {
        this.updateMessages(jqXHR.responseJSON);
      }, this));
    },

    /**
     * Modify guess, based on lexicon. If we are using the Spanish (FISE)
     * lexicon, we want to convert characters accordingly.
     */
    modifyGuess: function(guessText) {
      if (this.lexicon !== utils.SPANISH_LEXICON) {
        return guessText;
      }
      guessText = guessText.replace(/CH/g, '1').replace(/LL/g, 2).replace(
        /RR/g, 3);
      return guessText;
    },

    /**
     * Processes a back-end response to a guess.
     * @param {string} ucGuess The upper-cased guess.
     * @param {Object} data The data object returned by the back-end server
     *                      in response to a guess.
     */
    processGuessResponse: function(ucGuess, data) {
      var view, wordsRemaining, word, modifiedForDisplay;
      modifiedForDisplay = utils.modifyWordForDisplay(ucGuess, this.lexicon);
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
            this.moveUpNextQuestion(view);
          }
          word = view.model.get('words').find(function(word) {
            return word.get('word').toUpperCase() === ucGuess;
          });
          this.updateCorrectAnswer(modifiedForDisplay +
            word.get('lexiconSymbol'));
        }
        this.updateGuesses(modifiedForDisplay);
      }
      if (_.has(data, 'g') && !data.g) {
        this.processQuizEnded();
      }
    },
    /**
     * Mark an alphagram as missed, at the end of a round.
     * XXX: Don't use alert, create a better alert system.
     * @param {number} alphagramIndex
     * @param {Backbone.View} solutionView The view for this single alphagram.
     */
    markMissed: function(alphagramIndex, solutionView) {
      $.post('missed/', {
        'idx': alphagramIndex
      }, _.bind(function(data) {
        if (data.success === false) {
          window.alert(django.gettext(
            'Unable to mark this alphagram as missed.'));
        } else if (data.success === true) {
          solutionView.markMissed();
        }
      }, this), 'json').fail(_.bind(function(jqXHR) {
        window.alert(jqXHR.responseText);
      }, this));
    },
    /**
     * Moves up the next question to the viewport window. This should be
     * done in a non-distracting way, so it doesn't suffice to just remove
     * the passed-in view.
     * @param  {Object} questionView A Backbone View for the question that
     *                               was just solved.
     */
    moveUpNextQuestion: function(questionView) {
      var lastView;
      if (this.wordwallsGame.alphagramsLeft() <=
          this.maxScreenQuestions) {
        return;   // Do nothing; no need to move up any questions.
      }
      lastView = this.questionViews.pop();
      _.delay(function() {
        /*
         * Basically, swap the elements of the views, then remove the view
         * we don't care about.
         */
        var lastElement = lastView.el;
        lastView.setElement(questionView.el);
        questionView.setElement(lastElement);
        questionView.remove();
        lastView.render();
      }, 5000);
    },
    processTimerExpired: function() {
      /* Tell the server the timer expired. */
      $.post(this.tableUrl, {action: 'gameEnded'}, _.bind(function(data) {
        if (_.has(data, 'g') && !data.g) {
          this.processQuizEnded();
        }
      }, this),
      'json');
    },
    processQuizEnded: function() {
      this.wordwallsGame.endGame();
      this.$questionsList.html("");
      this.$("#gameTimer").text("0:00");
      this.defsDiv.children("#solutionsTable").show();
    },
    beforeUnloadEventHandler: function() {
      if (!this.wordwallsGame.get('gameGoing')) {
        return;  // Allow unload.
      }
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

  });
  return App;
});