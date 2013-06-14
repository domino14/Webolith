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
    jquery: '../../../../static/js/aerolith/jquery-1.10.1',
    jquery_ui: '../../../../static/js/aerolith/jquery-ui-1.10.2.custom.min',
    underscore: '../../../../static/lib/underscore-1.4.4',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    fileUploader: '../../../../static/js/aerolith/fileuploader',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    sockjs: '../../../../static/js/aerolith/sockjs-0.3.min',
    json2: '../../../../static/js/aerolith/json2',
    backbone: '../../../../static/lib/backbone-1.0.0'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    jquery_ui: ['jquery'],
    fileUploader: {
      exports: 'qq'
    },
    'json2': {
      exports: 'JSON'
    },
    backbone: {
      deps: ['underscore', 'jquery', 'json2'],
      exports: 'Backbone'
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
  'csrfAjax',
  'jquery_ui'
], function (module, $, TableCreate, fileUploader, Socket, Chat) {
  "use strict";
  $(function() {
    var tableCreateParams, labelSize, uploader, s, c;
    /* Load bootstrapped params from backend. */
    tableCreateParams = module.config();
    // Remove CSW07
    $("#id_lexicon option[value='5']").remove();
    $("#id_lexicon option[value='" + tableCreateParams.defaultLexicon +
      "']").prop('selected', true);
    TableCreate.initializeTableCreatePage(
      tableCreateParams.lengthCounts, tableCreateParams.dcTimes,
      tableCreateParams.createTableUrl, tableCreateParams.createQuizUrl);
    labelSize = '130px';
    $("label[for='id_wordLength']").width(labelSize);
    $("label[for='id_probabilityMin']").width(labelSize);
    $("label[for='id_probabilityMax']").width(labelSize);
    $("label[for='id_playerMode']").width(labelSize);

    $(".help").hide();
    $(".showHelp").click(function(){
      $(this).next(".help").toggle("slow");
    });
    $(".showHelp").button();
    $(".formSubmitButton").button();
    // Disable time select since daily challenges are selected.
    $("#id_quizTime").prop('disabled', true);
    $("#id_challengeDate").datepicker({
      minDate: new Date(2011, 5, 14),
      maxDate: 0,
      showButtonPanel: true
    });
    uploader = new fileUploader.FileUploader({
      action: tableCreateParams.ajaxUploadUrl,
      element: $('#file-uploader')[0],
      multiple: false,
      onComplete: function(id, fileName, responseJSON) {
        if (responseJSON.success ){
          $("#file-upload-msgs").text("Success! " + responseJSON.msg);
          TableCreate.requestSavedListInfo();
          TableCreate.savedListLexiconChanged();  // to reload lists
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
    if (tableCreateParams.chatEnabled === 'True') {
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
      $('#listTabs').css({'width': '900px'});
    }
  });
});
