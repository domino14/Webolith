/**
 * @fileOverview The Tester is a semi-automatic tester mainly used for
 * testing multithreading/rapid solving. Should use with a multi-threaded
 * server such as gunicorn.
 */
define([
  'backbone',
  'underscore'
], function(Backbone, _) {
  "use strict";
  var Tester;
  Tester = {};
  Tester.questionData = null;
  Tester.enabled_ = false;
  /**
   * Enable the tester.
   */
  Tester.setEnabled = function() {
    Tester.enabled_ = true;
    Tester.trigger('msg', 'Tester has been enabled.');
  };
  /**
   * Is the tester enabled?
   * @return {boolean} Enabled.
   */
  Tester.getEnabled = function() {
    return Tester.enabled_;
  };
  Tester.setQuestionData = function(data) {
    Tester.questionData = data;

  };
  /**
   * Send a command to the tester.
   * @param  {string} command
   */
  Tester.submitCommand = function(command) {
    Tester.trigger('msg', 'Processing as tester command: ' + command);
    if (command === 'solveall') {
      _.delay(function() {
        Tester.guess();
      }, 0);
    }
    if (command === 'guessend') {
      Tester.trigger('testerGuess', Tester.questionData[0].ws[0].w);
      Tester.trigger('endGame');
    }
  };
  /*
   * Quickly guesses ALL answers. This can be used for testing database
   * locking with a multi-threaded web server (using gunicorn e.g.)
   */
  Tester.guess = function() {
    Tester.questionData = _.shuffle(Tester.questionData);
    _.each(Tester.questionData, function(question) {
      _.each(question.ws, function(word) {
        Tester.trigger('testerGuess', word.w);
      });
    });
  };
  _.extend(Tester, Backbone.Events);
  return Tester;
});