/*global define, JSON */
define([
  'jquery',
  'underscore',
  'backbone',
  'ChallengeView',
  'mustache',
  'text!templates/saved_list_option.html',
  'text!templates/named_list_option.html',
  'bootstrap'
], function($, _, Backbone, ChallengeView, Mustache, SavedListOption,
    NamedListOption) {
  "use strict";
  var TableCreateView;

  TableCreateView = Backbone.View.extend({
    /**
     * Initialize the table create page.
     */
    initialize: function(options) {
      this.commandUrl = options.createTableUrl;
      this.flashcardUrl = options.createQuizUrl;
      this.lengthCounts = JSON.parse(options.lengthCounts);
      this.dcTimeMap = JSON.parse(options.dcTimes);
      _.each(this.lengthCounts, function(lex, index) {
        this.lengthCounts[index] = JSON.parse(lex);
      }, this);

      this.defaultChallengeList = $('#id_challenge').html();

      this.requestSavedListInfo();
      this.challengeChanged();
      this.changeMaxProb();
      this.savedListOptionChangeHandler();
      this.savedListChangeHandler();
      this.savedListLexiconChanged();
      this.namedListLexiconChanged();
    },
    events: {
      'click #main-tab-nav li': 'tabClicked',
      'change #id_lexicon': 'lexiconChanged',
      'change #id_wordLength': 'wordLengthChanged',
      'change #id_probabilityMin': 'minProbabilityChanged',
      'change #id_probabilityMax': 'maxProbabilityChanged',
      'change #id_challengeDate': 'challengeChangeEventHandler',
      'change #id_challenge': 'challengeChangeEventHandler',
      'change #id_listOption': 'savedListOptionChangeHandler',
      'change #id_wordList': 'savedListChangeHandler',
      'click #challengeSubmit': 'challengeSubmitClicked',
      'click #searchParamsSubmit': 'searchParamsSubmitClicked',
      'click #savedListsSubmit': 'savedListsSubmitClicked',
      'click #namedListsSubmit': 'namedListsSubmitClicked',
      'click #searchParamsFlashcard': 'searchParamsFlashcardClicked',
      'click #savedListsFlashcardEntire': 'savedListsFlashcardEntireClicked',
      'click #savedListsFlashcardFM': 'savedListsFlashcardFMClicked',
      'click #namedListsFlashcard': 'namedListsFlashcardClicked'

    },
    tabClicked: function(e) {
      if (e.target.tagName === 'SPAN') {
        this.tabSelected($(e.target).parent());
      } else {
        this.tabSelected(e.target);
      }
    },
    /**
     * Triggered when the user selects a tab.
     * @param {Element} target [description]
     */
    tabSelected: function(target) {
      if ($(target).data('index') === 0) {
        $("#id_quizTime").prop('disabled', true);
        this.challengeChanged();
      } else {
        $("#id_quizTime").prop('disabled', false);
        $("#id_quizTime").val(4);
      }
    },
    /**
     * Event handler for change of lexicon.
     */
    lexiconChanged: function() {
      this.changeMaxProb();
      this.challengeLexiconChanged();
      this.savedListLexiconChanged();
      this.namedListLexiconChanged();
      if ($('#id_lexicon').val() === '1') {
        $('.csw-license-div-holder').show();
      } else {
        $('.csw-license-div-holder').hide();
      }
    },
    /**
     * Event handler for change of word length dropdown.
     */
    wordLengthChanged: function() {
      this.changeMaxProb();
    },
    /**
     * Event handler for change of minimum probability.
     */
    minProbabilityChanged: function() {
      if (parseInt($('#id_probabilityMin').val(), 10) < 1) {
        $('#id_probabilityMin').val(1);
      }
    },
    maxProbabilityChanged: function() {
      if (parseInt($('#id_probabilityMax').val(), 10) > this.maxProb) {
        $('#id_probabilityMax').val(this.maxProb);
      }
    },
    /**
     * Change the maximum displayed probability for probability searches,
     * depending on the selected lexicon.
     */
    changeMaxProb: function() {
      var lex, curLength;
      lex = $('#id_lexicon option:selected').text();
      curLength = $('#id_wordLength').val();
      this.maxProb = this.lengthCounts[lex][curLength];
      $('label[for="id_probabilityMax"]').text(
        "Max probability (at most " + this.maxProb + ")");
      if ($('#id_probabilityMax').val() > this.maxProb) {
        $('#id_probabilityMax').val(this.maxProb);
      }
    },


    challengeChangeEventHandler: function() {
      this.challengeChanged();
    },
    challengeChanged: function() {
      var date, cVal, cName, lexName, lblText;
      lexName = $('#id_lexicon option:selected').text();
      cName = $('#id_challenge option:selected').text();
      date = $('#id_challengeDate').val();
      cVal = $('#id_challenge option:selected').val();
      if (cVal === "") {
        // this is the ----- text
        $('#dcResultsLabel').text('Select a challenge to view leaderboard');
        $("#id_quizTime").val(0);
        return;
      }
      lblText = '(' + lexName + ') ' + cName + ' leaderboard';
      if (date) {
        lblText += ' (' + date + ')';
      }
      $('#dcResultsLabel').text(lblText);
      this.getDcResults();
      $("#id_quizTime").val(this.dcTimeMap[cVal]/60.0);

    },
    challengeLexiconChanged: function() {
      var lexName;
      lexName = $('#id_lexicon option:selected').text();
      if (lexName === 'CSW12' || lexName === 'CSW15') {
        $('#id_challenge option[value="18"]').remove();
        $('#id_challenge option[value="19"]').remove();
      } else if (lexName === 'OWL2') {
        $('#id_challenge').html(this.defaultChallengeList);
      }
      this.challengeChangeEventHandler();
    },

    savedListOptionChangeHandler: function() {
      var optionName;
      optionName = $('#id_listOption option:selected').text();
      $('#savedListsSubmit').text('Play!').prop('disabled', false).removeClass(
        'btn-danger').addClass('btn-success');
      $('#savedListsFlashcardEntire').prop('disabled', false);
      $('#savedListsFlashcardFM').prop('disabled', false);
      if (optionName === "Continue list") {
        $('#savedListWarning').text("");
      } else if (optionName === "Restart list") {
        $('#savedListWarning').text([
          "This will restart this list and wipe out all its information. ",
          "Make sure you want to do this!"
        ].join(''));
      } else if (optionName === "Quiz on first missed") {
        $('#savedListWarning').text("");
        this.dimIfListUnfinished("#savedListsSubmit");
      } else if (optionName === "Delete list") {
        $('#savedListsSubmit').text('Delete selected list').removeClass(
          'btn-info').addClass('btn-danger');
        $('#savedListWarning').text(
          "This will delete the selected list! Make sure you want to do this!");
        $('#savedListsFlashcardEntire').prop('disabled', true);
        $('#savedListsFlashcardFM').prop('disabled', true);
      }
      this.dimIfListUnfinished("#savedListsFlashcardFM");
    },


    savedListChangeHandler: function() {
      var optionName;
      optionName = $('#id_listOption option:selected').text();
      if (optionName === "Quiz on first missed") {
        this.dimIfListUnfinished("#savedListsSubmit");
      }
      this.dimIfListUnfinished("#savedListsFlashcardFM");
    },

    showError: function(error) {
      $("#msg-content").html("<P>" + error + "</P>");
      $("#msg-title").html("Error");
      $("#msg-modal").modal();
    },

    wwRedirect: function(data) {
      if (data.success) {
        if (data.url) {
          window.location.href = data.url;   // redirect
        }
      } else {
        this.showError(data.error);
      }
    },

    challengeSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'challengeSubmit',
        lexicon: $('#id_lexicon').val(),
        challenge: $('#id_challenge').val(),
        challengeDate: $('#id_challengeDate').val()
      }, this.wwRedirect, 'json');
    },

    searchParamsSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'searchParamsSubmit',
        lexicon: $('#id_lexicon').val(),
        quizTime: $("#id_quizTime").val(),
        wordLength: $("#id_wordLength").val(),
        probabilityMin: $("#id_probabilityMin").val(),
        probabilityMax: $("#id_probabilityMax").val()
      }, this.wwRedirect, 'json');
    },

    namedListsSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'namedListsSubmit',
        lexicon: $('#id_lexicon').val(),
        quizTime: $("#id_quizTime").val(),
        namedList: $("#id_namedList").val()
      }, this.wwRedirect, 'json');
    },

    savedListsSubmitClicked: function() {
      var optionName;
      optionName = $('#id_listOption option:selected').text();
      if (optionName !== "Delete list") {
        $.post(this.commandUrl, {
          action: 'savedListsSubmit',
          lexicon: $('#id_lexicon').val(),
          quizTime: $("#id_quizTime").val(),
          listOption: $("#id_listOption").val(),
          wordList: $("#id_wordList").val()
        }, this.wwRedirect, 'json');
      } else {
        $.post(this.commandUrl, {
          action: 'savedListDelete',
          lexicon: $('#id_lexicon').val(),
          listOption: $("#id_listOption").val(),  /*todo redundancy, dry */
          wordList: $("#id_wordList").val()
        }, this.savedListDelete, 'json');
      }
    },

    searchParamsFlashcardClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'searchParamsFlashcard',
        lexicon: $('#id_lexicon').val(),
        wordLength: $("#id_wordLength").val(),
        probabilityMin: $("#id_probabilityMin").val(),
        probabilityMax: $("#id_probabilityMax").val()
      }, this.wwRedirect, 'json');
    },


    namedListsFlashcardClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'namedListsFlashcard',
        lexicon: $('#id_lexicon').val(),
        namedList: $("#id_namedList").val()
      }, this.wwRedirect, 'json');
    },


    savedListsFlashcardEntireClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'savedListsFlashcardEntire',
        lexicon: $('#id_lexicon').val(),
        listOption: $('#id_listOption').val(),
        wordList: $("#id_wordList").val()
      }, this.wwRedirect, 'json');
    },

    savedListsFlashcardFMClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'savedListsFlashcardFM',
        lexicon: $('#id_lexicon').val(),
        listOption: $('#id_listOption').val(),
        wordList: $("#id_wordList").val()
      }, this.wwRedirect, 'json');
    },

    savedListDelete: function(data) {
      if (data.deleted) {
        $("#id_wordList option[value=" + data.wordList + "]").remove();
        this.requestSavedListInfo(); // populate new limit/text
      } else {
        this.showError(data.error);
      }
    },

    dimIfListUnfinished: function(selector) {
      if ($('#id_wordList option:selected').data('gonethruonce') !== true) {
        /* list has NOT been gone thru at least once. So going thru first
          missed should not work! */
        $(selector).prop('disabled', true);
      } else {
        $(selector).prop('disabled', false);
      }
    },

    getDcResults: function() {
      // gets daily challenge results from server
      $.post(this.commandUrl, {
        action: 'getDcResults',
        lexicon: $('#id_lexicon option:selected').text(),
        chName: $('#id_challenge option:selected').text(),
        date: $('#id_challengeDate').val()
      }, this.populateDcResults, 'json');
    },

    populateDcResults: function(data) {
      ChallengeView.processDcResults(data, "dcResultsDiv");
    },

    savedListLexiconChanged: function() {
      $.post(this.commandUrl, {
        action: 'getSavedListList',
        lexicon: $('#id_lexicon option:selected').text()
      }, this.processSavedListResults, 'json');
    },

    namedListLexiconChanged: function() {
      $.post(this.commandUrl, {
        action: 'getNamedListList',
        lexicon: $('#id_lexicon option:selected').text()
      }, this.processNamedListResults, 'json');
    },

    processSavedListResults: function(data) {
      var options, i;
      if (data === null) {
        $("#id_wordList").html("");
      } else {
        options = [];
        for (i = 0; i < data.length; i++) {
          options.push(Mustache.render(SavedListOption, {
            listId: data[i].pk,
            goneThruOnce: data[i].goneThruOnce,
            listName: data[i].name,
            lastSaved: data[i].lastSaved,
            numAlphas: data[i].numAlphas
          }));
        }
        $("#id_wordList").html(options.join(''));
      }
    },

    processNamedListResults: function(data) {
      var options, i;
      if (data === null) {
        $("#id_namedList").html("");
      } else {
        options = [];
        for (i = 0; i < data.length; i++) {
          options.push(Mustache.render(NamedListOption, {
            listId: data[i].pk,
            listName: data[i].name,
            numAlphas: data[i].numAlphas
          }));
        }
        $("#id_namedList").html(options.join(''));
      }
    },

    requestSavedListInfo: function() {
      $.post(this.commandUrl, {action: 'getSavedListNumAlphas'},
        function(data) {
          var addlText;
          addlText = "";
          if (data.l > 0) {
            addlText = [
              "Your current limit is ",
              data.l,
              ". You can increase this by becoming a supporter!"
            ].join('');
          }
          $("#numAlphasInfo").text([
              "You have ", data.na,
              " alphagrams over all your saved lists. ",
              addlText
            ].join(''));
        }, 'json');
    }
  });
  return TableCreateView;
});