/* global JSON*/
define([
  'jquery'
], function($) {
  "use strict";
  var ERROR_URL, ErrorHandler, ERROR_TIMEOUT, MAX_ERROR_TIMEOUT;
  ERROR_URL = '/js_errors/';
  ERROR_TIMEOUT = 1000;
  MAX_ERROR_TIMEOUT = 60000;

  ErrorHandler = {
    errorTimeout: ERROR_TIMEOUT,
    errorQueue: [],
    setup: function() {
      window.addEventListener("error", function (event) {
        ErrorHandler.sendErrorData({
          "fe_message": event.error.message,
          "fe_stack": event.error.stack
        });
      });
    },

    sendErrorData: function(data) {
      data['fe_timestamp'] = new Date().toString();
      $.post(ERROR_URL, JSON.stringify(data)).fail(function() {
        ErrorHandler.errorQueue.push(JSON.stringify(data));
        // Try again soon.
        setTimeout(ErrorHandler.sendErrorQueue, ErrorHandler.errorTimeout);
      });

    },

    sendErrorQueue: function() {
      $.post(ERROR_URL, JSON.stringify({
        'fe_message': 'error queue',
        'queue': ErrorHandler.errorQueue
      })).success(function() {
        ErrorHandler.errorQueue = [];
        ErrorHandler.errorTimeout = ERROR_TIMEOUT;
      }).fail(function() {
        // Exponential backoff.
        ErrorHandler.errorTimeout *= 1.5;
        if (ErrorHandler.errorTimeout > MAX_ERROR_TIMEOUT) {
          ErrorHandler.errorTimeout = MAX_ERROR_TIMEOUT;
        }
        setTimeout(ErrorHandler.sendErrorQueue, ErrorHandler.errorTimeout);
      });
    }
  };

  return ErrorHandler;
});