/**
 * @fileOverview A controller for socket communications. We will use Firebase
 * for this.
 */
define([
  'backbone',
  'underscore',
  'firebase'
], function(Backbone, _, Firebase) {
  "use strict";
  var CommController, CCP;
  /**
   * Initialize controller with Firebase parameters.
   */
  CommController = function(token, url) {
    this.firebaseURL = url;
    this.firebaseToken = token;
    this.firebaseRef = new Firebase(url);
    this.firebaseRef.authWithCustomToken(token, this.authHandler);
  };
  CCP = CommController.prototype;

  CCP.authHandler = function(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
    }
  };
  _.extend(CommController, Backbone.Events);
  return CommController;
});