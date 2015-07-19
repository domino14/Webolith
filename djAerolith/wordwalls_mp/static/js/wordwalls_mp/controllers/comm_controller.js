/**
 * @fileOverview A controller for socket communications. We will use Firebase
 * for this.
 */
define([
  'backbone',
  'underscore',
  'firebase',
  'firechat'
], function(Backbone, _, Firebase, Firechat) {
  "use strict";
  var CommController, CCP;
  /**
   * Initialize controller with Firebase parameters.
   */
  CommController = function(token, url) {
    this.firebaseURL = url;
    this.firebaseToken = token;
    this.firebaseRef = new Firebase(url);
    this.chat_ = new Firechat(this.firebaseRef);
    this.firebaseRef.authWithCustomToken(token, _.bind(this.authHandler, this));
    //this.firebaseRef.onAuth(_.bind(this.onAuth, this));
  };
  CCP = CommController.prototype;

  CCP.authHandler = function(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log('authData', authData)
      this.chat_.setUser(authData.auth.uid, authData.auth.username, _.bind(
      function(user) {
        this.user = user;
        console.log('set User', this.user)
    }, this));
    }
  };
  // XXX: why can't I use authHandler above?
  // CCP.onAuth = function(authData) {
  //   this.chat_.setUser(authData.auth.uid, authData.auth.username, _.bind(
  //     function(user) {
  //       this.user = user;
  //   }, this));
  // };
  _.extend(CommController, Backbone.Events);
  return CommController;
});