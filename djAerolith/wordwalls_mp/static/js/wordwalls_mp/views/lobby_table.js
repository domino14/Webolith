define([
  'backbone',
  'underscore',
  'mustache',
  'text!templates/lobby_table.html'
], function(Backbone, _, Mustache, LobbyTableTemplate) {
  "use strict";
  var LobbyTableView, MAX_DISPLAYED_PLAYERS;
  /**
   * The maximum number of players to display in a lobby table.
   * @type {number}
   */
  MAX_DISPLAYED_PLAYERS = 3;
  /**
   * The view for a single lobby table, in a list. Will contain things
   * such as the active word list, number of players in it, etc.
   */
  LobbyTableView = Backbone.View.extend({
    initialize: function() {

    },
    /**
     * Shorten a list of players.
     * @param  {Array.<string>} list
     * @return {string}
     */
    shortenPlayerList_: function(list) {
      var ct, newList;
      newList = [];
      if (_.size(list) <= MAX_DISPLAYED_PLAYERS) {
        return list.join(', ');
      }
      ct = 0;
      _.every(list, function(player) {
        newList.push(player);
        ct++;
        if (ct === MAX_DISPLAYED_PLAYERS) {
          return false; // break out of _.every
        }
        return true;
      });
      newList.push('and ' + (_.size(list) - MAX_DISPLAYED_PLAYERS) + ' more');
      return newList.join(', ');
    },
    render: function() {
      var context = this.model.toJSON();
      context.players = this.shortenPlayerList_(context.playerList);
      // XXX: get from Firebase.
      context.id = this.model.cid;
      this.$el.html(Mustache.render(LobbyTableTemplate, context));
      return this;
    }
  });
  return LobbyTableView;
});