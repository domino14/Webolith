define([
  'backbone',
  'underscore',
  'mustache',
  'text!templates/lobby_table.html'
], function(Backbone, _, Mustache, LobbyTableTemplate) {
  "use strict";
  var Lobby, LobbyTableView, MAX_DISPLAYED_PLAYERS;
  /**
   * The maximum number of players to display in a lobby table.
   * @type {number}
   */
  MAX_DISPLAYED_PLAYERS = 3;
  /**
   * The Lobby view will contain the list of "tables" with players in these.
   */
  Lobby = Backbone.View.extend({
    initialize: function(options) {
      /**
       * @type {Backbone.Collection}
       */
      this.tables = options.tables;
      this.tableViews = [];
      this.listenTo(this.tables, 'reset', _.bind(this.renderTables, this));
      this.$tables = this.$('.tables');
    },
    render: function() {

    },
    /**
     * For each table it assigns a view and renders all tables in the lobby.
     */
    renderTables: function() {
      this.tables.each(function(table) {
        var v;
        v = new LobbyTableView({model: table});
        this.tableViews.push(v);
        this.$tables.append(v.render().$el);
      }, this);
    }
  });

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

      this.$el.html(Mustache.render(LobbyTableTemplate, context));
      return this;
    }
  });
  return Lobby;
});