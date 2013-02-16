WW.Word.Model = Backbone.Model.extend({
  defaults: function() {
    return {
      word: null,
      definition: null,
      frontHooks: null,
      backHooks: null,
      lexiconSymbol: null
    }
  }
});

WW.Word.Collection = Backbone.Collection.extend({
  model: WW.Word.Model
});

WW.Alphagram.Model = Backbone.Model.extend({
  defaults: function() {
    return {
      alphagram: '',
      words: null,   /* Will be an instance of a Word Collection. */
      numWords: 0
    }
  }
});

WW.Alphagram.Collection = Backbone.Collection.extend({
  model: WW.Alphagram.Model
});