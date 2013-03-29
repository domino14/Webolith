/* global define*/
define([
  'backbone',
  'collections/Alphagrams',
  'views/AlphagramView',
  'underscore'
], function(Backbone, Alphagrams, AlphagramView, _) {
  "use strict";
  var ConfigureView;
  ConfigureView = Backbone.View.extend({
    events: {
      "change .configInput": "confChangeHandler",
      "click #savePrefs": "savePreferences"
    },
    initialize: function() {
      this.alphagramCollection = new Alphagrams();
      this.listenTo(this.alphagramCollection, 'add', this.addAlphagram);
      this.listenTo(this.model, 'change', this.render);
      this.alphagramCollection.add([{
        alphagram: 'ACNPRSYY',
        numWords: 1,
        wordsRemaining: 1
      }]);
      this.prefsInfo = this.$("#prefsInfo");
    },
    setCheckmark: function(searchStr, value, checkedValue) {
      this.$(searchStr).prop('checked', value === checkedValue);
    },
    render: function() {
      this.setCheckmark('#dontUseTiles', this.model.get('tilesOn'), false);
      this.setCheckmark('#useSans', this.model.get('font') === 'sans', true);
      this.setCheckmark('#tilesBold', this.model.get('bold'), true);

      this.setCheckmark('#dontShowTable', this.model.get('showTable'), false);
      this.setCheckmark('#dontShowCanvas', this.model.get('showCanvas'), false);
      this.setCheckmark('#showBorders', this.model.get('showBorders'), true);

      this.$("#tileStyleSelect").val(this.model.get('tileSelection'));
      this.$("#tileStyleSelect").prop("disabled", !this.model.get('tilesOn'));
    },
    confChangeHandler: function() {
      this.model.set({
        'tilesOn': !this.$("#dontUseTiles").prop("checked"),
        'font': this.$("#useSans").prop("checked") ? 'sans' : 'mono',
        'bold': this.$("#tilesBold").prop("checked"),
        'tileSelection': this.$("#tileStyleSelect option:selected").val(),
        'showTable': !this.$("#dontShowTable").prop("checked"),
        'showCanvas': !this.$("#dontShowCanvas").prop("checked"),
        'showBorders': this.$("#showBorders").prop("checked")
      });
      this.$("#tileStyleSelect").prop("disabled", !this.model.get('tilesOn'));
    },
    addAlphagram: function(alphagram) {
      var view = new AlphagramView({
        model: alphagram,
        viewConfig: this.model
      });
      /*
       * Re-render question when configuration changes.
       */
      this.$('#configQL').append(view.render().el);
    },
    savePreferences: function() {
      this.prefsInfo.html("");
      this.model.save({}, {
        success: _.bind(function() {
          this.prefsInfo.html("Successfully saved preferences.");
        }, this),
        error: _.bind(function() {
          this.prefsInfo.html("There was an error");
        }, this)
      });
    }
  });
  return ConfigureView;
});