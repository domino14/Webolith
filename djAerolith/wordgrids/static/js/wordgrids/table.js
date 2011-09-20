var tableUrl, username;
function initializeTable(tUrl, u)
{
    tableUrl = tUrl;
    username = u;
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
    // Creates canvas 320 × 200 at 10, 50

    var set = Raphael(["gameBoard", 320, 200, {
        type: "rect",
        x: 10,
        y: 10,
        width: 25,
        height: 25,
        stroke: "#f00"
    }, {
        type: "text",
        x: 30,
        y: 40,
        text: "Dump"
    }]);
}