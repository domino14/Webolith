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
var dcTimeMap;

function changeMaxProb()
{
    var lex = $('#id_lexicon option:selected').text();
    var curLength = $('#id_wordLength').val();
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
        $("#id_quizTime").val(0);
    }
    else
    {
        var cName = $('#id_challenge option:selected').text();
        var lexName = $('#id_lexicon option:selected').text();
        $('#dcResultsLabel').text('(' + lexName + ') ' + cName + ' leaderboard');
        getDcResults();
        $("#id_quizTime").val(dcTimeMap[cVal]/60.0);
    }
}

function tabSelected(event, ui)
{
    /* this function gets triggered when the user selects a tab from the list types */
    //alert(ui.index);  //ui.index gets the index of the selected tab
    
    if (ui.index == 0)
    {
        /* today's challenges. disable time select */
        $("#id_quizTime").attr('disabled', true);
    }
    else
    {
        $("#id_quizTime").attr('disabled', false);
        $("#id_quizTime").val(4);
    }
}

function initializeTableCreatePage(lStr, dcStr, _url)
{
    url = _url;
    lengthCounts = $.parseJSON(lStr);
    dcTimeMap = $.parseJSON(dcStr);

    for (lex in lengthCounts)
    {
        lengthCounts[lex] = $.parseJSON(lengthCounts[lex]);
    }
    
    /* set up event handlers */
    $('#id_lexicon').change(function() { 
        var success = changeMaxProb();
        if (!success) $("#id_wordLength").val("");
    });
    
    $('#id_wordLength').change(function() {
        var success = changeMaxProb();
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
    $('#id_lexicon').change(challengeChangeEventHandler);
    
    // show results label with selected challenge on load
    challengeChangeEventHandler();
    changeMaxProb();
    $('#id_listOption').change(savedListOptionChangeHandler);
    $('#id_wordList').change(savedListChangeHandler);
    
    savedListOptionChangeHandler();
    savedListChangeHandler();
    
    $('#id_lexicon').change(savedListLexiconChanged);
    savedListLexiconChanged();
}

function savedListOptionChangeHandler()
{
    var optionName = $('#id_listOption option:selected').text();
    $('#savedListsSubmit').button('option', 'label', 'Play!').button('enable');

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
        $('#savedListsSubmit').button('option', 'label', 'Delete selected list');
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
        $('#savedListsSubmit').button('disable');
    }
    else
    {
        $('#savedListsSubmit').button('enable');
    }
}

function getDcResults()
{
    // gets daily challenge results from server
    $.post(url, {action: 'getDcResults', 
                lexicon: $('#id_lexicon option:selected').text(),
                chName: $('#id_challenge option:selected').text() }, 
                populateDcResults, 'json')
}

function populateDcResults(data)
{
    processDcResults(data, "dcResultsDiv");
}

function savedListLexiconChanged()
{
    $.post(url, {action: 'getSavedListList', 
                lexicon: $('#id_lexicon option:selected').text()}, 
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

function wwRedirect(data)
{
    if (data['success'])
    {
        if (data['url'])
        {
            window.location.href = data['url'];   // redirect
        }
    }
    else
    {
        alert('!');
    }
}

function challengeSubmitClicked()
{
    $.post(url, {action: 'challengeSubmit',
                lexicon: $('#id_lexicon').val(),
                challenge: $('#id_challenge').val()},
                wwRedirect,
                'json');
}

function searchParamsSubmitClicked()
{
    $.post(url, {
                    action: 'searchParamsSubmit',
                    lexicon: $('#id_lexicon').val(),
                    quizTime: $("#id_quizTime").val(),
                    wordLength: $("#id_wordLength").val(),
                    probabilityMin: $("#id_probabilityMin").val(),
                    probabilityMax: $("#id_probabilityMax").val(),
                    playerMode: $("#id_playerMode").val()
                },
                wwRedirect,
                'json');
}

function savedListsSubmitClicked()
{
    var optionName = $('#id_listOption option:selected').text();
    if (optionName != "Delete list")
    {
        $.post(url, {
                    action: 'savedListsSubmit',
                    lexicon: $('#id_lexicon').val(),
                    quizTime: $("#id_quizTime").val(),
                    listOption: $("#id_listOption").val(),
                    wordList: $("#id_wordList").val()
                },
                wwRedirect,
                'json');
    }
    else
    {
        $.post(url, {
                    action: 'savedListDelete',
                    lexicon: $('#id_lexicon').val(),
                    listOption: $("#id_listOption").val(),  /*todo redundancy, dry */
                    wordList: $("#id_wordList").val()
                },
                savedListDelete,
                'json');
    }
}

function savedListDelete(data)
{
    if (data['deleted'])
    {
        $("#id_wordList option[value=" + data['wordList'] + "]").remove()
        requestSavedListInfo(); // populate new limit/text
    }
}