/* global define*/
define([
  'sockjs',
  'underscore'
], function(SockJS, _) {
  "use strict";
  var Socket;
  Socket = function() {
    if (Socket.prototype.singletonInstance_) {
      return Socket.prototype.singletonInstance_;
    }
    Socket.prototype.singletonInstance_ = this;
    this.conn_ = null;
    this.url_ = null;
    this.connected_ = false;
    this.messageHandler_ = null;
    // Used for exponential backoff for reconnect.
    this.resetBackoff_();
    this.maxConnRetries_ = 12;
  };
  Socket.prototype.setUrl = function(url) {
    this.url_ = url;
  };
  Socket.prototype.setMessageHandler = function(messageHandler) {
    this.messageHandler_ = messageHandler;
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
    this.messageHandler_(e.data);
  };
  Socket.prototype.handleConnect_ = function() {
    this.connected_ = true;
    this.resetBackoff_();
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
    }
  };
  return Socket;
});