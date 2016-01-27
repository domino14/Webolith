/* global define*/
define([
  'jquery'
], function($) {
  "use strict";
  var Utils, messageTextBoxLimit, SPANISH_LEXICON;
  SPANISH_LEXICON = 'FISE09';
  messageTextBoxLimit = 3000; // Characters.
  Utils = {
    SPANISH_LEXICON: SPANISH_LEXICON,
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
    },
    /**
     * Modify a word like 1UN1U2OS to display like ᴄʜUNᴄʜUʟʟOS.
     * @param  {string} rawWord
     * @return {string}
     */
    modifyWordForDisplay: function(rawWord, lexicon) {
      if (lexicon !== SPANISH_LEXICON) {
        return rawWord;
      }
      rawWord = rawWord.replace(/1/g, 'ᴄʜ').replace(/2/g, 'ʟʟ').replace(
        /3/g, 'ʀʀ');
      return rawWord;
    }
  };

  return Utils;
});
