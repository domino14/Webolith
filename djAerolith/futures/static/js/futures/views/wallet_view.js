define([
  'backbone',
  'jquery',
  'underscore',
  'text!templates/wallet.html',
  'mustache'
], function(Backbone, $, _, WalletTemplate, Mustache) {
  "use strict";
  var WALLET_URL = '/futures/api/wallet/';
  return Backbone.View.extend({
    initialize: function() {
      this.listenTo(this.model, 'change', _.bind(this.render, this));
    },
    events: {
      'click #setupWallet': 'setupWallet'
    },
    /**
     * Setup wallet.
     */
    setupWallet: function() {
      $.post(WALLET_URL, _.bind(this.setInitial, this), 'json').fail(
        _.bind(this.failRequestHandler, this));
    },
    /**
     * Render wallet.
     * @param {Object} data The wallet data.
     */
    render: function() {
      var context;
      context = this.model.toJSON();
      if (_.size(context.displayShares) > 0) {
        context.sharesToView = true;
      }
      this.$el.html(Mustache.render(WalletTemplate, context));
    },
    /**
     * Only called when a wallet is first set up by the user.
     * @param  {Object} data The initial wallet data model hash.
     */
    setInitial: function(data) {
      if (!_.has(data, 'toSpend')) {
        data.toSpend = data.points - data.frozen;
      }
      data.setup = true;
      this.model.set(data);
    },
    failRequestHandler: function(jqXHR) {
      this.trigger('failedRequest', jqXHR);
    }
  });
});