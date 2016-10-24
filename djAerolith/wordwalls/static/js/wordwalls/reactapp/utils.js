define ([
], function() {
  "use strict";
  return {
    /**
     * Take `str` which may contain symbols such as 1, 2, 3 and return
     * the string with the proper digraphs.
     * @param  {string} str
     * @return {string}
     */
    displaySpanishDigraphs: function(str) {
      return str.replace(/1/g, 'ᴄʜ').replace(/2/g, 'ʟʟ').replace(
        /3/g, 'ʀʀ');
    }

  };
});