requirejs.config({
  baseUrl: '/static/js/wordwalls',
  paths: {
    jquery: '/static/js/aerolith/jquery-1.9.1.min',
    jquery_ui: '/static/js/aerolith/jquery-ui-1.10.2.custom.min',
    underscore: '/static/lib/underscore-min',
    csrfAjax: '/static/js/aerolith/csrfAjax',
    fileUploader: '/static/js/aerolith/fileuploader',
    mustache: '/static/lib/mustache',
    text: '/static/lib/require/text',
  },
  shim: {
    underscore: {
      exports: '_'
    },
    jquery_ui: ['jquery'],
    fileUploader: {
      exports: 'qq'
    }
  }
});

define([
  'module',
  'jquery',
  'tableCreate',
  'fileUploader',
  'csrfAjax',
  'jquery_ui',
  ], function (module, $, TableCreate, fileUploader) {
  "use strict";
  $(function() {
    var tableCreateParams, labelSize, uploader;
    /* Load bootstrapped params from backend. */
    tableCreateParams = module.config();
    // Remove CSW07
    $("#id_lexicon option[value='5']").remove();
    $("#id_lexicon option[value='" + tableCreateParams.defaultLexicon +
      "']").attr('selected', 'selected');
    TableCreate.initializeTableCreatePage(
      tableCreateParams.lengthCounts, tableCreateParams.dcTimes,
      tableCreateParams.createTableUrl, tableCreateParams.createQuizUrl);
    labelSize = '130px';
    $("label[for='id_wordLength']").width(labelSize);
    $("label[for='id_probabilityMin']").width(labelSize);
    $("label[for='id_probabilityMax']").width(labelSize);
    $("label[for='id_quizTime']").width(labelSize);
    $("label[for='id_playerMode']").width(labelSize);
    $("label[for='id_lexicon']").width(labelSize);

    $(".help").hide();
    $(".showHelp").click(function(){
        $(this).next(".help").toggle("slow");
    });
    $(".showHelp").button();
    $(".formSubmitButton").button();
    // Disable time select since daily challenges are selected.
    $("#id_quizTime").attr('disabled', true);
    $("#id_challengeDate").datepicker({
      minDate: new Date(2011, 5, 14),
      maxDate: 0,
      showButtonPanel: true});
    uploader = new fileUploader.FileUploader({
      action: tableCreateParams.ajaxUploadUrl,
      element: $('#file-uploader')[0],
      multiple: false,
      onComplete: function(id, fileName, responseJSON) {
        if (responseJSON.success ){
          $("#file-upload-msgs").text("Success! " + responseJSON.msg);
          requestSavedListInfo();
          savedListLexiconChanged();  // to reload lists
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
          'csrf_token': '{{ csrf_token }}',
          'csrf_name': 'csrfmiddlewaretoken',
          'csrf_xname': 'X-CSRFToken'
        });
      },
      params: {

      },
    });
  });
});
