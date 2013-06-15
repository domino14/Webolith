/* global define*/
define([
  'backbone',
  'jquery',
  'underscore'
], function(Backbone, $, _) {
  "use strict";
  var Configure, DEFAULT_BLANK_CHARACTER, DEFAULT_CUSTOM_ORDER;
  DEFAULT_BLANK_CHARACTER = '?';
  DEFAULT_CUSTOM_ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?';
  Configure = Backbone.Model.extend({
    defaults: function() {
      return {
        tilesOn: true,
        tileSelection: '1',
        font: 'mono',
        bold: false,
        showTable: true,
        showCanvas: true,
        showBorders: false,
        blankCharacter: DEFAULT_BLANK_CHARACTER,
        customOrder: DEFAULT_CUSTOM_ORDER
      };
    },
    validate: function(attrs) {
      var i;
      if (attrs.blankCharacter === "") {
        return [
          "You must enter a character to use for the blank. If you want ",
          "it to look empty, please enter a Space (with the spacebar)."
        ].join('');
      }
      /*
       * Check if all letters are contained in customOrder exactly once,
       * including the blank.
       */
      for (i = 0; i < DEFAULT_CUSTOM_ORDER.length; i++) {
        if (attrs.customOrder.indexOf(DEFAULT_CUSTOM_ORDER[i]) === -1) {
          return [
            "Your custom order is missing at least one letter: ",
            DEFAULT_CUSTOM_ORDER[i], "."
          ].join('');
        }
      }
    },
    /**
     * Maps server keys to a front-end model key.
     * @param  {string} topLevelKey    Top level is 'tc' or 'bc'.
     * @param  {string} secondLevelKey A sub-key like 'on' (for 'tc')
     * @return {string}                The name of the Backbone model attribute.
     */
    mapServerKeys: function(topLevelKey, secondLevelKey) {
      if (topLevelKey === 'tc') {
        return {
          'on': 'tilesOn',
          'selection': 'tileSelection',
          'font': 'font',
          'bold': 'bold',
          'blankCharacter': 'blankCharacter',
          'customOrder': 'customOrder'
        }[secondLevelKey];
      } else if (topLevelKey === 'bc') {
        return {
          'showTable': 'showTable',
          'showCanvas': 'showCanvas',
          'showBorders': 'showBorders'
        }[secondLevelKey];
      }
    },
    setConfig: function(params) {
      var styleObj, setObj;
      if (_.isUndefined(params) || _.isNull(params)) {
        params = {};
      } else {
        styleObj = $.parseJSON(params);
      }
      setObj = {};
      if (styleObj) {
        _.each(styleObj, function(dict, key) {
          _.each(dict, function(value, secondKey) {
            setObj[this.mapServerKeys(key, secondKey)] = value;
          }, this);
        }, this);
        this.set(setObj);
      }
    },
    url: '/wordwalls/api/configure/'
  });
  return Configure;
});