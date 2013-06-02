/* global define*/
define([
  'jquery',
], function($) {
  var Utils, messageTextBoxLimit;
  messageTextBoxLimit = 3000; // Characters.
  Utils = {
    updateTextBox: function(message, textBoxId) {
      var $box, newMessage;
      $box = $('#' + textBoxId);
      newMessage = $box.html() + message + '<BR>';
      if (newMessage.length > messageTextBoxLimit) {
        newMessage = newMessage.substr(
          newMessage.length - messageTextBoxLimit);
      }
      $box.html(newMessage);
      $box.scrollTop($box[0].scrollHeight - $box.height());
    },
    clearTextBox: function(textBoxId) {
      $("#" + textBoxId).html("");
    }
  };

  return Utils;
});
