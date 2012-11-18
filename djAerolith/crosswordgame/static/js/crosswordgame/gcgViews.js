var App = (function(Backbone, $) {
  "use strict";
  var tableUrl, username;
  var paper;
  var grid;
  var BoardView;

  var tilesize = 28;
  var lMarg = 0;
  var tMarg = 0;
  var radius = 0;

  function _drawBoard()
  {
      paper = Raphael("gameBoard", 450, 450);
      _drawGrid();
  }

  // 4 3 2 word scores
  // . space
  // $ # @ letter scores

  var griddy =  "3..@...3...@..3" +
                ".2...#...#...2." +
                "..2...@.@...2.." +
                "@..2...@...2..@" +
                "....2.....2...." +
                ".#...#...#...#." +
                "..@...@.@...@.." +
                "3..@...2...@..3" +
                "..@...@.@...@.." +
                ".#...#...#...#." +
                "....2.....2...." +
                "@..2...@...2..@" +
                "..2...@.@...2.." +
                ".2...#...#...2." +
                "3..@...3...@..3"

  var colors = {'3': "#ff2200",
              '2': "#ff99aa",
              '@': "#87ceeb",
              '#': "#0022ff",
              '.': "#fafffa"}

  function _drawGrid() {
      //var font = paper.getFont("Andika");

      var fontSize = 40;
      var i, j;
      console.log('gonna draw')
      for (i = 0; i < 15; i++)
      {
          for (j = 0; j < 15; j++)
          {
              var x = i*tilesize + lMarg;
              var y = j*tilesize + tMarg;
              var place = i * 15 + j;
              var r = paper.rect(x, y, tilesize, tilesize, radius).
                              attr({'fill': colors[griddy[place]],
                                    'cursor': 'pointer',
                                    'stroke': '#777777'});
              //var letter = grid[j+7*i];
              /*paper.print(x + tilesize/4, y+tilesize/2, letter, font, fontSize).
                                      attr();  // left-align*/
            /*  paper.text(x + tilesize/2, y + tilesize/2, letter).
                      attr({'font-family': 'sans-serif',
                              'font-size': fontSize, 'cursor': 'pointer'});*/

          }
      }
  }

  function _drawTile(i, j, tile) {
      var x = i * tilesize + lMarg + 2;
      var y = j * tilesize + tMarg + 2;
      var place = i * 15 + j;
      var centerX = i * tilesize + lMarg + (tilesize / 2);
      var centerY = j * tilesize + tMarg + (tilesize/2);

      paper.rect(x, y, tilesize - 4, tilesize - 4, 0).
                attr({'fill': '#ffffff',
                          'stroke': '#000000',
                          'stroke-width': 0.5});

      paper.text(centerX, centerY, tile).attr({'font-size': 20,
                                              'fill': '#000000',
                                               'font-family': 'monospace'});
  }

  var MoveListView = Backbone.View.extend({
    initialize: function() {

    },

    render: function() {
      var json = this.model.toJSON();
      console.log('rendering', json)
      this.$el.html(['<P>', json.player, ': ', json.coordinates,
                     ' ', json.play, ' ',
                     json.score > 0 ? '+' + json.score : json.score,
                     ' ', json.totalscore, '</P>'].join(''));
      return this;
    }

  });

  BoardView = Backbone.View.extend({
    events: {
        "click #back": "goBack",
        "click #forward": "goForward"
    },

    initialize: function () {
      // bind to relevant events in Moves Collection
      console.log('collection', this.collection)
      console.log('collection.on', this.collection.on)
      this.collection.on('reset', this.addAllMoves, this);
      this.collection.on('reset', this.render, this);
    },

    addOneMove: function (move) {
      // add order
      var firstPlayer = this.collection.at(0).get('player');
      var order;
      if (move.get('player') === firstPlayer) {
        order = 1;
      }
      else {
        order = 2;
      }
      var view = new MoveListView({model: move});
      $("#player" + order + "moves").append(view.render().el);
    },

    addAllMoves: function (move) {
        this.collection.each(this.addOneMove, this);
    },

    render: function () {
      console.log('rendering')
      _drawBoard();
    },

    goBack: function() {},

    goForward: function() {}
  });


  function _init(gameDescription) {
    var Game, Moves, Board;
    Game = new GCGame();
    Game.set(gameDescription);
    Moves = new GCGameEventList();
    console.log('Moves', Moves);
    Board = new BoardView({collection: Moves});
    Moves.reset(gameDescription.moves);
  }

  return {
    'init': _init,
  }
})(Backbone, jQuery);
