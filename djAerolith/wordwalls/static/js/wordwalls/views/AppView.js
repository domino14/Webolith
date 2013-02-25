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
      this.gameEnded, this));
    this.listenTo(this.wordwallsGame, 'gotQuestionData', _.bind(
      this.gotQuestionData, this));
    this.messageTextBoxLimit = 3000;  // characters
    this.viewConfig = null;
    this.$questionsList = this.$("#questions > .questionList");
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

  readSpecialKeypress: function(e) {
    var guessText;
    guessText = this.guessInput.val();
    if (e.keyCode === 13 || e.keyCode === 32) {  // Return/Enter or Spacebar
      if (guessText.length < 1 || guessText.length > 18) {
        return;   // ignore
      }
      this.guessInput.val("");
      /* should post */
      this.submitGuess(guessText);
    } else if (e.keyCode === 49) {
      // 1 -- shuffle
      shuffle();
      e.preventDefault();
    } else if (e.keyCode === 50) {
      // 2 -- alphagram
      alphagram();
      e.preventDefault();
    }
  },

  requestStart: function() {
    this.guessInput.focus();
    $.post('', {action: "start"}, _.bind(this.processStartData, this), 'json');
  },

  giveUp: function() {
    $.post(tableUrl, {action: "giveUp"}, this.processGiveUp, 'json');
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
      updateMessages("You must enter a list name for saving!");
    } else {
      $.post(
        tableUrl, {action: "save", listname: text},
        function(data) {
          if (_.has(data, 'success') && data.success) {
            updateMessages("Saved as " + text);
            if (autoSave === false) {
              updateMessages("Autosave is now on! Aerolith will save your " +
                             "list progress at the end of every round.");
              autoSave = true;
            }
          } else if (_.has(data, 'info')) {
            updateMessages(data.info);
          }
        }, 'json');
    }
  },

  exit: function() {
    window.location = "/wordwalls";
  },

  shuffle: function() {
    this.guessInput.focus();
    // cellIndex varies from 0 to 49 inclusive (maybe more in the future)
    for (var i = 0; i < 50; i++) {
      shuffleSingleCell(i);
    }
  },

  alphagram: function() {
    this.guessInput.focus();
    for (var i = 0; i < 50; i++) {
      if (i < qObj.length) {
        // Restore original html saved in 'ahtml'.
        $('#q' + i + ' > span.tiles').html(qObj[i]['ahtml']);
      }
    }
    $(".tile").removeClass().addClass(tileClassToText(tileClass));
  },

  processStartData: function (data) {
    /* Probably should track gameGoing with a signal from wordwallsGame? */
    if (!this.wordwallsGame.get('gameGoing')) {
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

  processGiveUp: function() {

  },
  render: function() {},
  gameEnded: function() {},
  updateTimeDisplay: function(currentTimer) {
    var mins, secs, pad;
    mins = Math.floor(currentTimer / 60);
    secs = currentTimer % 60;
    pad = ""
    if (secs < 10) {
      pad = "0";
    }
    this.$("#gameTimer").text(mins + ":" + pad + secs);
  },
  updateMessages: function(message) {
    this.updateTextBox(message, 'messages');
  },
  updateTextBox: function(message, textBoxId) {
    var $box, newMessage;
    $box = $('#' + textBoxId);
    var newMessage = $box.html() + message + '<BR>';
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
    this.$questionsList.html("");
    questionCollection.each(function(question) {
      var questionView;
      questionView = new WW.Alphagram.View({
        model: question,
        viewConfig: this.viewConfig
      });
      this.viewConfig.on('change', questionView.changeConfig, questionView);
      this.$questionsList.append(questionView.render().el);
    }, this);
  },
  /**
   * When Configure.Model changes, this function gets triggered.
   * @param  {Object} configuration An instance of WW.Configure.Model
   */
  configChange: function(configuration) {
    this.viewConfig = configuration;
  }
});