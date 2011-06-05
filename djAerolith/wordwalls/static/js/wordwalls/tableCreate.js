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

var lengthCounts;
var maxProb = 999999;
var url;


function changeMaxProb(lex, curLength)
{
    if (curLength < 2 || curLength > 15) 
    {
        return false;    /* don't change anything */
    }
    else
    {
        maxProb = lengthCounts[lex][curLength];
        $('label[for="id_probabilityMax"]').text("Max probability (at most " + maxProb + ")");
        if ($('#id_probabilityMax').val() > maxProb) 
             $('#id_probabilityMax').val(maxProb);
        return true;
    }
}

function challengeChangeEventHandler()
{
    var cVal = $('#id_challenge option:selected').val();
    if (cVal == "")
    {
        // this is the ----- text
        $('#dcResultsLabel').text('Select a challenge to view leaderboard');
    }
    else
    {
        var cName = $('#id_challenge option:selected').text();
        var lexName = $('#id_lexicon_dc option:selected').text();
        $('#dcResultsLabel').text('(' + lexName + ') ' + cName + ' leaderboard');
        getDcResults();
    }
}

function processLengthCounts(lStr, _url)
{
    url = _url;
    lengthCounts = $.parseJSON(lStr);
    for (lex in lengthCounts)
    {
        lengthCounts[lex] = $.parseJSON(lengthCounts[lex]);
    }
    /* set up event handlers */
    $('#id_lexicon').change(function() { 
        var lex = $(this).val();
        var curLength = $('#id_wordLength').val();
        var success = changeMaxProb(lex, curLength);
        if (!success) $("#id_wordLength").val("");
    });
    
    $('#id_wordLength').change(function() {
        var lex = $('#id_lexicon').val();
        var curLength = $(this).val();
        var success = changeMaxProb(lex, curLength);
        if (!success) $("#id_wordLength").val("");
    });
    
    $('#id_probabilityMin').change(function() {
        /* if it's less than 1, set it equal to 1, if it's greater than the max probability, set it to the max */
       if ($(this).val() < 1) $(this).val("1");       
    });
    
    $('#id_probabilityMax').change(function() {
        if ($(this).val() > maxProb) $(this).val(maxProb);
    });

    /* event handlers - today's challenges */
    
    
    $('#id_challenge').change(challengeChangeEventHandler);
    $('#id_lexicon_dc').change(challengeChangeEventHandler);
    
    // show results label with selected challenge on load
    challengeChangeEventHandler();
    
    changeMaxProb($('#id_lexicon').val(), $('#id_wordLength').val());
    $('#id_listOption').change(savedListOptionChangeHandler);
    $('#id_wordList').change(savedListChangeHandler);
    
    savedListOptionChangeHandler();
    savedListChangeHandler();
    
    $('#id_lexicon_sl').change(savedListLexiconChanged);
}

function savedListOptionChangeHandler()
{
    var optionName = $('#id_listOption option:selected').text();
    $('input[name="savedListsSubmit"]').attr('disabled', '').attr('value', 'Play!');
    if (optionName == "Continue list")
    {
        $('#savedListWarning').text("");
    }
    else if (optionName == "Restart list")
    {
        $('#savedListWarning').text("This will restart this list and wipe out all its information. Make sure you want to do this!");
    }
    else if (optionName == "Quiz on first missed")
    {
        $('#savedListWarning').text("");
        dimSubmitIfListUnfinished();
    }
    else if (optionName == "Delete list")
    {
        $('input[name="savedListsSubmit"]').attr('value', 'Delete selected list');
        $('#savedListWarning').text("This will delete the selected list! Make sure you want to do this!");
    }
}

function savedListChangeHandler()
{
    var optionName = $('#id_listOption option:selected').text();
    if (optionName == "Quiz on first missed")
    {
        dimSubmitIfListUnfinished();    
    }
}

function dimSubmitIfListUnfinished()
{
    var listName = $('#id_wordList option:selected').text();
    if (listName.charAt(listName.length-1) != '*')
    {
        /* list has NOT been gone thru at least once. so going thru first missed should not work! */
        $('input[name="savedListsSubmit"]').attr('disabled', 'disabled');
    }
    else
    {
        $('input[name="savedListsSubmit"]').attr('disabled', '');
    }
}

var searchButtonInactiveCss = {'background-color':'rgb(200, 220, 200)'};
var searchButtonActiveCss = {'background-color':'rgb(64, 224, 208)'};

function showADiv(activeButtons, inactiveButtons, activeDivs, inactiveDivs)
{
    for (var buttonSel in activeButtons)
    {
        $(activeButtons[buttonSel]).css(searchButtonActiveCss);
    }
    for (var buttonSel in inactiveButtons)
        $(inactiveButtons[buttonSel]).css(searchButtonInactiveCss);
    
    for (var divSel in activeDivs)
        $(activeDivs[divSel]).show("slow");
    for (var divSel in inactiveDivs)
        $(inactiveDivs[divSel]).hide();
}

function hideAll()
{
    showADiv(new Array(),
            new Array("button#challenges", "button#searchParams", "button#userLists", "button#savedLists"),
            new Array(),
            new Array("#challengesForm", "#searchParamsForm", "#userListsForm", "#savedListsForm"));
}

function showChallenges()
{
    showADiv(new Array("button#challenges"),
            new Array("button#searchParams", "button#userLists", "button#savedLists"),
            new Array("#challengesForm"),
            new Array("#searchParamsForm", "#userListsForm", "#savedListsForm"));
}

function showSearchParams()
{
    showADiv(new Array("button#searchParams"),
            new Array("button#challenges", "button#userLists", "button#savedLists"),
            new Array("#searchParamsForm"),
            new Array("#challengesForm", "#userListsForm", "#savedListsForm"));
}

function showUserLists()
{
    showADiv(new Array("button#userLists"),
            new Array("button#searchParams", "button#challenges", "button#savedLists"),
            new Array("#userListsForm"),
            new Array("#searchParamsForm", "#challengesForm", "#savedListsForm"));
}

function showSavedLists()
{
    showADiv(new Array("button#savedLists"),
            new Array("button#searchParams", "button#userLists", "button#challenges"),
            new Array("#savedListsForm"),
            new Array("#searchParamsForm", "#userListsForm", "#challengesForm"));    
}

function getDcResults()
{
    // gets daily challenge results from server
    $.post(url, {action: 'getDcResults', 
                lexicon: $('#id_lexicon_dc option:selected').text(),
                chName: $('#id_challenge option:selected').text() }, 
                processDcResults, 'json')
}

function sortEntry(e1, e2)
{
    if (e1['score'] == e2['score'])
        return e2['tr'] - e1['tr'];
    else
        return e2['score'] - e1['score'];
}

function processDcResults(data)
{
    if (data == null)
    {
        $("#dcResultsDiv").text("No one has done this challenge today. Be the first!");
    }
    else
    {
        var tableBuilder = '<table id="dcResultsTable"><tr>'
        var maxScore = data['maxScore'];
        var entries = data['entries'];
        
        entries.sort(sortEntry);
        tableBuilder += '<td class="dcResultsTableHeader">#</td><td class="dcResultsTableHeader">Name</td>' +
                        '<td class="dcResultsTableHeader">Score</td><td class="dcResultsTableHeader">Remaining</td></tr>'
        for (var i = 0; i < entries.length; i++)
        {
            var entry = entries[i];
            var user = entry['user'];
            var score = entry['score'];
            var tr = entry['tr'];
            tableBuilder += '<tr><td class="dcResultsTableCell">' + (i+1) + 
                            '</td><td class="dcResultsTableCell">' + user + 
                            '</td><td class="dcResultsTableCell">' + (score/maxScore * 100).toFixed(1) + '%' + 
                            '</td><td class="dcResultsTableCell">' + tr + ' s.' + '</td></tr>'
            
        }
        tableBuilder += '</table>'
        $("#dcResultsDiv").html(tableBuilder);
    }
}

function savedListLexiconChanged()
{
    $.post(url, {action: 'getSavedListList', 
                lexicon: $('#id_lexicon_sl option:selected').text()}, 
                processSavedListResults, 'json')
}

function processSavedListResults(data)
{
    if (data == null)
    {
        $("#id_wordList").html("");
    }
    else
    {
        var options = [];
        for (var i = data.length-1; i >= 0; i--) 
        {
            options.push('<option value=', '"', data[i]['pk'], '">', data[i]['name'], ' (last saved ', data[i]['lastSaved'], ')');
            if (data[i]['goneThruOnce'])
                options.push(' *')
            options.push('</option>');
        }
        $("#id_wordList").html(options.join(''));
    }
}

function requestSavedListInfo()
{
    $.post(url, {action: 'getSavedListNumAlphas'},
                function(data)
                {
                    var addlText = "";
                    if (data['l'] > 0)
                        addlText = "Your current limit is " + data['l'] + ". You can increase this by becoming a supporter!";
                    $("#numAlphasInfo").text("You have " + data['na'] + " alphagrams over all your saved lists. " + addlText);
                },
                'json')
}

/*
function userListsSubmitEH(event)
{
    var title = $("#id_title").val();
    // handler for when the submit button is pressed for user lists
    if (/\S/.test(title))
    {
        // if this is the case, the string in the test function has at least one character of non whitespace
        
    }
    else
    {
        alert('Please enter a valid title');
        event.preventDefault();
    }
}*/