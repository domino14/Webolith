var
	quiz=[],
	quizLength,
	cardNumber=0,
	itemNumber=-1,
	letterNumber=0,
	currentCard=[],
	currentItem,
	currentQuestion=[],
	totalSolved=0,
	solvedItems=[],
	hintsOn=false,
	variantsSolved=0,
	pauseInterval,
	speedNumber=5,
	speedString='|||||',    /* next variables added by cesar */
    nextMinP = 0,
    nextMaxP = 0,
    curAlpha = 1,
    numAlphas = 0;
    
var postUrl;
function toggleHints()
{
	hintsOn=!hintsOn;
	changeSpeed(0);
	if (hintsOn)
		setTimeout("revealNextLetter(" + cardNumber + "," + itemNumber + "," + letterNumber + ")",pauseInterval);
}

function changeSpeed(direction)
{
	speedNumber+=direction;
	speedString=(speedString + "|").substring(0,Math.abs(speedNumber));
	pauseInterval=1000* Math.pow(2,(5-speedNumber)/2);
	if (hintsOn)
		document.getElementById("speed").innerHTML=speedNumber + " " + speedString;
	else
		document.getElementById("speed").innerHTML="<font color='khaki'>" + speedNumber + " " + speedString + "</font>";
	document.game.word.focus();
}

function quizItem(word,definition,lexicon)
{
    this.word=word.toUpperCase();
    this.definition=definition;
    if (lexicon==null)
        this.lexicon='';
	else
        this.lexicon=lexicon;
	if (this.lexicon=='')
		this.color="'blue'";
    else
		this.color="'red'";
    this.alphagram=alphabetize(word,'alphagram');
    this.sequence=alphabetize(word,'sequence');
	this.solved=false;
	this.notes="";
}

function alphabetize(word,type)
{
    var work=[], alphagram=[], sequence=[], i;
    for (i=0;i <word.length;i++)
        work[i]=[word[i],i];
	work.sort(function(a,b) {return (a[0] > b[0])-.5});
    for (i=0;i <word.length;i++)
	{
		alphagram[i]=work[i][0];
		sequence[work[i][1]]=i;
	}
	if (type=='alphagram') return alphagram;
	else return sequence;
}

function groupAlphagrams()
{
	var card=[], tempQuiz=[], i;
	quizLength=quiz.length;
	card=[quiz[0]];
	for (i=1;i<quizLength;i++)
	{
		if (quiz[i].alphagram.join('')==quiz[i-1].alphagram.join(''))
			card[card.length]=quiz[i];
		else
		{
			tempQuiz[tempQuiz.length]=card;
			card=[quiz[i]];
		}
	}
	tempQuiz[tempQuiz.length]=card;
	quiz=tempQuiz;
}

function shuffle(array)
{
    var tmp, current, top=array.length;
    if(top) while(--top)
	{
        current=Math.floor(Math.random() * (top + 1));
        tmp=array[current];
        array[current]=array[top];
        array[top]=tmp;
    }
    return array;
}

function selectNextItem()
{
	itemNumber++;
	while (itemNumber < quiz[cardNumber].length && quiz[cardNumber][itemNumber].solved)
		itemNumber++;
	if (itemNumber==quiz[cardNumber].length)
	{
		cardNumber++;
		curAlpha++;
		if (cardNumber==quiz.length)
		{
			cardNumber=0;	
		    itemNumber = -1;
		    $.post(postUrl, {action: "getNextSet", minP: nextMinP, maxP: nextMaxP},
                    loadQuiz, 'json');
            return;
		}
		itemNumber=0;
	}
	if (itemNumber==0)
	{
		if (cardNumber==0)          /* happens when restarting too */
		{
			shuffle(quiz);
			
		}
		shuffle(quiz[cardNumber]);
		for (var i=0;i<quiz[cardNumber].length;i++)
			quiz[cardNumber][i].solved=false;
		variantsSolved=0;
		document.getElementById("variants").innerHTML="";
	}
	currentCard=quiz[cardNumber];
	currentItem=currentCard[itemNumber];
	currentQuestion=currentItem.alphagram.slice();
	document.getElementById("question").innerHTML=currentQuestion.join('');
	document.getElementById("hints").innerHTML="";
	letterNumber=0;
	if (hintsOn)
		setTimeout("revealNextLetter(" + cardNumber + "," + itemNumber + ",0)",3*pauseInterval);
}

function revealNextLetter(card,item,letter)
{
	if (!currentItem.solved && hintsOn && card==cardNumber && item==itemNumber && letter==letterNumber)
	{
		if (letterNumber<currentItem.word.length)
		{
			currentQuestion[currentItem.sequence[letterNumber]]="<font color='khaki'>" + currentItem.word[letterNumber] + "</font>";
 			document.getElementById("question").innerHTML=currentQuestion.join('');
			document.getElementById("hints").innerHTML="<font color=" + currentItem.color + ">" + currentItem.word.substring(0,letterNumber+1) + "</font>";
			letterNumber++;
			setTimeout("revealNextLetter(" + cardNumber + "," + itemNumber + "," + letterNumber + ")",pauseInterval);
		}
		else
		{
			updateSolved(currentItem);
			if (variantsSolved<currentCard.length)
				document.getElementById("hints").innerHTML="";
			setTimeout("selectNextItem()",pauseInterval);
		}
	}
}

function forceReveal()
{
	if (!currentItem.solved)
	{
		if (letterNumber<currentItem.word.length)
		{
			currentQuestion[currentItem.sequence[letterNumber]]="<font color='khaki'>" + currentItem.word[letterNumber] + "</font>";
			document.getElementById("question").innerHTML=currentQuestion.join('');
			document.getElementById("hints").innerHTML="<font color=" + currentItem.color + ">" + currentItem.word.substring(0,letterNumber+1) + "</font>";
			letterNumber++;
			setTimeout("revealNextLetter(" + cardNumber + "," + itemNumber + "," + letterNumber + ")",pauseInterval);
		}
		else
		{
			updateSolved(currentItem);
			if (variantsSolved<currentCard.length)
				document.getElementById("hints").innerHTML="";
			setTimeout("selectNextItem()",0);
		}
	}
	document.game.word.focus();
}

function solve()
{
	var guess=document.game.word.value, matchedNumber=-1;
	var guess1=guess.substring(0,1);
	if (guess1>='0' && guess1<='9')
	{
		if (guess1=='0')
			currentItem.notes=guess.substring(1);
		else
		{
			if (guess1<=solvedItems.length)
			{
				solvedItems[solvedItems.length-guess1].notes=guess.substring(1);
				displaySolved();
			}
		}
		document.game.word.value="";
	}
	else 
	{
		for (var i=0;i<currentCard.length;i++)
			if (guess.toUpperCase()==currentCard[i].word && !currentCard[i].solved) matchedNumber=i;
		if (matchedNumber > -1)
		{
			document.game.word.value="";
			updateSolved(currentCard[matchedNumber]);
			if (matchedNumber==itemNumber)
			{
				document.getElementById("hints").innerHTML="";
				setTimeout("selectNextItem()",0);
			}
		}
	}
}

function updateSolved(newSolution)
{
	newSolution.solved=true;
	variantsSolved++;
//	document.getElementById("trace").innerHTML=totalSolved;
	totalSolved=solvedItems.push(newSolution);
	document.getElementById("progress").innerHTML=curAlpha+" alphagrams quizzed of "+numAlphas;
	if (variantsSolved<currentCard.length)
		document.getElementById("variants").innerHTML="<font color="+newSolution.color+">"+newSolution.word+"</font><br />"+document.getElementById("variants").innerHTML;
	displaySolved();
}

function displaySolved()
{
	var numberToDisplay=20;
	if (solvedItems.length<numberToDisplay)
		numberToDisplay=solvedItems.length;
	var solvedHTML="";
	for (var i=solvedItems.length-1;i>solvedItems.length-numberToDisplay-1;i--)
		solvedHTML=
			solvedHTML+
			"<dt>"+solvedItems[i].word+" <font color='khaki'>"+solvedItems[i].notes+"</font></dt>"+
			"<dd><i><small>"+"<font color="+solvedItems[i].color+">"+solvedItems[i].definition+"</i></font></small></dd>";
	document.getElementById("solved").innerHTML="<dl>"+solvedHTML+"</dl>";
}
function displayAll()
{
	var numberToDisplay=solvedItems.length;
	var solvedHTML="";
	for (var i=solvedItems.length-1;i>solvedItems.length-numberToDisplay-1;i--)
		solvedHTML=
			solvedHTML+
			solvedItems[i].word+" "+
			solvedItems[i].notes+"<br />";
	document.getElementById("solved").innerHTML=solvedHTML;
}

function completeSolve()
{
	document.game.word.value="";
	document.getElementById("hints").innerHTML="";
	document.getElementById("variants").innerHTML="";
	for (var i=itemNumber;i<currentCard.length;i++)
		if (!currentCard[i].solved)
		{
			currentCard[i].solved=true;
			totalSolved=solvedItems.push(currentCard[i]);
			displaySolved();
		}
	document.getElementById("progress").innerHTML=curAlpha+" alphagrams quizzed of "+numAlphas;
	document.game.word.focus();
	setTimeout("selectNextItem()",0);
}

/* added by cesar */
function loadQuiz(quizData)
{
    quiz = [];
    if (quizData['data'].length == 0)
    {
        document.getElementById("messages").innerHTML = "The quiz is done.";
        return;
    }
    for (var i = 0; i < quizData['data'].length; i++)
    {
        
        quiz.push(new quizItem(quizData['data'][i]['w'], quizData['data'][i]['d'], ''));
    }
    
    quiz.sort(function(a,b) {
        return (a.alphagram.join()+a.word>b.alphagram.join()+b.word)-.5;
        }); 
        
    groupAlphagrams(); 
    document.game.word.focus();
    
    selectNextItem();
    
    nextMinP = quizData['nextMinP'];
    nextMaxP = quizData['nextMaxP'];
    if ('numAlphas' in quizData)
        numAlphas = quizData['numAlphas'];
}

function initializeQuiz(url)
{
    postUrl = url;
    $.post(postUrl, {action: "getInitialSet"},
            loadQuiz, 'json');
}
