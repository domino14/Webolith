/* global requirejs,define,mixpanel */
requirejs.config({
  baseUrl: '/static/js/wordwalls',
  /*
   * Due to Django's style of having static directories per app, and because
   * our libs live in the djAerolith/static directory, we must append this
   * ugly path to every library file in order for the optimizer (r.js) to
   * work properly.
   */
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.11.0',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap',
    underscore: '../../../../static/lib/underscore-1.4.4',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    fileUploader: '../../../../static/js/aerolith/fileuploader',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    sockjs: '../../../../static/js/aerolith/sockjs-0.3.min',
    json2: '../../../../static/js/aerolith/json2',
    backbone: '../../../../static/lib/backbone-1.0.0',
    datepicker: '../../../../static/lib/bootstrap-datepicker'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.tab'
    },
    fileUploader: {
      exports: 'qq'
    },
    'json2': {
      exports: 'JSON'
    },
    backbone: {
      deps: ['underscore', 'jquery', 'json2'],
      exports: 'Backbone'
    },
    datepicker: {
      deps: ['bootstrap']
    }
  }
});

define([
  'module',
  'jquery',
  'tableCreate',
  'fileUploader',
  'socket',
  'chat',
  'mustache',
  'text!templates/help/challenges.html',
  'text!templates/help/search_params.html',
  'text!templates/help/saved_lists.html',
  'text!templates/help/named_lists.html',
  'csrfAjax',
  'bootstrap',
  'datepicker'
], function (module, $, TableCreate, fileUploader, Socket, Chat,
  Mustache,
  ChallengesHelp, SearchParamsHelp, SavedListsHelp, NamedListsHelp) {
  "use strict";
  $(function() {
    var tableCreateParams, uploader, s, c, app;
    /* Load bootstrapped params from backend. */
    tableCreateParams = module.config();
    $("#id_lexicon option[value='" + tableCreateParams.defaultLexicon +
      "']").prop('selected', true);
    app = new TableCreate({
      lengthCounts: tableCreateParams.lengthCounts,
      dcTimes: tableCreateParams.dcTimes,
      createTableUrl: tableCreateParams.createTableUrl,
      createQuizUrl: tableCreateParams.createQuizUrl,
      el: $('.container')
    });
    $('.help-question-marks').tooltip();
    $('#help-challenges').click(function() {
      showModalMessage('Today\'s Challenges Help', ChallengesHelp);
    });
    $('#help-search-params').click(function() {
      showModalMessage('Search Params Help', SearchParamsHelp);
    });
    $('#help-named-lists').click(function() {
      showModalMessage('Aerolith Lists Help', NamedListsHelp);
    });
    $('#help-saved-lists').click(function() {
      showModalMessage('Saved Lists Help',
        Mustache.render(SavedListsHelp, {
          'upload_list_limit': tableCreateParams.uploadListLimit
        }));
    });

    // Disable time select since daily challenges are selected.
    $("#id_quizTime").prop('disabled', true);
    $("#id_challengeDate").datepicker({
      startDate: new Date(2011, 5, 14),
      todayBtn: "linked",
      todayHighlight: true,
      autoclose: true
    });
    uploader = new fileUploader.FileUploader({
      action: tableCreateParams.ajaxUploadUrl,
      element: $('#file-uploader')[0],
      multiple: false,
      onComplete: function(id, fileName, responseJSON) {
        if (responseJSON.success ){
          $("#file-upload-msgs").text("Success! " + responseJSON.msg);
          app.requestSavedListInfo();
          app.savedListLexiconChanged();  // to reload lists
          mixpanel.track('Uploaded list');
        } else {
          mixpanel.track('Upload list error');
          $("#file-upload-msgs").text("Error: " + responseJSON.msg);
        }
      },
      onAllComplete: function(uploads) {
      },
      onSubmit: function() {
        uploader.setParams({
          'lexicon': $("#id_lexicon").val(),
          'csrf_token': tableCreateParams.csrfToken,
          'csrf_name': 'csrfmiddlewaretoken',
          'csrf_xname': 'X-CSRFToken'
        });
      },
      params: {

      }
    });
    $('.qq-upload-button').addClass('btn btn-info');
    if (tableCreateParams.chatEnabled === 'True' && false) {
      s = new Socket();
      s.setUrl(tableCreateParams.socketUrl);
      c = new Chat({
        el: $("#lobby"),
        socket: s,
        channel: 'lobby'
      });
      s.setToken(tableCreateParams.socketConnectionToken);
      s.connect();
    } else {
    }
    function showModalMessage(title, message) {
      $("#msg-content").html(message);
      $("#msg-title").html(title);
      $("#msg-modal").modal();
    }


  });
});
