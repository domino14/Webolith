define([
  'backbone',
  'underscore',
  'views/lobby_table'
], function(Backbone, _, LobbyTableView) {
  "use strict";
  var Lobby;
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
    events: {
      'click .join': 'joinTable',
      'click .new-table': 'newTable'
    },
    joinTable: function(e) {
      this.trigger('joinTable', e.target.dataset.tableid);
    },
    newTable: function() {
      this.trigger('newTable');
    },
    render: function() {

    },
    hide: function() {
      this.$el.hide();
    },
    show: function() {
      this.$el.show();
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
  return Lobby;
});