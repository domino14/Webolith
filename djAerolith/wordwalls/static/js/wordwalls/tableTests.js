/* this file should be included after the table.js file. it will simulate sets of games. 
    it's not really a unit testing framework, but more for checking within the browser. */

var correctWordsObj;
var correctWordsIndex;
var totalAlphasObj;
var totalAlphasCount;
var betQsTimeout = 10;
var correctRate = 1;

var missedWordsObj;
var missedWordsObjCopy;

var missedAlphasObj;
var missedAlphasObjCopy;

var shouldCheckMissed;

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
                ++count;
    }

    return count;
}

function startQuiz()
{
    shouldCheckMissed = false;
    totalAlphasObj = {};
    
    missedWordsObj = {};
    missedAlphasObj = {};
    totalAlphasCount = 0;
    continueQuiz();
}

function continueQuiz()
{

    currentGuessIndex = 0;
    currentGuessSubIndex = 0;
    correctWordsObj = [];
    requestStart();
    
    window.setTimeout(collectCorrectWords, 2000);
}

function collectCorrectWords()
{
    if (quizOverForever) return;
    if (quizzingOnMissed)
    {   
        updateMessages('quizzingonmissed = true');
        shouldCheckMissed = true;   // from now on, check 'missed' to see if it matches our missedAlphasObjCopy
        totalAlphasObj = {};
        totalAlphasCount = 0;
        missedWordsObjCopy = missedWordsObj;
        missedWordsObj = {};
        
        missedAlphasObjCopy = missedAlphasObj;
        missedAlphasObj = {};
    }
    
    
    correctWordsIndex = 0;
    
    for (var i = 0; i < qObj.length; i++)
    {
        for (var j = 0; j < qObj[i]['ws'].length; j++)
        {
            correctWordsObj.push({'word': qObj[i]['ws'][j]['w'], 'alpha': qObj[i]['a']});
        }

        totalAlphasObj[qObj[i]['a']] = true;
        totalAlphasCount++;
    }
    if (countProperties(totalAlphasObj) != totalAlphasCount)
    {
        alert('some of these questions are repeats! ' + totalAlphasCount + ' ' + countProperties(totalAlphasObj));
    }
    else
    {
        window.setTimeout(startGuessing, betQsTimeout);
    }
    shuffleList(correctWordsObj);
}

function startGuessing()
{
    if (correctWordsIndex < correctWordsObj.length )
    {
        var word = correctWordsObj[correctWordsIndex]['word'];
        var alpha = correctWordsObj[correctWordsIndex]['alpha'];
        if (shouldCheckMissed)
        {
            if (!(alpha in missedAlphasObjCopy))
            {
                updateMessages('this alpha should never have been missed! ' + alpha);
            }
        }
        
        if (Math.random() < correctRate)
        {
            submitGuess(word);
            if (shouldCheckMissed)
            {
                delete missedWordsObjCopy[word];
            }
        }
        else
        {
            missedWordsObj[word] = true;
            missedAlphasObj[alpha] = true;
        }
        correctWordsIndex++;
        window.setTimeout(startGuessing, betQsTimeout);
    }
    else
    {
        // it's over
        window.setTimeout(giveUp, 500);
        window.setTimeout(continueQuiz, 1000);
        
    }
}
