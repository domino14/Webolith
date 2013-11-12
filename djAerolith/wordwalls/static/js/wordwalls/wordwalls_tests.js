define([
  'backbone',
  'underscore'
], function(Backbone, _) {
  "use strict";
  var Tester;
  Tester = {};
  Tester.questionData = null;
  Tester.enabled = false;
  Tester.runTests = function() {
    Tester.trigger('requestStart');
    Tester.enabled = true;
  };
  Tester.setQuestionData = function(data) {
    Tester.questionData = data;
    if (!Tester.enabled) {
      return;
    }
    window.console.log(
      'Got question data, will start guessing in two seconds.');
    _.delay(function() {
      Tester.guess();
    }, 2000);
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