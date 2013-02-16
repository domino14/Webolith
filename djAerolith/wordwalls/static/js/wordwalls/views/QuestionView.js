WW.Alphagram.View = Backbone.View.extend({
  /*
   * An alphagram view is the main question view.
   */
  tagName: 'li',
  initialize: function(options) {
    this.listenTo(this.model, 'change', this.render);
    this.viewConfig = options.viewConfig;
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
  render: function() {
    console.log('rendering')
    var context, tiles, tilesContext, i, tcText;
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
        'letter': tiles[i]
      });
    }
    context = {
      'cellStr': 'sampleCell',
      'numWords': this.model.get('numWords'),
      'tiles': tilesContext
    }
    this.$el.html(ich.singleQuestion(context));
    return this;
  }
});

