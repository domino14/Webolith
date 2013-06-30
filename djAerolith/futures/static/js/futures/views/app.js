define([
  'backbone',
  'jquery',
  'underscore',
  'collections/categories',
  'collections/futures',
  'views/category_view',
  'views/future_view',
  'text!templates/transaction.html',
  'text!templates/wallet.html',
  'text!templates/alert.html',
  'mustache',
  'bootstrap'
], function(Backbone, $, _, Categories, Futures, CategoryView, FutureView,
  TransactionTemplate, WalletTemplate, AlertTemplate, Mustache) {
  "use strict";
  var WALLET_URL, ORDERS_URL, FuturesApp;
  WALLET_URL = '/futures/api/wallet/';
  ORDERS_URL = '/futures/api/orders/';

  FuturesApp = Backbone.View.extend({
    initialize: function(options) {
      this.categories = new Categories();
      this.currentCategory = null;
      this.currentFutures = new Futures();
      this.categoryList = this.$('#category-list');
      this.futureList = this.$('#future-list');
      this.transactionForm = this.$('#transaction-form');
      this.listenTo(this.categories, 'reset', _.bind(this.addCategories, this));
      this.listenTo(this.currentFutures, 'reset', _.bind(this.addFutures,
        this));
      this.categories.reset(options.categories);
    },
    events: {
      'click .btn-buy': 'submitBuyOrder',
      'click .btn-sell': 'submitSellOrder',
      'click #setupWallet': 'setupWallet'
    },
    addCategory: function(category) {
      var categoryView = new CategoryView({model: category});
      this.categoryList.append(categoryView.render().el);
    },
    addCategories: function() {
      this.categories.each(this.addCategory, this);
    },
    /**
     * Load the list of futures for this category.
     * @param  {number} categoryId The database ID for this category.
     */
    loadCategory: function(categoryId) {
      this.currentFutures.loadFromCategory(categoryId);
    },

    addFuture: function(future) {
      var futureView = new FutureView({model: future});
      this.futureList.append(futureView.render().el);
      this.listenTo(futureView, 'newTransaction', this.showOrderForm);
    },
    addFutures: function() {
      this.currentFutures.each(this.addFuture, this);
      // Enable hover tooltip for buttons.
      this.$('.shares-buy,.shares-sell').tooltip();
    },
    /**
     * Show form for buying or selling future.
     * @param  {Backbone.Model} future The Future that the user wishes to buy.
     */
    showOrderForm: function(future, transactionType) {
      var context = {};
      if (transactionType === 'buy') {
        context.buy = true;
      } else if (transactionType === 'sell') {
        context.sell = true;
      }
      context.name = future.attributes.name;
      context.futureId = future.attributes.id;
      this.transactionForm.html(Mustache.render(TransactionTemplate, context));
    },
    /**
     * Actually submit an order to buy a future.
     */
    submitBuyOrder: function() {
      this.submitOrder('buy');
    },
    /**
     * Actually submit an order to sell a future.
     */
    submitSellOrder: function() {
      this.submitOrder('sell');
    },
    /**
     * Build the order.
     * @param {string} type The type of order to submit (buy or sell).
     */
    submitOrder: function(type) {
      $.post(ORDERS_URL, {
        type: type,
        numShares: this.$('#numShares').val(),
        price: this.$('#desiredPrice').val(),
        future: this.$('#submitTransaction').data('futureid')
      }, function(data) {
        console.log(data);
      }, 'json').fail(_.bind(this.failRequestHandler, this));
    },
    /**
     * Setup wallet.
     */
    setupWallet: function() {
      $.post(WALLET_URL, _.bind(function(data) {
        this.$('#wallet-manager').html(Mustache.render(WalletTemplate, data));
      }, this), 'json').fail(_.bind(this.failRequestHandler, this));
    },
    /**
     * When an XHR fails this function should display the reason for failure.
     * @param  {Object} jqXHR The jQuery XHR object.
     */
    failRequestHandler: function(jqXHR) {
      if (jqXHR.responseJSON) {
        this.showAlert(jqXHR.responseJSON);
      } else {
        this.showAlert('Unknown server error.');
      }
    },
    /**
     * Show alert
     * @param {string} alert Alert.
     */
    showAlert: function(alert) {
      this.$('#alert-area').html(Mustache.render(AlertTemplate, {
        alertText: alert,
        alertClass: 'alert-error'
      }));
    }
  });
  return FuturesApp;
});