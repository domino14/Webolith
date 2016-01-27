/* global requirejs,define,mixpanel,JSON,django */
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
    dropzone: '../../../../static/js/aerolith/dropzone',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    sockjs: '../../../../static/js/aerolith/sockjs-0.3.min',
    json2: '../../../../static/js/aerolith/json2',
    backbone: '../../../../static/lib/backbone-1.0.0',
    /*datepicker: '../../../../static/lib/bootstrap-datepicker',
    datepickeres: '../../../../static/lib/bootstrap-datepicker.es.min'*/
  },
  shim: {
    underscore: {
      exports: '_'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.tab'
    },
    'json2': {
      exports: 'JSON'
    },
    backbone: {
      deps: ['underscore', 'jquery', 'json2'],
      exports: 'Backbone'
    }
    // datepicker: {
    //   deps: ['bootstrap', 'jquery'],
    //   exports: "$.fn.datepicker"
    // },
    // datepickeres: {
    //   deps: ['datepicker', 'jquery']
    // }
  }
});

define([
  'module',
  'jquery',
  'underscore',
  'tableCreate',
  'dropzone',
  'socket',
  'chat',
  'mustache',
  'text!templates/help/challenges.html',
  'text!templates/help/search_params.html',
  'text!templates/help/saved_lists.html',
  'text!templates/help/named_lists.html',
  'csrfAjax',
  'bootstrap'/*,
  'datepicker',
  'datepickeres'*/
], function (module, $, _, TableCreate, Dropzone, Socket, Chat,
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
      language: tableCreateParams.currentLanguage,
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
    /*$("#id_challengeDate").datepicker({
      startDate: new Date(2011, 5, 14),
      todayBtn: "linked",
      todayHighlight: true,
      autoclose: true,
      language: tableCreateParams.currentLanguage
    });*/
    uploader = new Dropzone('#file-uploader', {
      url: tableCreateParams.ajaxUploadUrl,
      headers: {'X-CSRFToken': tableCreateParams.csrfToken},
      uploadMultiple: false,
      maxFilesize: 2.5,
      addRemoveLinks: false,
      previewsContainer: '#hidden-preview-container',
      createImageThumbnails: false,
      maxFiles: 1
    });
    uploader.on('success', function(file, response) {
      $('#file-upload-msgs').text(django.gettext('Success! ') +
        JSON.parse(response));
      app.requestSavedListInfo();
      app.savedListLexiconChanged(); // to reload lists
      mixpanel.track('Uploaded list');
    });
    uploader.on('error', function(file, response) {
      mixpanel.track('Upload list error');
      $("#file-upload-msgs").text("Error: " + JSON.parse(response));
    });
    uploader.on('sending', function(file, xhr, formData) {
      formData.append('lexicon', $('#id_lexicon').val());
    });
    uploader.on('complete', function(file) {
      uploader.removeFile(file);
    });

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
