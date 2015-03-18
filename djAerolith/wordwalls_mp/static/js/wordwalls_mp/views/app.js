define([
  'backbone',
  'jquery',
  'views/lobby',
  'collections/lobby_tables'
], function(Backbone, $, Lobby, Tables) {
  "use strict";
  var App;
  App = Backbone.View.extend({
    initialize: function() {
      var lobby, tables;
      tables = new Tables();
      lobby = new Lobby({
        tables: tables,
        el: $('.lobby')
      });
      tables.reset([{
        playerList: ['zapdos', 'moltres', 'pikachu', 'raichu', 'ninetales'],
        wordList: 'The 5s (1001 - 2000)',
        lexicon: 'America',
        timeLimit: 400
      }, {
        playerList: ['flareon', 'articuno'],
        wordList: 'JQXZ 8s',
        lexicon: 'CSW12',
        timeLimit: 300
      },
      {
        playerList: ['nidorino♂', 'meowmes', 'eevee'],
        wordList: 'The 8s (2001-3000)',
        lexicon: 'America',
        timeLimit: 450
      }
      ]);
    }
  });
  return App;
});