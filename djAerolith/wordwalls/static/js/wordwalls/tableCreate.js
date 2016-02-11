/*global define, JSON, django */
define([
  'jquery',
  'underscore',
  'backbone',
  'ChallengeView',
  'mustache',
  'text!templates/saved_list_option.html',
  'text!templates/named_list_option.html',
  'utils',
  'bootstrap'
], function($, _, Backbone, ChallengeView, Mustache, SavedListOption,
    NamedListOption, Utils) {
  "use strict";
  var TableCreateView, CONTINUE_LIST_CHOICE, FIRST_MISSED_CHOICE,
    RESTART_LIST_CHOICE, DELETE_LIST_CHOICE;
  CONTINUE_LIST_CHOICE = '1';
  FIRST_MISSED_CHOICE = '2';
  RESTART_LIST_CHOICE = '3';
  DELETE_LIST_CHOICE = '4';

  // XXX: Only translates into Spanish right now. This should move over to
  // a Django model translation library.
  // This is an ugly hack!!
  function translateChallenges(html) {
    html = html.replace(/Today's 2s/g, 'Los 2 de hoy').
      replace(/Today's 3s/g, 'Los 3 de hoy').
      replace(/Today's 4s/g, 'Los 4 de hoy').
      replace(/Today's 5s/g, 'Los 5 de hoy').
      replace(/Today's 6s/g, 'Los 6 de hoy').
      replace(/Today's 7s/g, 'Los 7 de hoy').
      replace(/Today's 8s/g, 'Los 8 de hoy').
      replace(/Today's 9s/g, 'Los 9 de hoy').
      replace(/Today's 10s/g, 'Los 10 de hoy').
      replace(/Today's 11s/g, 'Los 11 de hoy').
      replace(/Today's 12s/g, 'Los 12 de hoy').
      replace(/Today's 13s/g, 'Los 13 de hoy').
      replace(/Today's 14s/g, 'Los 14 de hoy').
      replace(/Today's 15s/g, 'Los 15 de hoy').
      replace(/Week's Bingo Toughies/g, 'Bingos difíciles de la semana').
      replace(/Blank Bingos/g, 'Bingos con fichas en blanco').
      replace(/Bingo Marathon/g, 'Un maratón de bingos');
    return html;
  }

  TableCreateView = Backbone.View.extend({
    /**
     * Initialize the table create page.
     */
    initialize: function(options) {
      this.ringSpinner = $('.ring-spinner');
      this.commandUrl = options.createTableUrl;
      this.flashcardUrl = options.createQuizUrl;
      this.currentLanguage = options.language;
      this.lengthCounts = JSON.parse(options.lengthCounts);
      this.dcTimeMap = JSON.parse(options.dcTimes);
      _.each(this.lengthCounts, function(lex, index) {
        this.lengthCounts[index] = JSON.parse(lex);
      }, this);

      if (this.currentLanguage === 'es') {
        $('#id_challenge').html(translateChallenges($('#id_challenge').html()));
      }
      this.defaultChallengeList = $('#id_challenge').html();

      this.requestSavedListInfo();
      this.savedListOptionChangeHandler();
      this.savedListChangeHandler();
      this.lexiconChanged();
    },
    events: {
      'click #main-tab-nav li': 'tabClicked',
      'change #id_lexicon': 'lexiconChanged',
      'change #id_wordLength': 'wordLengthChanged',
      'change #id_probabilityMin': 'minProbabilityChanged',
      'change #id_probabilityMax': 'maxProbabilityChanged',
      'change #id_challengeDate': 'challengeChanged',
      'change #id_challenge': 'challengeChanged',
      'change #id_listOption': 'savedListOptionChangeHandler',
      'change #id_wordList': 'savedListChangeHandler',
      'click #challengeSubmit': 'challengeSubmitClicked',
      'click #searchParamsSubmit': 'searchParamsSubmitClicked',
      'click #savedListsSubmit': 'savedListsSubmitClicked',
      'click #namedListsSubmit': 'namedListsSubmitClicked',
      'click #searchParamsFlashcard': 'searchParamsFlashcardClicked',
      'click #savedListsFlashcardEntire': 'savedListsFlashcardEntireClicked',
      'click #savedListsFlashcardFM': 'savedListsFlashcardFMClicked',
      'click #namedListsFlashcard': 'namedListsFlashcardClicked',
      'click .formSubmitButton': 'submittedForm'
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
      this.currentTab = $(target).data('index');
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
        django.gettext("Max probability (at most ") + this.maxProb + ")");
      if ($('#id_probabilityMax').val() > this.maxProb) {
        $('#id_probabilityMax').val(this.maxProb);
      }
    },

    challengeChanged: function() {
      var date, cVal, cName, lexName, lblText;
      lexName = $('#id_lexicon option:selected').text();
      cName = $('#id_challenge option:selected').text();
      date = $('#id_challengeDate').val();
      cVal = $('#id_challenge option:selected').val();
      if (cVal === "") {
        // this is the ----- text
        $('#dcResultsLabel').text(
          django.gettext('Select a challenge to view leaderboard'));
        $("#id_quizTime").val(0);
        return;
      }
      lblText = '(' + lexName + ') ' + cName + ' - ' +
        django.gettext(' leaderboard');
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
      $('#id_challenge').html(this.defaultChallengeList);
      if (this.currentTab === 0) {
        this.challengeChanged();
      }
    },

    savedListOptionChangeHandler: function() {
      var option;
      option = $('#id_listOption').val();
      $('#savedListsSubmit').text(django.gettext('Play!')).prop(
        'disabled', false).removeClass('btn-danger').addClass('btn-success');
      $('#savedListsFlashcardEntire').prop('disabled', false);
      $('#savedListsFlashcardFM').prop('disabled', false);
      if (option === CONTINUE_LIST_CHOICE) {
        $('#savedListWarning').text("");
      } else if (option === RESTART_LIST_CHOICE) {
        $('#savedListWarning').text(django.gettext(
          "This will restart this list and wipe out all its information. " +
          "Make sure you want to do this!"
        ));
      } else if (option === FIRST_MISSED_CHOICE) {
        $('#savedListWarning').text("");
        this.dimIfListUnfinished("#savedListsSubmit");
      } else if (option === DELETE_LIST_CHOICE) {
        $('#savedListsSubmit').text(django.gettext('Delete selected list')).
          removeClass('btn-info').addClass('btn-danger');
        $('#savedListWarning').text(
          django.gettext("This will delete the selected list! Make sure you " +
            "want to do this!"));
        $('#savedListsFlashcardEntire').prop('disabled', true);
        $('#savedListsFlashcardFM').prop('disabled', true);
      }
      this.dimIfListUnfinished("#savedListsFlashcardFM");
    },


    savedListChangeHandler: function() {
      var option;
      option = $('#id_listOption').val();
      if (option === FIRST_MISSED_CHOICE) {
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
      this.ringSpinner.hide();
      if (data.success) {
        if (data.url) {
          window.location.href = data.url;   // redirect
        }
      } else {
        this.showError(data.error);
        $('.formSubmitButton').prop('disabled', false);
      }
    },

    submittedForm: function(e) {
      $(e.target).prop('disabled', true);
      this.ringSpinner.show();
    },

    challengeSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'challengeSubmit',
        lexicon: $('#id_lexicon').val(),
        challenge: $('#id_challenge').val(),
        challengeDate: $('#id_challengeDate').val()
      }, _.bind(this.wwRedirect, this), 'json');
    },

    searchParamsSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'searchParamsSubmit',
        lexicon: $('#id_lexicon').val(),
        quizTime: $("#id_quizTime").val(),
        wordLength: $("#id_wordLength").val(),
        probabilityMin: $("#id_probabilityMin").val(),
        probabilityMax: $("#id_probabilityMax").val()
      }, _.bind(this.wwRedirect, this), 'json');
    },

    namedListsSubmitClicked: function() {
      $.post(this.commandUrl, {
        action: 'namedListsSubmit',
        lexicon: $('#id_lexicon').val(),
        quizTime: $("#id_quizTime").val(),
        namedList: $("#id_namedList").val()
      }, _.bind(this.wwRedirect, this), 'json');
    },

    savedListsSubmitClicked: function() {
      var option;
      option = $('#id_listOption').val();
      if (option !== DELETE_LIST_CHOICE) {
        $.post(this.commandUrl, {
          action: 'savedListsSubmit',
          lexicon: $('#id_lexicon').val(),
          quizTime: $("#id_quizTime").val(),
          listOption: $("#id_listOption").val(),
          wordList: $("#id_wordList").val()
        }, _.bind(this.wwRedirect, this), 'json');
      } else {
        $.post(this.commandUrl, {
          action: 'savedListDelete',
          lexicon: $('#id_lexicon').val(),
          listOption: $("#id_listOption").val(),  /*todo redundancy, dry */
          wordList: $("#id_wordList").val()
        }, _.bind(this.savedListDelete, this), 'json');
      }
    },

    searchParamsFlashcardClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'searchParamsFlashcard',
        lexicon: $('#id_lexicon').val(),
        wordLength: $("#id_wordLength").val(),
        probabilityMin: $("#id_probabilityMin").val(),
        probabilityMax: $("#id_probabilityMax").val()
      }, _.bind(this.wwRedirect, this), 'json');
    },


    namedListsFlashcardClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'namedListsFlashcard',
        lexicon: $('#id_lexicon').val(),
        namedList: $("#id_namedList").val()
      }, _.bind(this.wwRedirect, this), 'json');
    },


    savedListsFlashcardEntireClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'savedListsFlashcardEntire',
        lexicon: $('#id_lexicon').val(),
        listOption: $('#id_listOption').val(),
        wordList: $("#id_wordList").val()
      }, _.bind(this.wwRedirect, this), 'json');
    },

    savedListsFlashcardFMClicked: function() {
      $.post(this.flashcardUrl, {
        action: 'savedListsFlashcardFM',
        lexicon: $('#id_lexicon').val(),
        listOption: $('#id_listOption').val(),
        wordList: $("#id_wordList").val()
      }, _.bind(this.wwRedirect, this), 'json');
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
      this.ringSpinner.show();
      // The API should only accept one date format.
      $.ajax({
        method: 'GET',
        url: '/wordwalls/api/challengers/',
        data: {
          lexicon: $('#id_lexicon').val(),
          challenge: $('#id_challenge').val(),
          date: Utils.convertDateToIso($('#id_challengeDate').val(),
            this.currentLanguage)
        },
        dataType: 'json'
      }).done(_.bind(this.populateDcResults, this));
      // $.post(this.commandUrl, {
      //   action: 'getDcResults',
      //   lexicon: $('#id_lexicon').val(),
      //   challenge: $('#id_challenge').val(),
      //   date: $('#id_challengeDate').val()
      // }, _.bind(this.populateDcResults, this), 'json');
    },

    populateDcResults: function(data) {
      this.ringSpinner.hide();
      ChallengeView.processDcResults(data, "dcResultsDiv");
    },

    savedListLexiconChanged: function() {
      $.post(this.commandUrl, {
        action: 'getSavedListList',
        lexicon: $('#id_lexicon option:selected').text()
      }, _.bind(this.processSavedListResults, this), 'json');
    },

    namedListLexiconChanged: function() {
      $.post(this.commandUrl, {
        action: 'getNamedListList',
        lexicon: $('#id_lexicon option:selected').text()
      }, _.bind(this.processNamedListResults, this), 'json');
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
            numAlphas: data[i].numAlphas,
            'i18n_ui_lastSaved': django.gettext('last saved'),
            'i18n_ui_totalAlphagrams': django.gettext('total alphagrams')
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
            numAlphas: data[i].numAlphas,
            'i18n_ui_totalAlphagrams': django.gettext('total alphagrams')
          }));
        }
        $("#id_namedList").html(options.join(''));
      }
    },

    requestSavedListInfo: function() {
      $.post(this.commandUrl, {action: 'getSavedListNumAlphas'},
        function(data) {
          var addlText, currentAlphs;
          addlText = "";
          if (data.l > 0) {
            addlText = django.gettext(
              'Your current limit is %s. You can increase this by becoming ' +
              'a supporter!');
            addlText = django.interpolate(addlText, [data.l]);
          }
          currentAlphs = django.gettext(
            'You have %s alphagrams over all your saved lists. ');
          currentAlphs = django.interpolate(currentAlphs, [data.na]);
          $('#numAlphasInfo').text(currentAlphs + addlText);
        }, 'json');
    }
  });
  return TableCreateView;
});