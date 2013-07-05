define([
  'backbone',
  'jquery',
  'underscore',
  'models/wallet',
  'collections/categories',
  'collections/futures',
  'views/category_view',
  'views/future_view',
  'views/wallet_view',
  'views/open_orders_view',
  'views/transaction_view',
  'text!templates/order.html',
  'text!templates/alert.html',
  'mustache',
  'bootstrap'
], function(Backbone, $, _, Wallet, Categories, Futures,
  CategoryView, FutureView, WalletView, OpenOrdersView,
  TransactionsView, OrderTemplate,
  AlertTemplate, Mustache) {
  "use strict";
  var ORDERS_URL, FuturesApp;
  ORDERS_URL = '/futures/api/orders/';

  FuturesApp = Backbone.View.extend({
    initialize: function(options) {
      this.categories = new Categories();
      this.currentFutures = new Futures();
      this.currentCategory = null;
      this.categoryList = this.$('#category-list');
      this.categoryTitle = this.$('#category-title');
      this.futureList = this.$('#future-list');
      this.orderForm = this.$('#order-form');
      this.listenTo(this.categories, 'reset', _.bind(this.addCategories, this));
      this.listenTo(this.currentFutures, 'reset', _.bind(this.addFutures,
        this));
      this.categories.reset(options.categories);
      this.wallet = new Wallet();
      this.openOrders = new OpenOrdersView({
        orders: options.orders,
        el: $('#open-orders')
      });
      if (options.wallet) {
        this.wallet.setVars(options.wallet);
      }
      this.walletView = new WalletView({
        model: this.wallet,
        el: $('#wallet-manager')
      });
      this.transactionView = new TransactionsView({
        transactions: options.lastTransactions,
        el: $('#last-transactions')
      });
      this.listenTo(this.walletView, 'failedRequest', _.bind(
        this.failRequestHandler, this));
      this.listenTo(this.currentFutures, 'reset', _.bind(
        this.wallet.updateShares, this.wallet));
      this.listenTo(this.currentFutures, 'reset', _.bind(
        this.openOrders.updateShares, this.openOrders));
      this.listenTo(this.currentFutures, 'reset', _.bind(
        this.transactionView.updateShares, this.transactionView));
      this.walletView.render();
    },
    events: {
      'click .btn-buy': 'submitBuyOrder',
      'click .btn-sell': 'submitSellOrder'
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
      this.futureList.empty();
      this.currentFutures.loadFromCategory(categoryId);
      this.categoryTitle.html(this.categories.get(categoryId).get('name'));
    },

    addFuture: function(future) {
      var futureView = new FutureView({model: future});
      this.futureList.append(futureView.render().el);
      this.listenTo(futureView, 'newOrder', this.showOrderForm);
    },
    addFutures: function() {
      this.currentFutures.each(this.addFuture, this);
      // Enable hover tooltip for buttons.
      this.$('.has-tooltip').tooltip();
    },
    /**
     * Show form for buying or selling future.
     * @param {Backbone.Model} future The Future that the user wishes to buy.
     * @param {string} orderType The type of order; buy or sell.
     */
    showOrderForm: function(future, orderType) {
      var context = {};
      if (orderType === 'buy') {
        context.buy = true;
      } else if (orderType === 'sell') {
        context.sell = true;
      }
      context.name = future.attributes.name;
      context.futureId = future.attributes.id;
      this.orderForm.html(Mustache.render(OrderTemplate, context));
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
        future: this.$('#submitOrder').data('futureid')
      }, function(data) {
        console.log(data);
      }, 'json').fail(_.bind(this.failRequestHandler, this));
    },

    /**
     * When an XHR fails this function should display the reason for failure.
     * @param  {Object} jqXHR The jQuery XHR object.
     */
    failRequestHandler: function(jqXHR) {
      if (jqXHR.responseJSON) {
        this.showAlert(jqXHR.responseJSON);
      } else if (jqXHR.status === 403) {
        this.showAlert('<a href="/accounts/register/">Please create an ' +
                       'account first.</a>');
      } else {
        this.showAlert('Unknown server error.');
      }
    },
    /**
     * Show alert
     * @param {string} alert The alert HTML.
     */
    showAlert: function(alert) {
      this.$('#alert-area').html(Mustache.render(AlertTemplate, {
        alertHTML: alert,
        alertClass: 'alert-error'
      }));
    }
  });
  return FuturesApp;
});