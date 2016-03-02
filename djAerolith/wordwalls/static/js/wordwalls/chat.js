/* global define, console*/
define([
  'underscore',
  'backbone',
  'json2',
  'utils',
  'text!templates/chat.html',
  'text!templates/chat_people.html',
  'mustache'
], function(_, Backbone, JSON, utils, ChatTemplate, PeopleTemplate, Mustache) {
  "use strict";
  var Chat;
  /**
   * A Chat view. Requires a chat bar to have class .chat-bar.
   * @type {Backbone.View}
   */
  Chat = Backbone.View.extend({
    initialize: function(options) {
      this.chatBar = this.$('.chat-bar');
      this.chatTextId = 'messages';
      this.peopleId = 'people';
      this.socket = options.socket;
      this.currentUsers = [];
    },
    events: function() {
      return {
        'keypress .chat-bar': 'chatBarHandler'
      };
    },
    messageHandler: function(data) {
      if (data.type === 'chat') {
        this.updateChat(data.from, data.data, this.chatTextId);
      } else if (data.type === 'error') {
        this.updateChat('Server error', data.data, this.chatTextId);
      } else if (data.type === 'joined') {
        this.addUsers(data.msg);
      } else if (data.type === 'left') {
        this.deleteUser(data.msg);
      }
    },
    chatBarHandler: function(e) {
      var msg, chat;
      if (e.keyCode === 13) {
        chat = this.chatBar.val();
        if (chat.length === 0) {
          return;
        }
        msg = {
          'type': 'chat',
          'data': chat
        };
        this.socket.send(msg);
        this.clearChatBar();
      }
    },
    clearChatBar: function() {
      this.chatBar.val("");
    },
    updateChat: function(from, msg, textBoxId) {
      var message = Mustache.render(ChatTemplate, {from: from, text: msg});
      utils.updateTextBox(message, textBoxId);
    },
    /**
     * Adds users to people list.
     * @param  {Array.<string>} usernames An array of usernames.
     */
    addUsers: function(usernames) {
      this.currentUsers = _.union(this.currentUsers, usernames);
      this.renderCurrentUsers();
    },
    /**
     * Deletes user from people list.
     * @param {string} username The username to delete.
     */
    deleteUser: function(username) {
      this.currentUsers = _.without(this.currentUsers, username);
      this.renderCurrentUsers();
    },
    /**
     * Renders list of users.
     */
    renderCurrentUsers: function() {
      utils.clearTextBox(this.peopleId);
      utils.updateTextBox(Mustache.render(PeopleTemplate, {
        users: this.currentUsers
      }), this.peopleId);
    }
  });

  return Chat;
});