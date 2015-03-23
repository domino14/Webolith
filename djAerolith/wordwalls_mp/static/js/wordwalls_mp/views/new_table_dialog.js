/**
 * @fileOverview A dialog for creating a new table.
 */
define([
  'backbone',
  'underscore',
  'jquery',
  'mustache',
  'text!templates/new_table_dialog.html'
], function(Backbone, _, $, Mustache, NewTableTemplate) {
  "use strict";
  var NewTableDialog;
  NewTableDialog = Backbone.View.extend({
    initialize: function() {
      /**
       * A template for a select field.
       * @type {string}
       */
      this.$modalBody = this.$('.modal-body');
    },
    events: {
      'change #lexicon-selection': 'fetchLists',
      'click .create-table': 'createTable'
    },
    render: function() {
      this.$modalBody.html(Mustache.render(NewTableTemplate));
      this.$('#lexicon-selection').change();
      return this;
    },
    fetchLists: function() {
      this.fetchNamedLists();
    },
    /**
     * Send a signal to create a new table.
     */
    createTable: function() {
      var triggerObj;
      triggerObj = {};
      triggerObj.listType = this.$('ul.list-select li.active').children(
        'a').data('listtype');
      triggerObj.lexicon = this.$('#lexicon-selection').val();
      if (triggerObj.listType === 'namedLists') {
        triggerObj.listId = this.$('#id_namedList').val();
      }
      this.trigger('createTable', triggerObj);

    },
    /**
     * Fetch the Aerolith default user lists and populate the select.
     */
    fetchNamedLists: function() {
      $.get('/wordwalls_mp/api/named_lists/', {
        'lexicon': this.$('#lexicon-selection').val()
      }, _.bind(this.populateListSelect, this, this.$('#id_namedList')),
      'json');
    },
    /**
     * Populates the element with the lists.
     * @param  {Element} $element
     * @param  {Array.<Object>} lists
     */
    populateListSelect: function($element, lists) {
      _.each(lists, function(list) {
        var option;
        option = $('<option/>', {
          'value': list.id
        }).text(list.name);
        $element.append(option);
      });
    }
  });

  return NewTableDialog;
});