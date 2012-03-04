var tableUrl, username;
var paper;
var grid;
// function initializeTable(tUrl, u, g)
// {
//     tableUrl = tUrl;
//     username = u;
//     grid = g;
//     drawBoard();
// }
// 
// function chatInputKeyHandler(event)
// {
//      
//   if(event.keyCode == 13)
//   {
//       var chatText = $(this).val();
//       if (chatText.length < 1) return;   // ignore
//       $(this).val("");
//       /* should post */
//       submitChat(chatText);
//   }
// }
// 
// function submitChat(chatText)
// {
//     $.post(tableUrl, {'chat': chatText},
//         function() {}, 'json');
// }

var tilesize = 28;
var lMarg = 100;
var tMarg = 80;
var radius = 1;

function drawBoard()
{
    paper = Raphael("gameBoard", 850, 650);
    drawGrid();
    var circleX = lMarg + 7.5 * tilesize;
    var circleY = tMarg + 7.5 * tilesize;
    var radius = 7.5 * 1.42* tilesize;
    paper.circle(circleX, circleY, radius).attr('stroke', '#aaa');
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

function drawGrid() {
    //var font = paper.getFont("Andika");

    var fontSize = 40; 
    console.log('gonna draw')
    for (i = 0; i < 15; i++)
    {
        for (j = 0; j < 15; j++)
        {
            var x = i*tilesize + lMarg;
            var y = j*tilesize + tMarg;
            var place = i * 15 + j;
            var r = paper.rect(x, y, tilesize, tilesize, radius).
                            attr({'fill': colors[griddy[place]], 'cursor': 'pointer'});
            //var letter = grid[j+7*i];
            /*paper.print(x + tilesize/4, y+tilesize/2, letter, font, fontSize).
                                    attr();  // left-align*/
          /*  paper.text(x + tilesize/2, y + tilesize/2, letter).
                    attr({'font-family': 'sans-serif', 
                            'font-size': fontSize, 'cursor': 'pointer'});*/

        }
    }
}

function drawTile() {
    var start = function () {
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        this.animate({r: 70, opacity: .25}, 500, ">");
    },
    move = function (dx, dy) {
        this.attr({cx: this.ox + dx, cy: this.oy + dy});
    },
    up = function () {
        this.animate({r: 50, opacity: .5}, 500, ">");
    };
    R.set(r, g, b, p).drag(move, start, up);
}