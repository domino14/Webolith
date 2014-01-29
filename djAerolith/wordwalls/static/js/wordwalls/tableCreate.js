/*global define*/
define([
  'jquery',
  'underscore',
  'ChallengeView',
  'bootstrap'
], function($, _, ChallengeView) {
  var lengthCounts, maxProb, url, flashcardUrl, dcTimeMap;

  function changeMaxProb() {
    var lex, curLength;
    lex = $('#id_lexicon option:selected').text();
    curLength = $('#id_wordLength').val();
    if (curLength < 2 || curLength > 15) {
      return false;    /* don't change anything */
    }
    maxProb = lengthCounts[lex][curLength];
    $('label[for="id_probabilityMax"]').text(
      "Max probability (at most " + maxProb + ")");
    if ($('#id_probabilityMax').val() > maxProb) {
      $('#id_probabilityMax').val(maxProb);
    }
    return true;
  }

  function challengeChangeEventHandler() {
    // If this isn't the challenge tab, don't run this code.
    /* XXX: FIX
    if ($("#listTabs").tabs('option', 'active') !== 0) {
      return;
    }*/
    challengeChanged();
  }

  function challengeChanged() {
    var date, cVal, cName, lexName, lblText;
    date = $('#id_challengeDate').val();
    cVal = $('#id_challenge option:selected').val();
    if (cVal === "") {
      // this is the ----- text
      $('#dcResultsLabel').text('Select a challenge to view leaderboard');
      $("#id_quizTime").val(0);
    } else {
      cName = $('#id_challenge option:selected').text();
      lexName = $('#id_lexicon option:selected').text();
      lblText = '(' + lexName + ') ' + cName + ' leaderboard';
      if (date) {
        lblText += ' (' + date + ')';
      }
      $('#dcResultsLabel').text(lblText);
      getDcResults();
      $("#id_quizTime").val(dcTimeMap[cVal]/60.0);
    }
  }

  function tabSelected(event, ui) {
    /* this function gets triggered when the user selects a tab from
    the list types */
    if (ui.newTab.index() === 0) {
        /* today's challenges. disable time select */
      $("#id_quizTime").prop('disabled', true);
      challengeChanged();
    } else {
      $("#id_quizTime").prop('disabled', false);
      $("#id_quizTime").val(4);
    }
  }

  function initializeTableCreatePage(lStr, dcStr, _url, furl) {
    var success;
    url = _url;
    flashcardUrl = furl;
    lengthCounts = $.parseJSON(lStr);
    dcTimeMap = $.parseJSON(dcStr);
    _.each(lengthCounts, function(lex, index) {
      lengthCounts[index] = $.parseJSON(lex);
    });
    /* XXX: FIX
    $("#listTabs").tabs({
      beforeActivate: tabSelected
    }).css('display', 'block');
    */
    /* set up event handlers */
    $('#id_lexicon').change(function() {
      success = changeMaxProb();
      if (!success) {
        $("#id_wordLength").val("");
      }
    });
    $('#id_wordLength').change(function() {
      success = changeMaxProb();
      if (!success) {
        $("#id_wordLength").val("");
      }
    });
    $('#id_probabilityMin').change(function() {
      /* if it's less than 1, set it equal to 1, if it's greater than
        the max probability, set it to the max */
      if ($(this).val() < 1) {
        $(this).val("1");
      }
    });
    $('#id_probabilityMax').change(function() {
      if ($(this).val() > maxProb) {
        $(this).val(maxProb);
      }
    });
    /* event handlers - today's challenges */
    $('#id_challengeDate').change(challengeChangeEventHandler);
    $('#id_challenge').change(challengeChangeEventHandler);
    $('#id_lexicon').change(challengeChangeEventHandler);
    // show results label with selected challenge on load
    challengeChanged();
    changeMaxProb();
    initializeButtons();
    $('#id_listOption').change(savedListOptionChangeHandler);
    $('#id_wordList').change(savedListChangeHandler);
    savedListOptionChangeHandler();
    savedListChangeHandler();
    $('#id_lexicon').change(savedListLexiconChanged);
    savedListLexiconChanged();
    $("#id_lexicon").change(namedListLexiconChanged);
    namedListLexiconChanged();
    $("#challengeSubmit").click(challengeSubmitClicked);
    $("#searchParamsSubmit").click(searchParamsSubmitClicked);
    $("#savedListsSubmit").click(savedListsSubmitClicked);
    $("#namedListsSubmit").click(namedListsSubmitClicked);

    $("#searchParamsFlashcard").click(searchParamsFlashcardClicked);
    $("#savedListsFlashcardEntire").click(savedListsFlashcardEntireClicked);
    $("#savedListsFlashcardFM").click(savedListsFlashcardFMClicked);
    $("#namedListsFlashcard").click(namedListsFlashcardClicked);
    requestSavedListInfo();
  }

  function initializeButtons() {
    $('#savedListsSubmit').button();
    $('#savedListsFlashcardEntire').button();
    $('#savedListsFlashcardFM').button();
    $('#savedListsSubmit').button();
    $('#savedListsFlashcardEntire').button();
    $('#savedListsFlashcardFM').button();
  }

  function savedListOptionChangeHandler() {
    var optionName;
    optionName = $('#id_listOption option:selected').text();
    $('#savedListsSubmit').button('option', 'label', 'Play!').button('enable');
    $('#savedListsFlashcardEntire').button('enable');
    $('#savedListsFlashcardFM').button('enable');
    if (optionName === "Continue list") {
      $('#savedListWarning').text("");
    } else if (optionName === "Restart list") {
      $('#savedListWarning').text([
        "This will restart this list and wipe out all its information. ",
        "Make sure you want to do this!"
      ].join(''));
    } else if (optionName === "Quiz on first missed") {
      $('#savedListWarning').text("");
      dimIfListUnfinished("#savedListsSubmit");
    } else if (optionName === "Delete list") {
      $('#savedListsSubmit').button('option', 'label', 'Delete selected list');
      $('#savedListWarning').text(
        "This will delete the selected list! Make sure you want to do this!");
      $('#savedListsFlashcardEntire').button('disable');
      $('#savedListsFlashcardFM').button('disable');
    }
    dimIfListUnfinished("#savedListsFlashcardFM");
  }

  function savedListChangeHandler() {
    var optionName;
    optionName = $('#id_listOption option:selected').text();
    if (optionName === "Quiz on first missed") {
      dimIfListUnfinished("#savedListsSubmit");
    }
    dimIfListUnfinished("#savedListsFlashcardFM");
  }

  function dimIfListUnfinished(selector) {
    if ($('#id_wordList option:selected').attr('goneThruOnce') !== "true") {
      /* list has NOT been gone thru at least once. So going thru first
        missed should not work! */
      $(selector).button('disable');
    } else {
      $(selector).button('enable');
    }
  }

  function getDcResults() {
    // gets daily challenge results from server
    $.post(url, {
      action: 'getDcResults',
      lexicon: $('#id_lexicon option:selected').text(),
      chName: $('#id_challenge option:selected').text(),
      date: $('#id_challengeDate').val()
    }, populateDcResults, 'json');
  }

  function populateDcResults(data) {
    ChallengeView.processDcResults(data, "dcResultsDiv");
  }

  function savedListLexiconChanged() {
    $.post(url, {
      action: 'getSavedListList',
      lexicon: $('#id_lexicon option:selected').text()
    }, processSavedListResults, 'json');
  }

  function namedListLexiconChanged() {
    $.post(url, {
      action: 'getNamedListList',
      lexicon: $('#id_lexicon option:selected').text()
    }, processNamedListResults, 'json');
  }

  function processSavedListResults(data) {
    var options, i;
    if (data === null) {
      $("#id_wordList").html("");
    } else {
      options = [];
      for (i = 0; i < data.length; i++) {
        options.push('<option value=', '"', data[i].pk, '"');
        if (data[i].goneThruOnce) {
          options.push(' goneThruOnce="true"');
        }
        options.push('>', data[i].name,
          ' (last saved ', data[i].lastSaved, ')');
        if (data[i].goneThruOnce) {
          options.push(' *');
        }
        options.push(' -- ', data[i].numAlphas, " total alphagrams");
        options.push('</option>');
      }
      $("#id_wordList").html(options.join(''));
    }
  }

  function processNamedListResults(data) {
    var options, i;
    if (data === null) {
      $("#id_namedList").html("");
    } else {
      options = [];
      for (i = 0; i < data.length; i++) {
        options.push('<option value=', '"', data[i].pk, '">',
          data[i].name);
        options.push(' -- ', data[i].numAlphas, " total alphagrams");
        options.push('</option>');
      }
      $("#id_namedList").html(options.join(''));
    }
  }

  function requestSavedListInfo() {
    $.post(url, {action: 'getSavedListNumAlphas'},
      function(data) {
        var addlText;
        addlText = "";
        if (data.l > 0) {
          addlText = [
            "Your current limit is ",
            data.l,
            ". You can increase this by becoming a supporter!"
          ].join('');
          $("#numAlphasInfo").text([
              "You have ", data.na,
              " alphagrams over all your saved lists. ",
              addlText
            ].join(''));
        }
      }, 'json');
  }

  function wwRedirect(data) {
    if (data.success) {
      if (data.url) {
        window.location.href = data.url;   // redirect
      }
    } else {
      // XXX: use templates
      showError(data.error);
    }
  }

  function showError(error) {
    $("#infoDialog").html("<P>" + error + "</P>").attr(
        "title", "Error");
    $("#infoDialog").dialog({
      height: 140,
      modal: true
    }).show();
  }

  function challengeSubmitClicked() {
    $.post(url, {
      action: 'challengeSubmit',
      lexicon: $('#id_lexicon').val(),
      challenge: $('#id_challenge').val(),
      challengeDate: $('#id_challengeDate').val()
    }, wwRedirect, 'json');
  }

  function searchParamsSubmitClicked() {
    $.post(url, {
      action: 'searchParamsSubmit',
      lexicon: $('#id_lexicon').val(),
      quizTime: $("#id_quizTime").val(),
      wordLength: $("#id_wordLength").val(),
      probabilityMin: $("#id_probabilityMin").val(),
      probabilityMax: $("#id_probabilityMax").val(),
      playerMode: $("#id_playerMode").val()
    }, wwRedirect, 'json');
  }

  function searchParamsFlashcardClicked() {
    $.post(flashcardUrl, {
      action: 'searchParamsFlashcard',
      lexicon: $('#id_lexicon').val(),
      wordLength: $("#id_wordLength").val(),
      probabilityMin: $("#id_probabilityMin").val(),
      probabilityMax: $("#id_probabilityMax").val(),
      playerMode: $("#id_playerMode").val()
    }, wwRedirect, 'json');
  }

  function namedListsSubmitClicked() {
    $.post(url, {
      action: 'namedListsSubmit',
      lexicon: $('#id_lexicon').val(),
      quizTime: $("#id_quizTime").val(),
      namedList: $("#id_namedList").val()
    }, wwRedirect, 'json');
  }

  function namedListsFlashcardClicked() {
    $.post(flashcardUrl, {
      action: 'namedListsFlashcard',
      lexicon: $('#id_lexicon').val(),
      namedList: $("#id_namedList").val()
    }, wwRedirect, 'json');
  }

  function savedListsSubmitClicked() {
    var optionName;
    optionName = $('#id_listOption option:selected').text();
    if (optionName !== "Delete list") {
      $.post(url, {
        action: 'savedListsSubmit',
        lexicon: $('#id_lexicon').val(),
        quizTime: $("#id_quizTime").val(),
        listOption: $("#id_listOption").val(),
        wordList: $("#id_wordList").val()
      }, wwRedirect, 'json');
    } else {
      $.post(url, {
        action: 'savedListDelete',
        lexicon: $('#id_lexicon').val(),
        listOption: $("#id_listOption").val(),  /*todo redundancy, dry */
        wordList: $("#id_wordList").val()
      }, savedListDelete, 'json');
    }
  }

  function savedListsFlashcardEntireClicked() {
    $.post(flashcardUrl, {
      action: 'savedListsFlashcardEntire',
      lexicon: $('#id_lexicon').val(),
      listOption: $('#id_listOption').val(),
      wordList: $("#id_wordList").val()
    }, wwRedirect, 'json');
  }

  function savedListsFlashcardFMClicked() {
    $.post(flashcardUrl, {
      action: 'savedListsFlashcardFM',
      lexicon: $('#id_lexicon').val(),
      listOption: $('#id_listOption').val(),
      wordList: $("#id_wordList").val()
    }, wwRedirect, 'json');
  }

  function savedListDelete(data) {
    if (data.deleted) {
      $("#id_wordList option[value=" + data.wordList + "]").remove();
      requestSavedListInfo(); // populate new limit/text
    } else {
      showError(data.error);
    }
  }
  return {
    initializeTableCreatePage: initializeTableCreatePage,
    requestSavedListInfo: requestSavedListInfo,
    savedListLexiconChanged: savedListLexiconChanged
  };
});