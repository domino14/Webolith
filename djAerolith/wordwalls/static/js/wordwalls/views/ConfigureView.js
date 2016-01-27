/* global define, django*/
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
      'change #customTileOrdering': 'confChangeHandler',
      "click #savePrefs": "savePreferences"
    },
    initialize: function() {
      this.alphagramCollection = new Alphagrams();
      this.listenTo(this.alphagramCollection, 'add', this.addAlphagram);
      this.listenTo(this.model, 'change', this.render);
      this.alphagramCollection.add([{
        alphagram: 'ADEEMMO?',
        numWords: 2,
        wordsRemaining: 2
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
      this.$("#blankCharacter").val(this.model.get('blankCharacter'));
      this.$("#tileStyleSelect").val(this.model.get('tileSelection'));
      this.$('#customTileOrdering').val(this.model.get('customOrder'));
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
        'showBorders': this.$("#showBorders").prop("checked"),
        'blankCharacter': this.$("#blankCharacter").val(),
        'customOrder': this.$('#customTileOrdering').val().toUpperCase()
      });
      this.$("#tileStyleSelect").prop("disabled", !this.model.get('tilesOn'));
    },
    addAlphagram: function(alphagram) {
      var view = new AlphagramView({
        model: alphagram,
        viewConfig: this.model
      });
      this.$('#configQL').append(view.render().el);
    },
    savePreferences: function() {
      var saveResult;
      this.prefsInfo.html("");
      saveResult = this.model.save({}, {
        success: _.bind(function() {
          this.prefsInfo.html(
            django.gettext("Successfully saved preferences."));
        }, this),
        error: _.bind(function() {
          this.prefsInfo.html(django.gettext("There was an error"));
        }, this)
      });
      if (!saveResult) {
        // Failed validation.
        this.prefsInfo.html(this.model.validationError);
      }
    }
  });
  return ConfigureView;
});