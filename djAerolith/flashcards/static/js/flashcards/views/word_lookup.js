/* global JSON*/

define([
  'backbone',
  'jquery',
  'underscore'
], function(Backbone, $, _) {
  "use strict";
  var WordLookup, LOOKUP_WORDS_URL;
  LOOKUP_WORDS_URL = '/base/api/word_lookup';

  WordLookup = Backbone.View.extend({
    initialize: function() {
      this.spinner = $('#card-spinner');
    },
    events: {
      'click #word-lookup': 'lookupWord'
    },
    /**
     * Looks up a word by letters.
     */
    lookupWord: function() {
      var letters, lexicon;
      lexicon = $('#word-lookup-lexicon').val();
      letters = $('#word-lookup-letters').val();
      this.displaySpinner_(true);
      $.get(LOOKUP_WORDS_URL, {
        lexicon: lexicon,
        letters: letters
      }, _.bind(this.displayWordLookupResults, this), 'json').fail(
        _.bind(this.alertCallback, this));
    },
    alertCallback: function(jqXHR) {
      window.alert(jqXHR.responseJSON);
      this.displaySpinner_(false);
    },
    /**
     * Displays (or hides) the spinner.
     * @param {boolean} display
     * @private
     */
    displaySpinner_: function(display) {
      if (display) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    },

    displayWordLookupResults: function(results) {
      // Build up html
      var html = '';
      this.displaySpinner_(false);
      if (results.length === 0) {
        this.$('#lookup-results').html(
          '<span style="color: red;">No results found</span>');
        return;
      }
      results.sort();
      _.each(results, function(result) {
        html += result + '<BR>';
      });
      this.$('#lookup-results').html(html);
    }
  });


  return WordLookup;
});