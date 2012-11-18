  var GCGame = Backbone.Model.extend({
  });

  var GCGameEvent = Backbone.Model.extend({
    initialize: function() {}
  });

  var GCGameEventList = Backbone.Collection.extend({
    model: GCGameEvent
  });
