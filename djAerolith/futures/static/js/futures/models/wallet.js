define([
  'backbone',
  'underscore'
], function(Backbone, _) {
  "use strict";
  return Backbone.Model.extend({
    initialize: function() {},
    defaults: {
      points: null,
      frozen: null,
      toSpend: null,
      displayShares: [],     // The shares that have the actual future names.
      shares: {},  // The shares with just future PKs.
      setup: false
    },
    /**
     * Set initial variables for the wallet.
     * @param  {Object} vars Initial variables.
     */
    setVars: function(vars) {
      this.set('points', vars.points);
      this.set('frozen', vars.frozen);
      this.set('toSpend', vars.points - vars.frozen);
      this.set('setup', true);
      this.set('rawShares', vars.shares_owned);
    },
    /**
     * Update shares with future names.
     * @param  {Backbone.Collection} shares The futures with descriptions.
     */
    updateShares: function(futures) {
      var displayShares, shares;
      displayShares = [];
      shares = this.get('shares');
      this.set('displayShares', []);
      futures.each(function(future) {
        if (!_.has(futures.futureMap, future.id)) {
          return;
        }
        if (!_.has(shares, future.id)) {
          return;
        }
        displayShares.push({
          'shareName': future.get('name'),
          'numShares': shares[(future.id)]
        });
      }, this);
      displayShares.sort(function(s1, s2) {
        return s1.numShares - s2.numShares;
      });
      this.set('displayShares', displayShares);
    }
  });
});