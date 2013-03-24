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
//
//


// var WW = (function($, _, Backbone) {
//   var qObj = null;
//   var CallInterval = 5000;
//   var IntervalID = 0;
//   var tableUrl = "";
//   var username = "";
//   var csrf_token = "";
//   var gameGoing = false;
//   var currentTimer = 0;
//   var questionLocationHash = {};
//   var wrongWordsHash = {};
//   var wrongAlphasHash = {};
//   var gameTimerID;
//   var challenge = false;
//   var tileSizeMap = {10: 14, 11: 13, 12: 12, 13: 11, 14: 10, 15: 9.5};
//   var unsavedChanges = false;
//   var autoSave = false;
//   var addParams = null;
//   var defaultTileClass = {on: true, font: 'mono', selection: '1', bold: false};
//                           //"tile tileon tilemono tile1";
//   var defaultBackgroundClass = {showTable: true, showCanvas: true,
//                                 showBorders: false};
//   var tileClass = null;
//   var backgroundClass = null;
//   var quizzingOnMissed = false;
//   var quizOverForever = false;
//   var numTotalAnswersThisRound = 0;
//   var numAnswersGottenThisRound = 0;
//   var messageTextBoxLimit = 3000; // characters

//   var solTableOrder = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48,
//                        1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49,
//                        2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46,
//                        3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47];


//   function updateTextBox(message, textBoxId)
//   {
//       var box = $('#' + textBoxId);
//       var newMessage = box.html() + message + '<BR>';
//       if (newMessage.length > messageTextBoxLimit)
//       {
//           newMessage = newMessage.substr(newMessage.length - messageTextBoxLimit);
//       }
//       box.html(newMessage);
//       box.scrollTop(box[0].scrollHeight - box.height());
//   }


//   function updateMessages(message)
//   {
//       updateTextBox(message, 'messages');
//   }

//   function updateGuesses(guess)
//   {
//       updateTextBox(guess, 'guesses');
//   }

//   function updateCorrectAnswer(answer)
//   {
//       updateTextBox(answer, 'correctAnswers');
//   }

//   function tileClassToText(tc)
//   {
//       var text = "tile ";
//       if (tc.on)
//       {
//           text += "tileon ";
//           text += "tile" + tc.selection + " ";
//       }
//       else
//       {
//           text += "tileoff ";
//       }
//       if (tc.font == "mono")
//           text += "tilemono ";
//       else if (tc.font == "sans")
//           text += "tilesans ";

//       if (tc.bold)
//       {
//           text += "tilebold";
//       }

//       return text;
//   }

//   function processQuestionObj(questionObj)
//   {
//     var tcText, solutionsContext, x, i, j, solutionObj, words,
//       questionsContext, tempObj, alphagram;
//       qObj = questionObj;
//       questionLocationHash = {};
//       wrongWordsHash = {};
//       wrongAlphasHash = {};

//       tcText = tileClassToText(tileClass);
//       numTotalAnswersThisRound = 0;
//       numAnswersGottenThisRound = 0;

//       /*
//        * populate solutions table
//        * solutions table should be populated vertically
//        * i.e. qindices 0, 4, 8, ..., 1, 5, 9, ...
//        */

//       solutionsContext = {solutions: []};

//       for (x = 0; x < 50; x++) {
//         i = solTableOrder[x];
//         if (i < qObj.length) {
//           words = qObj[i]['ws'];
//           for (j = 0; j < words.length; j++) {
//             // for every word, add a new "solutionObj"
//             solutionObj = {};
//             if (j === 0) {
//               solutionObj.alphagram = qObj[i]['a'];
//               solutionObj.prob = qObj[i]['p'];
//             } else {
//               solutionObj.alphagram = null;
//               solutionObj.prob = "";
//             }
//             solutionObj.frontHooks = words[j]['fh'];
//             solutionObj.backHooks = words[j]['bh'];
//             solutionObj.word = words[j]['w'];
//             solutionObj.lexSymbol = words[j]['s'];
//             solutionObj.definition = words[j]['d'];
//             solutionsContext.solutions.push(solutionObj);
//           }
//         }
//       }

//       /* populate questions UL and relevant objects */
//       questionsContext = {questions: []};
//       for (i = 0; i < 50; i++) {
//         if (i < qObj.length) {
//           tempObj = {};
//           tempObj.cellStr = "q" + i;
//           words = qObj[i]['ws'];
//           alphagram = qObj[i]['a'];
//           tempObj.numWords = words.length;
//           qObj[i]['ahtml'] = '';
//           tempObj.tiles = [];
//           for (j = 0; j < alphagram.length; j++) {
//             tempObj.tiles.push({
//               tcText: tcText,
//               letter: alphagram.charAt(j)
//             });
//             qObj[i]['ahtml'] += '<span class="' + tcText + '">' +
//               alphagram.charAt(j) + '</span>';
//           }
//           questionsContext.questions.push(tempObj);

//           for (j = 0; j < tempObj.numWords; j++) {
//             /**
//              * let's populate the correct words hash (for keeping
//              * track of missed questions for display purposes
//              * client-side)
//              */
//             wrongWordsHash[words[j]['w']] = true;
//             numTotalAnswersThisRound++;
//           }
//           questionLocationHash[alphagram] = i;
//           wrongAlphasHash[alphagram] = true;

//         }
//       }

//       $("#questions").html(ich.questionList(questionsContext));
//       var qlistLIs = $(".qle");
//       for (i = 0; i < 50; i++) {
//         disableSelection(qlistLIs[i]);
//       }
//       $("#defs_popup_content").html(ich.solutionsTable(solutionsContext));
//       $("#defs_popup_content").css({'visibility': 'hidden'});
//       /* change tile sizes depending on length of alphagram */
//       for (i = 0; i < 50; i++)
//       {
//           var cellSelector = "#q" + i;
//           if (i < qObj.length)    // start shrinking tiles
//           {
//               var alphagram = qObj[i]['a'];
//               if (alphagram.length > 9)
//               {
//                   tileSize = tileSizeMap[alphagram.length];
//                   var tileCssObj = {'width': tileSize + 'px',
//                                   'height': tileSize +'px',
//                                   'line-height': tileSize + 'px',
//                                   'font-size':tileSize*10 + '%'};
//                   $(cellSelector + " > span.tiles > span.tile").css(tileCssObj);
//               }
//              // $("#" + cellStr + " > span.chip").css(tileCssObj);

//           }
//           $(cellSelector).bind('click', {cell: i}, cellClickHandler);


//       }
//       // setup event handlers, etc.
//       //IntervalID = setInterval(callServer, CallInterval);

//       showBordersHandler();
//       $('#pointsLabelFraction').text('0/'+numTotalAnswersThisRound);
//       $('#pointsLabelPercent').text('0%');
//       $('#correctAnswers').html("");
//   }

//   function processStartData(data)
//   {
//       if (!gameGoing)
//       {
//           if ('serverMsg' in data)
//           {
//               updateMessages(data['serverMsg']);
//               if (data['serverMsg'].indexOf('missed') != -1)
//                   quizzingOnMissed = true;
//               else
//                   quizzingOnMissed = false;

//           }
//           if ('error' in data)
//           {
//               updateMessages(data['error']);
//               if (data['error'].indexOf('nice day') != -1)
//                   quizOverForever = true;
//           }

//           if ('questions' in data)
//           {
//               processQuestionObj(data['questions']);
//           }
//           if ('time' in data)
//           {
//               currentTimer = data['time'] + 1;   // +1 since we're about to call this function
//               gameTimerID = window.setInterval(updateTimer, 1000);
//               updateTimer();  // call it now too
//               gameGoing = true;
//           }
//           if ('gameType' in data)
//           {
//               if (data['gameType'] == 'challenge')    challenge = true;
//               else challenge = false;
//           }
//       }
//   }

//   function processGiveUp(data)
//   {
//       if ('g' in data)
//       {
//           if (!data['g'])
//           {
//               // quiz is not going anymore!
//               processQuizEnded();
//           }
//       }
//   }

//   function updateTimer()
//   {
//       currentTimer--;
//       var mins = Math.floor(currentTimer / 60);
//       var secs = currentTimer % 60;
//       var pad = "";
//       if (secs < 10) pad = "0";
//       $("#gameTimer").text(mins + ":" + pad + secs);
//       if (currentTimer == 0)
//       {
//           window.clearInterval(gameTimerID);
//           $.post(tableUrl, {action: "gameEnded"}, function(data)
//           {
//               if ('g' in data)
//               {
//                   if (!data['g'])
//                       processTimerRanOut();
//               }

//           }, 'json');
//       }
//   }

//   function submitGuess(guessText)
//   {
//       var ucGuess = $.trim(guessText.toUpperCase());
//       $.post(tableUrl, {action: "guess", guess: guessText},
//               function(data)
//               {
//                   if ('C' in data)
//                   {
//                       if (data['C'] != "")
//                       {
//                           var loc = questionLocationHash[data['C']];  // data['C'] contains the alphagram of the correct response
//                           var cellStr = "#q" + loc;
//                           var chipStr = cellStr + ">" + "span.chip";
//                           var numRem = $(chipStr).text();
//                           numRem--;

//                           if (numRem == 0)
//                           {
//                               $(cellStr).text("");
//                               delete wrongAlphasHash[data['C']];  // this alphagram is not wrong since we solved it
//                           }
//                           else
//                           {
//                               $(chipStr).replaceWith('<span class="chip chip' + Math.min(numRem, 9) + '">' + numRem + '</span>');
//                           }
//                           delete wrongWordsHash[ucGuess];
//                           updateCorrectAnswer(ucGuess);
//                           numAnswersGottenThisRound++;
//                           var fractionText = numAnswersGottenThisRound + '/' + numTotalAnswersThisRound;
//                           var percentText = (numAnswersGottenThisRound / numTotalAnswersThisRound * 100).toFixed(1) + '%';
//                           $('#pointsLabelFraction').text(fractionText);
//                           $('#pointsLabelPercent').text(percentText);
//                           $("#solstats").text(fractionText + ' (' + percentText + ')');
//                       }
//                       updateGuesses(ucGuess);


//                   }
//                   if ('g' in data)
//                   {
//                       if (!data['g'])
//                       {
//                           // quiz is not going anymore!
//                           processQuizEnded();
//                       }
//                   }
//               },
//               'json');
//   }

//   function processTimerRanOut()
//   {
//       processQuizEnded();
//   }

//   function processQuizEnded()
//   {
//       if (gameGoing)
//       {
//           $("#questions").html(""); // clear the table
//           $("#gameTimer").text("0:00");   // set the timer display to 0
//           window.clearInterval(gameTimerID);  // and stop the timer
//           if (challenge)  // only when the challenge is done and not its missed lists.
//           {
//               updateMessages("The challenge has ended!");
//               $.post(tableUrl, {action: "getDcData"},
//                   function(data){
//                       processDcResults(data, "addlInfo_content");
//                   }, 'json');
//               updateMessages('Click <a onClick="showAddlInfo()" class="softLink">here</a> to see current results for this challenge.');
//           }
//           if (autoSave)
//           {
//               // send save again
//               saveGame();
//           }
//           else
//               updateMessages("Autosave is NOT on. To save your progress, type in a name for this list next to the Save button, and click Save.");
//           /* highlight all the missed words */
//           for (var wrongWord in wrongWordsHash)
//           {
//               $('#s_' + wrongWord).css({'color': 'red'});
//           }
//           for (var wrongAlpha in wrongAlphasHash)
//           {
//               $('#a_' + wrongAlpha).css({'color': 'red'});
//           }


//           $("#defs_popup_content").css({'visibility': 'visible'});
//           gameGoing = false;
//       }
//   }

//   function showAddlInfo()
//   {
//   	$('#addlInfo_popup').fadeIn();

//   	//Define margin for center alignment (vertical + horizontal) - we add 80 to the height/width to accomodate for the padding + border width defined in the css
//   	var popMargTop = ($('#addlInfo_popup').height() + 80) / 2;
//   	var popMargLeft = ($('#addlInfo_popup').width() + 80) / 2;

//   	//Apply Margin to Popup
//   	$('#addlInfo_popup').css({
//   		'margin-top' : -popMargTop,
//   		'margin-left' : -popMargLeft
//   	});

//   	//Fade in Background
//   	$('#fade').fadeIn(); //Fade in the fade layer

//   //	return false;
//   }


//   function cellClickHandler(event)
//   {
//       var cellIndex = event.data.cell;
//       shuffleSingleCell(cellIndex);

//       var sel;
//       if(document.selection && document.selection.empty)
//       {
//           document.selection.empty();
//       }
//       else if(window.getSelection)
//       {
//           sel=window.getSelection();
//           if (sel && sel.removeAllRanges)
//               sel.removeAllRanges();
//       }
//       $("#guessText").focus();
//   }

//   function shuffleSingleCell(cellIndex)
//   {
//       var selector = $('#q' + cellIndex + ' > span.tiles > span[class^="tile"]');
//       shuffleList(selector);
//       $('#q' + cellIndex + ' > span.tiles').html(selector);
//   }

//   //shuffles list in-place (from dtm.livejournal.com/38725.html)
//   function shuffleList(list)
//   {
//     var i, j, t;
//     for (i = 1; i < list.length; i++) {
//       j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
//       if (j != i) {
//         t = list[i];                        // swap list[i] and list[j]
//         list[i] = list[j];
//         list[j] = t;
//       }
//     }
//   }





//   /* unload page event:

//   disabling refresh or back is not a good idea in general. to handle refresh/back as cleanly as possible, we must do a few things

//   - if autosave is on, the game should have been saved as soon as the quiz ended. no need to save again.
//       - TODO what happens if the player leaves as the quiz saves?
//   - if the game is currently going on, the unloader should give up and save the game if autosave is on

//   it also seems that when closing the browser, sometimes it won't allow outgoing requests. Safari also does not seem to allow outgoing
//   requests at all on unload!

//   so use $.ajax() with the "ASYNC : false" set (according to somebody -- need to test this on various browsers)

//                       back        refresh         close tab       close browser
//   chrome (OSX):        yes        yes                 yes             yes
//   chrome (win):
//   ff (win):            yes                                        seems no..
//   ff (osx):
//   safari (osx):       yes         yes             yes                 yes
//   ie (win):                                                           yes
//   ff (linux):                                                         yes

//   opera doesn't work for this event :(

//   also use onbeforeunload:
//   http://stackoverflow.com/questions/4376596/jquery-unload-or-beforeunload


//   Note: windows chrome doesn't post on refresh?!
//    */

//   function unloadEventHandler()
//   {
//       if (gameGoing)
//       {
//           $.ajax({
//              url: tableUrl,
//              async: false,
//              data: {action: "giveUpAndSave",
//                   listname: $("#saveListName").val()},
//              type: "POST"
//           });
//       }
//   }

//   var App = new AppView;
//   return {
//     App: App,
//   }
// }(jQuery, _, Backbone));
