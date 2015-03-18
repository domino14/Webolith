define([
  'backbone',
  'models/lobby_table'
], function(Backbone, LobbyTable) {
  "use strict";
  var LobbyTables;
  LobbyTables = Backbone.Collection.extend({
    model: LobbyTable
  });
  return LobbyTables;
});