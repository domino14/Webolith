var url;

function initializeTableCreator(_url)
{
    url = _url;
}

function wgRedirect(data)
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

function multi1clicked()
{
    // for right now, a 7x7 table
    $.post(url, {action: 'multiWordStruck',
                lexicon: $('#id_lexicon').val(),
                challenge: 1},
                wgRedirect,
                'json');
}

function multi2clicked()
{
    // for right now, a 9x9 table
    $.post(url, {action: 'multiWordStruck',
                lexicon: $('#id_lexicon').val(),
                challenge: 2},
                wgRedirect,
                'json');
}

function multi3clicked()
{
    // for right now, an 11x11 table
    $.post(url, {action: 'multiWordStruck',
                lexicon: $('#id_lexicon').val(),
                challenge: 3},
                wgRedirect,
                'json');
}

function solo1clicked()
{
    // a solo table 
    alert("Please wait, not yet implemented.");
}

