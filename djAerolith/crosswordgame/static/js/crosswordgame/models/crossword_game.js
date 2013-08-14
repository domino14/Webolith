/**
 * @fileOverview A model for a crossword game file. Maybe this will be expanded
 * for a full game implementation, but that's probably a separate more complex
 * model.
 */
define([
  'backbone',
  'underscore',
  'collections/gcg_event_list'
], function(Backbone, _, GCGEventList) {
  "use strict";
  return Backbone.Model.extend({
    initialize: function() {
      this.currentMove = 0;
    },
    defaults: {
      grid: null,
      bingoBonus: 50,
      distribution: null
    },
    /**
     * Initialize with a game, and set a few state variables.
     * @param {Object} gameDescription An object with the game description.
     */
    initNew: function(gameDescription) {
      var moves, firstEvent;
      moves = new GCGEventList();
      moves.reset(gameDescription.moves);
      this.set({
        id: gameDescription.id,
        lexicon: gameDescription.lexicon,
        players: gameDescription.players,
        moves: moves
      });
      this.numGCGEvents = _.size(this.get('moves'));
      firstEvent = this.get('moves').at(0);
      this.trigger('rack', firstEvent.get('player'), firstEvent.get('rack'));
    },
    numEvents: function() {
      return this.numGCGEvents;
    },
    /**
     * Loads next move. Advances index by 1 and emits whatever events the move
     * needs in order for the listener to render/whatever.
     */
    loadNextMove: function() {
      this.currentMove += 1;
      if (this.currentMove > this.numGCGEvents) {
        this.currentMove = this.numGCGEvents;
      }
      this.loadCurrentEvent();
    },
    /**
     * Loads previous move.
     */
    loadPreviousMove: function() {
      this.currentMove -= 1;
      if (this.currentMove < 0) {
        this.currentMove = 0;
      }
      this.trigger('gcgEventUnrender', this.currentMove);
      this.getNextRack();
    },
    /**
     * Load current event.
     */
    loadCurrentEvent: function() {
      var evt;
      evt = this.get('moves').at(this.currentMove - 1);
      if (!evt) {
        return;
      }
      this.trigger('gcgEvent', evt.get('event'), evt, this.currentMove - 1);
      this.getNextRack();
    },
    /**
     * Try getting next rack and emit an event for it.
     */
    getNextRack: function() {
      var evt;
      evt = this.get('moves').at(this.currentMove);
      if (!evt) {
        return;
      }
      this.trigger('rack', evt.get('player'), evt.get('rack'));
    }
  });
});