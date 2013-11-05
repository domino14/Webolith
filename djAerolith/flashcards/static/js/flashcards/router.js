define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Router.extend({
    routes: {
      'newquiz': 'newQuiz',
      'help': 'help',
      'remote/:action/:id': 'remoteQuizAction',
      'continue/local': 'continueQuiz',
      'continue': 'showQuizList'
    }
  });
});