/* global define, JSON*/
define([
  'underscore',
  'jquery',
  'backbone'
], function(_, $, Backbone) {
  "use strict";
  var Socket, DEFAULT_CONNECT_INTERVAL;
  /**
   * milliseconds
   * @type number
   */
  DEFAULT_CONNECT_INTERVAL = 100;
  Socket = function(realm) {
    if (Socket.prototype.singletonInstance_) {
      return Socket.prototype.singletonInstance_;
    }
    Socket.prototype.singletonInstance_ = this;
    this.conn_ = null;
    this.realm_ = realm;
    this.url_ = null;
    this.tokenPath = '/socket_token/';
    this.connected_ = false;
    this.messageHandler_ = null;
    // Used for exponential backoff for reconnect.
    this.resetBackoff_();
    this.maxConnRetries_ = 12;
    this.socketConnectionToken_ = null;
  };
  Socket.prototype.setUrl = function(url) {
    this.url_ = url;
  };
  Socket.prototype.setMessageHandler = function(messageHandler) {
    this.messageHandler_ = messageHandler;
  };
  Socket.prototype.setToken = function(token) {
    this.socketConnectionToken_ = token;
  };
  Socket.prototype.connect = function() {
    /*
     * Always create a new sock on connect. Our server should clean up
     * the old one if we disconnected.
     */
    console.log('Called connect', this.connected_);
    if (this.connected_) {
      return;
    }
    // We can't pass the token through custom headers so just append it
    // to the query string.
    this.conn_ = new WebSocket(this.url_ + '&_token=' +
      this.socketConnectionToken_);
    this.conn_.onopen = _.bind(this.handleConnect_, this);
    this.conn_.onmessage = _.bind(this.handleMessage_, this);
    this.conn_.onclose = _.bind(this.handleDisconnect_, this);
    this.conn_.onerror = _.bind(this.handleError_, this);
  };
  Socket.prototype.handleMessage_ = function(e) {
    // Don't reset backoff until we get a message. This is because we
    // can connect and disconnect right away if the signature is wrong.
    this.resetBackoff_();
    /*
     * Check if this is a special type of error - tokenError. If so we
     * will need a token refresh from the server.
     */
    var msgObj = JSON.parse(e.data);
    console.log('in socket message', msgObj);
    this.trigger('message', msgObj);
  };
  Socket.prototype.handleConnect_ = function() {
    this.connected_ = true;
  };
  Socket.prototype.resetBackoff_ = function() {
    this.backoffCounter_ = 0;
    this.currentConnectInterval_ = DEFAULT_CONNECT_INTERVAL;
  };
  Socket.prototype.handleError_ = function() {
    console.log('error')
    console.log(arguments);
  };
  Socket.prototype.handleDisconnect_ = function(e) {
    console.log('In disconnect', e);
    this.connected_ = false;
    if (e.code === 1008) {
      // Sent by backend if the signature is invalid.
      $.get(this.tokenPath, {
        realm: this.realm_
      },_.bind(function(data) {
        console.log('Getting new token', data, 'connecting again soon.');
        this.socketConnectionToken_ = data.token;
        this.url_ = data.url;
        _.delay(_.bind(this.connect, this), DEFAULT_CONNECT_INTERVAL);
      }, this), 'json').fail(function() {
        console.log("failed to get token");
      });
    } else {
      _.delay(_.bind(this.connect, this), this.currentConnectInterval_);
    }
    this.currentConnectInterval_ *= 2;
    this.backoffCounter_ += 1;
  };
  /**
   * Send an object through the web socket. This function will send
   * the JSON representation of it.
   * @param  {Object} m
   */
  Socket.prototype.send = function(m) {
    if (this.connected_) {
      this.conn_.send(JSON.stringify(m));
    }
  };
  _.extend(Socket.prototype, Backbone.Events);
  return Socket;
});