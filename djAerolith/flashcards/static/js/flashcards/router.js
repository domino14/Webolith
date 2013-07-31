define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Router.extend({
    routes: {
      'newquiz': 'newQuiz',
      'quiz': 'continueQuiz'
    }
  });
});