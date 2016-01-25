/* global define */
define([
  'backbone',
  'jquery',
  'underscore',
  'text!templates/singleQuestion.html',
  'mustache',
  'jquery_ui'   /* Needed for disableSelection */
], function(Backbone, $, _, QuestionTemplate, Mustache) {
  "use strict";
  var AlphagramView;
  AlphagramView = Backbone.View.extend({
    /*
     * An alphagram view is the main question view.
     */
    tagName: 'li',
    className: 'qle',
    events: {
      'click': 'shuffle',
      'contextmenu': 'alphagram'
    },
    initialize: function(options) {
      var i, alphLength;
      this.listenTo(this.model, 'change', this.render);
      this.viewConfig = options.viewConfig;
      this.listenTo(this.viewConfig, 'change', this.changeConfig);
      /* Generate tile order. */
      this.tileOrder = [];
      alphLength = this.model.get('alphagram').length;
      for (i = 0; i < alphLength; i++) {
        this.tileOrder.push(i);
      }
      this.naturalTileOrder = _.clone(this.tileOrder);
      this.$el.disableSelection();
      this.tileSizeMap = {10: 14, 11: 13, 12: 12, 13: 11, 14: 10, 15: 9.5};
      /**
       * A memoized function to avoid recomputing the custom tile ordering
       * every time.
       * @param  {string} order   The custom tile ordering.
       * @return {Array.<number>} The actual tile ordering object.
       */
      this.customOrder_ = _.memoize(_.bind(function(order) {
        var lettersObj, i, letters;
        lettersObj = [];
        letters = this.model.get('alphagram');
        for (i = 0; i < letters.length; i++) {
          lettersObj.push({letter: letters[i], index: i});
        }
        lettersObj = _.sortBy(lettersObj, function(letterObj) {
          return order.indexOf(letterObj.letter);
        });
        return _.pluck(lettersObj, 'index');
      }, this));
    },
    changeConfig: function(configModel) {
      this.viewConfig = configModel;
      this.render();
    },
    configToClassText: function()
    {
      var text, tc;
      tc = this.viewConfig.attributes;
      text = "tile ";
      if (tc.tilesOn) {
        text += "tileon ";
        text += "tile" + tc.tileSelection + " ";
      } else {
        text += "tileoff ";
      }
      if (tc.font === "mono") {
        text += "tilemono ";
      } else if (tc.font === "sans") {
        text += "tilesans ";
      }
      if (tc.bold) {
        text += "tilebold";
      }
      return text;
    },
    /**
     * Transforms a letter to display as something else, optionally.
     * @param  {string} letter A letter.
     * @return {string}        The transformed tile character string.
     */
    transformLetter: function(letter) {
      var blankCharacter;
      // Do Spanish transformations.
      if (letter === '1') {
        letter = 'ᴄʜ';
      } else if (letter === '2') {
        letter = 'ʟʟ';
      } else if (letter === '3') {
        letter = 'ʀʀ';
      } else if (letter === 'Ñ') {
        letter = 'ñ';
      }
      if (letter !== '?') {
        return letter;
      }
      blankCharacter = this.viewConfig.attributes.blankCharacter;
      if (blankCharacter === ' ') {
        blankCharacter = '&nbsp;';
      }
      return blankCharacter;
    },
    render: function() {
      var context, tiles, tilesContext, i, tcText, alphagramLength, tileSize;
      if (this.viewConfig.attributes.showBorders) {
        this.$el.addClass('borders');
        this.$el.removeClass('noborders');
      } else {
        this.$el.addClass('noborders');
        this.$el.removeClass('borders');
      }
      tcText = this.configToClassText();
      tiles = this.model.get('alphagram').split('');
      tilesContext = [];
      for (i = 0; i < tiles.length; i++) {
        tilesContext.push({
          'tcText': tcText,
          'letter': this.transformLetter(tiles[this.tileOrder[i]])
        });
      }
      context = {
        'wordsRemaining': this.model.get('wordsRemaining'),
        'wordsRemainingMax': Math.min(this.model.get('wordsRemaining'), 9),
        'tiles': tilesContext
      };
      this.$el.html(Mustache.render(QuestionTemplate, context));
      alphagramLength = this.model.get('alphagram').length;
      if (alphagramLength > 9) {
        tileSize = this.tileSizeMap[alphagramLength];
        this.$el.find('.tile').css({
          'width': tileSize + 'px',
          'height': tileSize + 'px',
          'line-height': tileSize + 'px',
          'font-size': tileSize * 10 + '%'
        });
      }
      return this;
    },
    shuffle: function() {
      this.shuffleList(this.tileOrder);
      this.render();
    },
    alphagram: function() {
      this.tileOrder = _.clone(this.naturalTileOrder);
      this.render();
    },
    customOrder: function() {
      this.tileOrder = _.clone(
        this.customOrder_(this.viewConfig.get('customOrder')));
      this.render();
    },
    shuffleList: function(list) {
      var i, j, t;
      for (i = 1; i < list.length; i++) {
        j = Math.floor(Math.random() * (1 + i));  // choose j in [0..i]
        if (j !== i) {
          t = list[i];                        // swap list[i] and list[j]
          list[i] = list[j];
          list[j] = t;
        }
      }
    }
  });
  return AlphagramView;
});