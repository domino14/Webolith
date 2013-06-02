/* global define*/
define([
  'sockjs',
  'underscore',
  'json2',
  'jquery'
], function(SockJS, _, JSON, $) {
  "use strict";
  var Socket;
  Socket = function() {
    if (Socket.prototype.singletonInstance_) {
      return Socket.prototype.singletonInstance_;
    }
    Socket.prototype.singletonInstance_ = this;
    this.conn_ = null;
    this.url_ = null;
    this.tokenPath = '/socket_token';
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
     * Always create a new sock on connect. SockJS should clean up the
     * old one if we disconnected.
     */
    if (this.connected_ || this.backoffCounter_ > this.maxConnRetries_) {
      return;
    }
    console.log("Trying to get connection in", this.currentConnectInterval_,
                "ms...");
    this.conn_ = new SockJS(this.url_);
    this.conn_.onopen = _.bind(this.handleConnect_, this);
    this.conn_.onmessage = _.bind(this.handleMessage_, this);
    this.conn_.onclose = _.bind(this.handleDisconnect_, this);
    this.conn_.onerror = _.bind(this.handleError_, this);
  };
  Socket.prototype.handleMessage_ = function(e) {
    /*
     * Check if this is a special type of error - tokenError. If so we
     * will need a token refresh from the server.
     */
    var msgObj = JSON.parse(e.data);
    if (msgObj.type === 'tokenError') {
      $.get(this.tokenPath, _.bind(function(data) {
        this.socketConnectionToken_ = data;
        this.sendConnectionToken_();
      }, this), 'json');
    } else {
      this.messageHandler_(msgObj);
    }
  };
  Socket.prototype.handleConnect_ = function() {
    this.connected_ = true;
    this.resetBackoff_();
    this.sendConnectionToken_();
  };
  Socket.prototype.sendConnectionToken_ = function() {
    var msg = JSON.stringify({'token': this.socketConnectionToken_});
    this.send(msg);
  };
  Socket.prototype.resetBackoff_ = function() {
    this.backoffCounter_ = 0;
    this.currentConnectInterval_ = 100;
  };
  Socket.prototype.handleError_ = function() {
    console.log('error')
    console.log(arguments);
  };
  Socket.prototype.handleDisconnect_ = function() {
    this.connected_ = false;
    _.delay(_.bind(this.connect, this), this.currentConnectInterval_);
    this.currentConnectInterval_ *= 2;
    this.backoffCounter_ += 1;
  };
  Socket.prototype.send = function(m) {
    if (this.connected_) {
      this.conn_.send(m);
      console.log('Sent', m);
    }
  };
  return Socket;
});