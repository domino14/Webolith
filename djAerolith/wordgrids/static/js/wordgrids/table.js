var tableUrl, username;
var paper;
var grid;
function initializeTable(tUrl, u, g)
{
    tableUrl = tUrl;
    username = u;
    grid = g;
    drawBoard();
}

function chatInputKeyHandler(event)
{
     
  if(event.keyCode == 13)
  {
      var chatText = $(this).val();
      if (chatText.length < 1) return;   // ignore
      $(this).val("");
      /* should post */
      submitChat(chatText);
  }
}

function submitChat(chatText)
{
    $.post(tableUrl, {'chat': chatText},
        function() {}, 'json');
}

function drawBoard()
{
    paper = Raphael("gameBoard", 860, 400);
    drawGrid();
}

function drawGrid()
{
    var font = paper.getFont("Andika");
    var tilesize = 50;
    var lMarg = 100;
    var tMarg = 10;
    var radius = 10;
    var fontSize = 40;
    for (i = 0; i < 7; i++)
    {
        for (j = 0; j < 7; j++)
        {
            var x = i*tilesize + lMarg;
            var y = j*tilesize + tMarg;
            var r = paper.rect(x, y, tilesize, tilesize, radius).attr({'fill': '#A67D3D', 'cursor': 'pointer'});
            var letter = grid[j+7*i];
            /*paper.print(x + tilesize/4, y+tilesize/2, letter, font, fontSize).
                                    attr();  // left-align*/
            paper.text(x + tilesize/2, y + tilesize/2, letter).
                    attr({'font-family': 'sans-serif', 
                            'font-size': fontSize, 'cursor': 'pointer'});

        }
    }
    
}