/* global JSON*/
define([
  'jquery'
], function($) {
  "use strict";
  var ERROR_URL, ErrorHandler;
  ERROR_URL = '/js_errors/';

  ErrorHandler = {
    setup: function() {
      window.addEventListener("error", function (event) {
        ErrorHandler.sendErrorData({
          "message": event.error.message,
          "stack": event.error.stack
        });
      });
    },

    sendErrorData: function(data) {
      $.post(ERROR_URL, JSON.stringify(data));
    }
  };

  return ErrorHandler;
});