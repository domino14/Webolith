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
    "click #savePrefs": "savePrefs",
    "keypress #guessText": "readSpecialKeypress"
  },
  initialize: function() {
    this.guessInput = this.$("#guessText");

    this.setupPopupEvent();

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
  setOptions: function(options) {
    tableUrl = options.tableUrl;
    username = options.username;
    addParams = $.parseJSON(options.params);
    if (addParams) {
      if (_.has(addParams, 'saveName')) {
        this.$("#saveListName").val(addParams.saveName);
        autoSave = true;
        updateMessages("Autosave is on! Aerolith will save your list " +
                       "progress at the end of every round.");
      } else if (_.has(addParams, 'style')) {
        styleObj = $.parseJSON(addParams.style);
        tileClass = styleObj.tc;
        backgroundClass = styleObj.bc;
      }
    }
  },

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
    $.post(tableUrl, {action: "start"}, processStartData, 'json');
  },

  giveUp: function() {
    $.post(tableUrl, {action: "giveUp"}, processGiveUp, 'json');
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

  savePrefs: function() {
    var jsonPrefs = JSON.stringify({tc: tileClass, bc: backgroundClass});
    $.post(tableUrl, {action: "savePrefs", prefs: jsonPrefs},
      function(data) {
        if (data['success']) {
          $("#prefsInfo").text("Your preferences have been saved.");
        } else {
          $("#prefsInfo").text("Unable to save preferences.");
        }
      },
      'json');
  },

  render: function() {}
});