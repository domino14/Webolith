/*Aerolith 2.0: A web-based word game website
Copyright (C) 2011 Cesar Del Solar
 
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
 
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
 
You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

To contact the author, please email delsolar at gmail dot com*/
// global questions object
var qObj = null;
var CallInterval = 5000;
var IntervalID = 0;
var tableUrl = "";
var username = "";
var csrf_token = "";
var gameGoing = false;  
var currentTimer = 0;
var questionLocationHash = {};
var wrongWordsHash = {};
var wrongAlphasHash = {};
var gameTimerID;
var challenge = false;
var tileSizeMap = {10: 14, 11: 13, 12: 12, 13: 11, 14: 10, 15: 9.5}
var unsavedChanges = false;
var autoSave = false;
var addParams = null;
var defaultTileClass = {on: true, font: 'mono', selection: '1', bold: false}; //"tile tileon tilemono tile1";
var defaultBackgroundClass = {showTable: true, showCanvas: true, showBorders: false};
var tileClass = null;
var backgroundClass = null;
var quizzingOnMissed = false;
var quizOverForever = false;
var numTotalAnswersThisRound = 0;
var numAnswersGottenThisRound = 0;
var messageTextBoxLimit = 3000; // characters

function disableSelection(target)
{
    if (typeof target.onselectstart!="undefined") //IE route
    {
	    target.onselectstart=function(){return false}
    }
    else if (typeof target.style.MozUserSelect!="undefined")
    { //Firefox route
	    target.style.MozUserSelect="none"
    }
    else //All other route (ie: Opera)
    {
	    target.onmousedown=function(){return false}
    }
    target.style.cursor = "default"
}

function updateTextBox(message, textBoxId)
{
    var box = $('#' + textBoxId);
    var newMessage = box.html() + message + '<BR>';
    if (newMessage.length > messageTextBoxLimit)
    {
        newMessage = newMessage.substr(newMessage.length - messageTextBoxLimit);
    }
    box.html(newMessage);
    box.scrollTop(box[0].scrollHeight - box.height());
}


function updateMessages(message)
{
    updateTextBox(message, 'messages');
}

function updateGuesses(guess)
{
    updateTextBox(guess, 'guesses');
}

function updateCorrectAnswer(answer)
{
    updateTextBox(answer, 'correctAnswers');
}

function initializeTable(tUrl, u, params)
{
    tableUrl = tUrl;
    username = u;
    addParams = $.parseJSON(params);
    tileClass = defaultTileClass;
    backgroundClass = defaultBackgroundClass;
    if (addParams)
    {
        if('saveName' in addParams)
        {
            $('#saveListName').val(addParams['saveName']);
            autoSave = true;
            updateMessages("Autosave is on! Aerolith will save your list progress at the end of every round.");
        }
        if ('style' in addParams)
        {
            styleObj = $.parseJSON(addParams['style']);
            tileClass = styleObj.tc;
            backgroundClass = styleObj.bc;
        }

    }
    setPrefSelections();
    
    dontUseTilesChangeHandler();
    useSansHandler();
    tilesBoldHandler();

    tileStyleSelectHandler();
    showBordersHandler();    
    dontShowTableHandler();
    dontShowCanvasHandler();
    
}

function tileClassToText(tc)
{
    var text = "tile ";
    if (tc.on)
    {
        text += "tileon ";
        text += "tile" + tc.selection + " ";
    }
    else
    {
        text += "tileoff ";
    }    
    if (tc.font == "mono")
        text += "tilemono ";
    else if (tc.font == "sans")
        text += "tilesans ";
    
    if (tc.bold)
    {
        text += "tilebold";
    }
    
    return text;
}

function processQuestionObj(questionObj)
{
    qObj = questionObj;
    var ulBuilder = '<ul class="questionList"><tr>';
    questionLocationHash = {};
    wrongWordsHash = {};
    wrongAlphasHash = {};

    var tcText = tileClassToText(tileClass);
    numTotalAnswersThisRound = 0;
    numAnswersGottenThisRound = 0;
    
    /* populate solutions table*/
    var solutionsTableBuilder = '<table id="solutionsTable"><tr class="header"><td>Prob</td><td>Alphagram</td><td>Rating</td>';
    solutionsTableBuilder += '<td>\<</td><td>Word</td><td>\></td><td>Definition</td></tr>';
    
    // solutions table should be populated 'vertically', i.e. with qindices 0, 4, 8, ..., 1, 5, 9, ...
    // build solTableOrder array (to flip horizontal to vertical)

    var solTableOrder = []
    var x = 0;
    var els = 0;
    while (true) {
        var val = 52 * Math.floor(x/52.0) + (Math.floor( (x%52)/13.0) + 4 * (x%13));
        if (val >= qObj.length) {
            x++;
            if (els == qObj.length) {
                break;
            }
            else {
                continue;
            }
        }
        x++;
        els++;
        solTableOrder.push(val);
        if (els == qObj.length) {
            break;
        }
    }

    for (var x = 0; x < qObj.length; x++)
    {

        var i = solTableOrder[x];
        if (i < qObj.length)
        {
            var alphagram = qObj[i]['a'];
            var words = qObj[i]['ws'];
            var numWords = words.length;
            for (var j = 0; j < numWords; j++)
            {
                if (j == 0)
                {
                    solutionsTableBuilder += '<tr><td>' + qObj[i]['p'] + '</td><td class = "alphagramCell" id="a_' + alphagram + '">';
                    solutionsTableBuilder += alphagram;
                    solutionsTableBuilder += '<td class="starcell" id="r_' + alphagram + '">'; 
                    solutionsTableBuilder += '<div id="sw' + i + '" class="starwrapper">';
                    for (var k = 0; k < 5; k++)
                        solutionsTableBuilder += '<input name="star' +i + '" type="radio" value="' + (k+1) + '"/>';
                    
                    solutionsTableBuilder += '</div></td>';
                }
                else
                    solutionsTableBuilder += '<tr><td></td><td></td><td></td>';    // an empty probability & alphagram & star cell
            
                var word = words[j]['w'];
                solutionsTableBuilder += '<td class="frontHooksCell">' + words[j]['fh'] + '</td>';   // front hooks
                solutionsTableBuilder += '<td class="solutionCell" id="s_' + word + '">' + word + words[j]['s'] + '</td>';    // word + lex symbols
                solutionsTableBuilder += '<td class="backHooksCell">' + words[j]['bh'] + '</td>';   // back hooks
                solutionsTableBuilder += '<td>' + words[j]['d'] + '</td>';  // definition
                solutionsTableBuilder += '</tr>';
            }
        }
    }
    solutionsTableBuilder += '</table>';
    
    /* populate questions UL */
    
    for (var i = 0; i < 50; i++)
    {
        var cellStr = "q" + i;
        ulBuilder += '<li id="' + cellStr + '" class="qle">';
        if (i < qObj.length)
        {
            var alphagram = qObj[i]['a'];
            var words = qObj[i]['ws'];
            var numWords = words.length;
            ulBuilder += '<span class="chip chip' + Math.min(numWords, 9) + '">' + numWords + "</span> ";
            ulBuilder += '<span class="tiles">';
            qObj[i]['ahtml'] = '';
            for (var j = 0; j < alphagram.length; j++)
            {
                ulBuilder += '<span class="' + tcText + '">' + alphagram.charAt(j) + '</span>';
                qObj[i]['ahtml'] += '<span class="' + tcText + '">' + alphagram.charAt(j) + '</span>';
            }
            ulBuilder += '</span>';
            questionLocationHash[alphagram] = i;
            
            for (var j = 0; j < numWords; j++)
            {
                // let's populate the correct words hash (for keeping track of missed questions for display purposes client-side)
                var word = words[j]['w'];
                wrongWordsHash[word] = true;     
                numTotalAnswersThisRound++;  
            }
            wrongAlphasHash[alphagram] = true;     
        }
        ulBuilder += '</li>';
    }
    ulBuilder += '</ul>';
    
    $("#questions").html(ulBuilder);
    var qlistLIs = $(".qle");
    for (var i = 0; i < 50; i++)
        disableSelection(qlistLIs[i]);
    $("#defs_popup_content").html(solutionsTableBuilder + "<BR>")
    $("#defs_popup_content").css({'visibility': 'hidden'});
    /* change tile sizes depending on length of alphagram */
    for (var i = 0; i < 50; i++)
    {
        var cellSelector = "#q" + i;
        if (i < qObj.length)    // start shrinking tiles
        {
            var alphagram = qObj[i]['a'];
            if (alphagram.length > 9)
            {
                tileSize = tileSizeMap[alphagram.length];
                var tileCssObj = {'width': tileSize + 'px', 
                                'height': tileSize +'px', 
                                'line-height': tileSize + 'px', 
                                'font-size':tileSize*10 + '%'};            
                $(cellSelector + " > span.tiles > span.tile").css(tileCssObj);
            }
           // $("#" + cellStr + " > span.chip").css(tileCssObj);
        
        }
        $(cellSelector).bind('click', {cell: i}, cellClickHandler);

        
    }
    // setup event handlers, etc.
    //IntervalID = setInterval(callServer, CallInterval);

    showBordersHandler();
    $('#pointsLabelFraction').text('0/'+numTotalAnswersThisRound);
    $('#pointsLabelPercent').text('0%');
    $('#correctAnswers').html("");
    $('.starwrapper').stars();
    
    /* hide the stars for now -- use later */
    $('#solutionsTable td:nth-child(3)').hide();
}

function requestStart()
{
    $("#guessText").focus();
    $.post(tableUrl, {action: "start"}, 
        processStartData, 
        'json');
}

function processStartData(data)
{
    if (!gameGoing)
    {
        if ('serverMsg' in data)
        {
            updateMessages(data['serverMsg']);
            if (data['serverMsg'].indexOf('missed') != -1)
                quizzingOnMissed = true;
            else
                quizzingOnMissed = false;
            
        }
        if ('error' in data)
        {
            updateMessages(data['error']);
            if (data['error'].indexOf('nice day') != -1)
                quizOverForever = true;
        }
            
        if ('questions' in data)
        {
            processQuestionObj(data['questions']);
        }
        if ('time' in data)
        {
            currentTimer = data['time'] + 1;   // +1 since we're about to call this function
            gameTimerID = window.setInterval(updateTimer, 1000);
            updateTimer();  // call it now too
            gameGoing = true;
        }
        if ('gameType' in data)
        {
            if (data['gameType'] == 'challenge')    challenge = true;
            else challenge = false;
        }
    }
}

function giveUp()
{
    $.post(tableUrl, {action: "giveUp"},
        processGiveUp, 'json');
}

function processGiveUp(data)
{
    if ('g' in data)
    {
        if (!data['g'])
        {
            // quiz is not going anymore!
            processQuizEnded();
        }
    }
}

function updateTimer()
{
    currentTimer--;
    var mins = Math.floor(currentTimer / 60);
    var secs = currentTimer % 60;
    var pad = "";
    if (secs < 10) pad = "0"; 
    $("#gameTimer").text(mins + ":" + pad + secs);
    if (currentTimer == 0)
    {
        window.clearInterval(gameTimerID); 
        $.post(tableUrl, {action: "gameEnded"}, function(data)
        {
            if ('g' in data)
            {
                if (!data['g'])
                    processTimerRanOut();
            }
            
        }, 'json');
    }
}

function submitGuess(guessText)
{
    var ucGuess = guessText.toUpperCase();
    $.post(tableUrl, {action: "guess", guess: guessText},
            function(data)
            {
                if ('C' in data)
                {
                    if (data['C'] != "")
                    {
                        var loc = questionLocationHash[data['C']];  // data['C'] contains the alphagram of the correct response
                        var cellStr = "#q" + loc;
                        var chipStr = cellStr + ">" + "span.chip";    
                        var numRem = $(chipStr).text();
                        numRem--;
                    
                        if (numRem == 0)
                        {
                            $(cellStr).text("");
                            delete wrongAlphasHash[data['C']];  // this alphagram is not wrong since we solved it
                        }
                        else
                        {
                            $(chipStr).replaceWith('<span class="chip chip' + Math.min(numRem, 9) + '">' + numRem + '</span>');
                        }
                        delete wrongWordsHash[ucGuess];
                        updateCorrectAnswer(ucGuess);
                        numAnswersGottenThisRound++;
                        $('#pointsLabelFraction').text(numAnswersGottenThisRound + '/' + numTotalAnswersThisRound);
                        $('#pointsLabelPercent').text((numAnswersGottenThisRound / numTotalAnswersThisRound * 100).toFixed(1) 
                                                        + '%');
                    }                    
                    updateGuesses(ucGuess);
                    

                }                    
                if ('g' in data)
                {
                    if (!data['g'])
                    {
                        // quiz is not going anymore!
                        processQuizEnded();
                    }
                } 
            },
            'json');
}

function textBoxKeyHandler(event)
{
     
  if(event.keyCode == 13)
  {
      var guessText = $(this).val();
      if (guessText.length < 2 || guessText.length > 15) return;   // ignore
      $(this).val("");
      /* should post */
      submitGuess(guessText);
  }
  if (event.keyCode == 49)  /* 1 */
  {
      shuffle();
      event.preventDefault();   // doesn't work on firefox!
  }
  if (event.keyCode == 50)
  {
      alphagram();
      event.preventDefault();   // this doesn't work on firefox!
  }
  
}

function processTimerRanOut()
{
    processQuizEnded();
}

function processQuizEnded()
{
    if (gameGoing)
    {
        $("#questions").html(""); // clear the table
        $("#gameTimer").text("0:00");   // set the timer display to 0
        window.clearInterval(gameTimerID);  // and stop the timer
        if (challenge)  // only when the challenge is done and not its missed lists.
        {
            updateMessages("The challenge has ended!");
            $.post(tableUrl, {action: "getDcData"}, 
                function(data){
                    processDcResults(data, "addlInfo_content");
                }, 'json');
            updateMessages('Click <a onClick="showAddlInfo()" class="softLink">here</a> to see current results for this challenge.');
        }
        if (autoSave)
        {
            // send save again
            saveGame();
        }
        else
            updateMessages("Autosave is NOT on. To save your progress, type in a name for this list next to the Save button, and click Save.");
        /* highlight all the missed words */
        for (var wrongWord in wrongWordsHash)
        {
            $('#s_' + wrongWord).css({'color': 'red'});
        }
        for (var wrongAlpha in wrongAlphasHash)
        {
            $('#a_' + wrongAlpha).css({'color': 'red'});
        }
    
    
        $("#defs_popup_content").css({'visibility': 'visible'});
        gameGoing = false;
    }
}

function showAddlInfo()
{
	$('#addlInfo_popup').fadeIn();
	
	//Define margin for center alignment (vertical + horizontal) - we add 80 to the height/width to accomodate for the padding + border width defined in the css
	var popMargTop = ($('#addlInfo_popup').height() + 80) / 2;
	var popMargLeft = ($('#addlInfo_popup').width() + 80) / 2;
	
	//Apply Margin to Popup
	$('#addlInfo_popup').css({ 
		'margin-top' : -popMargTop,
		'margin-left' : -popMargLeft
	});
	
	//Fade in Background
	$('#fade').fadeIn(); //Fade in the fade layer 
	
//	return false;
}

function saveGame()
{
    var text = $("#saveListName").val();
    if (!text)
    {
        updateMessages("You must enter a list name for saving!");
    }
    else
    {
        $.post(tableUrl, {action: "save", listname: text},
                function(data) {
                    if ('success' in data)
                    {
                        if (data['success'])
                        {
                            updateMessages("Saved as " + text);
                            if (autoSave == false)
                            {
                                updateMessages("Autosave is now on! Aerolith will save your list progress at the end of " +
                                "every round.");
                                autoSave = true;
                            }
                        }
                    }
                    if ('info' in data)
                    {
                        updateMessages(data['info']);
                    }
                    
                    
                }, 'json');
        
    }
}

function cellClickHandler(event)
{
    var cellIndex = event.data.cell;
    shuffleSingleCell(cellIndex);
    
    var sel;
    if(document.selection && document.selection.empty)
    {
        document.selection.empty();
    } 
    else if(window.getSelection) 
    {
        sel=window.getSelection();
        if (sel && sel.removeAllRanges)
            sel.removeAllRanges();
    }
    $("#guessText").focus();
}

function shuffle()
{
    $("#guessText").focus();
    // cellIndex varies from 0 to 49 inclusive (maybe more in the future)
    for (var i = 0; i < 50; i++)
        shuffleSingleCell(i);
}

function shuffleSingleCell(cellIndex)
{
    var selector = $('#q' + cellIndex + ' > span.tiles > span[class^="tile"]');
    shuffleList(selector);
    $('#q' + cellIndex + ' > span.tiles').html(selector);
}

function alphagram()
{
    $("#guessText").focus();
    for (var i = 0; i < 50; i++)
    {
        if (i < qObj.length)
        {
            $('#q' + i + ' > span.tiles').html(qObj[i]['ahtml']);
        }
    }
    $(".tile").removeClass().addClass(tileClassToText(tileClass));  
}

//shuffles list in-place (from dtm.livejournal.com/38725.html)
function shuffleList(list) 
{
  var i, j, t;
  for (i = 1; i < list.length; i++) {
    j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
    if (j != i) {
      t = list[i];                        // swap list[i] and list[j]
      list[i] = list[j];
      list[j] = t;
    }
  }
}

function showSolutions()
{
	$('#definitions_popup').fadeIn();
	
	//Define margin for center alignment (vertical + horizontal) - we add 80 to the height/width to accomodate for the padding + border width defined in the css
	var popMargTop = ($('#definitions_popup').height() + 80) / 2;
	var popMargLeft = ($('#definitions_popup').width() + 80) / 2;
	
	//Apply Margin to Popup
	$('#definitions_popup').css({ 
		'margin-top' : -popMargTop,
		'margin-left' : -popMargLeft
	});
	
	//Fade in Background
	$('#fade').fadeIn(); //Fade in the fade layer 
	
//	return false;
}

function customize()
{
    $('#customize_popup').fadeIn();
    var popMargTop = ($('#customize_popup').height() + 80) / 2;
	var popMargLeft = ($('#customize_popup').width() + 80) / 2;
	
	//Apply Margin to Popup
	$('#customize_popup').css({ 
		'margin-top' : -popMargTop,
		'margin-left' : -popMargLeft
	});
	
	// do not fade in background!
//	$('#fade').fadeIn().css({}); //Fade in the fade layer
}

function setupPopupEvent()
{
    // setup definition popup event
    //Close Popups and Fade Layer
    $('img.btn_close, #fade').live('click', function() 
    { //When clicking on the close or fade layer...
      	$('#fade , .popup_block').fadeOut();
    	return false;
    });
}

function dontUseTilesChangeHandler()
{
    if($("#dontUseTiles").prop("checked"))
    {
      
        tileClass.on = false;
        $("#tileStyleSelect").prop("disabled", true);
    }
    else
    {
        tileClass.on = true;       
        $("#tileStyleSelect").prop("disabled", false);
    }
    $(".tile").removeClass().addClass(tileClassToText(tileClass));
}

function useSansHandler()
{
    if ($("#useSans").prop("checked"))
    {
        tileClass.font = 'sans';
    }
    else
    {
        tileClass.font = 'mono';
    }
    $(".tile").removeClass().addClass(tileClassToText(tileClass));
}

function tilesBoldHandler()
{
    if ($("#tilesBold").prop("checked"))
    {
        tileClass.bold = true;
    }
    else
    {
        tileClass.bold = false;
    }
    $(".tile").removeClass().addClass(tileClassToText(tileClass));
}

function tileStyleSelectHandler()
{
    tileClass.selection = $("#tileStyleSelect option:selected").val();
    $(".tile").removeClass().addClass(tileClassToText(tileClass));
}

function dontShowTableHandler()
{
    if ($("#dontShowTable").prop("checked"))
    {
        backgroundClass.showTable = false;
        $("#questions").removeClass();
    }
    else
    {
        backgroundClass.showTable = true;
        $("#questions").removeClass().addClass("tableBg");
    }
}

function dontShowCanvasHandler()
{
    if ($("#dontShowCanvas").prop("checked"))
    {
        backgroundClass.showCanvas = false;
        $("body").removeClass();
    }
    else
    {
        backgroundClass.showCanvas = true;
        $("body").removeClass().addClass("canvasBg");
    }
}

function showBordersHandler()
{
    if ($("#showBorders").prop("checked"))
    {
        backgroundClass.showBorders = true;
        $("li").removeClass().addClass("borders");
    }
    else
    {
        backgroundClass.showBorders = false;
        $("li").removeClass().addClass("noborders");
    }
}

function setIndividualCheckmark(searchStr, value, checkedValue)
{
    if (value == checkedValue)
    {
        $(searchStr).prop('checked', true);
    }
    else
        $(searchStr).prop('checked', false);
}

function setPrefSelections()
{
    setIndividualCheckmark('#dontUseTiles', tileClass.on, false);
    setIndividualCheckmark('#useSans', tileClass.font, "sans");
    setIndividualCheckmark('#tilesBold', tileClass.bold, true)
    
    setIndividualCheckmark('#dontShowTable', backgroundClass.showTable, false);
    setIndividualCheckmark('#dontShowCanvas', backgroundClass.showCanvas, false);
    setIndividualCheckmark('#showBorders', backgroundClass.showBorders, true);
    
    $("#tileStyleSelect").val(tileClass.selection);
    if (!tileClass.on)
        $("#tileStyleSelect").prop("disabled", true);
}

function savePrefs()
{
    var jsonPrefs = JSON.stringify({tc: tileClass, bc: backgroundClass});
    $.post(tableUrl, {action: "savePrefs", prefs: jsonPrefs},
               function(data)
               {
                   if (data['success'])
                        $("#prefsInfo").text("Your preferences have been saved.");
                   else
                        $("#prefsInfo").text("Unable to save preferences.");
               },
               'json');
    
    
}

function exit()
{
    window.location = "/wordwalls"; 
}

/* unload page event:

disabling refresh or back is not a good idea in general. to handle refresh/back as cleanly as possible, we must do a few things

- if autosave is on, the game should have been saved as soon as the quiz ended. no need to save again.
    - TODO what happens if the player leaves as the quiz saves?
- if the game is currently going on, the unloader should give up and save the game if autosave is on

it also seems that when closing the browser, sometimes it won't allow outgoing requests. Safari also does not seem to allow outgoing
requests at all on unload! 

so use $.ajax() with the "ASYNC : false" set (according to somebody -- need to test this on various browsers)

                    back        refresh         close tab       close browser
chrome (OSX):        yes        yes                 yes             yes
chrome (win): 
ff (win):            yes                                        seems no.. 
ff (osx):
safari (osx):       yes         yes             yes                 yes
ie (win):                                                           yes 
ff (linux):                                                         yes

opera doesn't work for this event :(

also use onbeforeunload:
http://stackoverflow.com/questions/4376596/jquery-unload-or-beforeunload


Note: windows chrome doesn't post on refresh?!
 */
 
function unloadEventHandler()
{
    if (gameGoing)
    {
        $.ajax({
           url: tableUrl,
           async: false,
           data: {action: "giveUpAndSave", 
                listname: $("#saveListName").val()},
           type: "POST" 
        });
    }
}
