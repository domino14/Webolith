define([
  'backbone'
], function(Backbone) {
  "use strict";
  var LobbyTable;
  LobbyTable = Backbone.Model.extend({
    defaults: {
      'playerList': [],
      'wordList': '',
      'lexicon': '',
      'timeLimit': 0
    }
  });
  return LobbyTable;
});