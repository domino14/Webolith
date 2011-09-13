function sortEntry(e1, e2)
{
    if (e1['score'] == e2['score'])
        return e2['tr'] - e1['tr'];
    else
        return e2['score'] - e1['score'];
}

function processDcResults(data, divIdToPopulate)
{
//    data = fakeDcData();
    if (data == null)
    {
        $("#" + divIdToPopulate).text("No one has done this challenge today. Be the first!");
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
                            '</td><td class="dcResultsTableCell"><a href="/accounts/profile/' + user + '" target="_blank">' + user + '</a>' + 
                            '</td><td class="dcResultsTableCell">' + (score/maxScore * 100).toFixed(1) + '%' + 
                            '</td><td class="dcResultsTableCell">' + tr + ' s.' + '</td></tr>'
            
        }
        tableBuilder += '</table>'
        $("#" + divIdToPopulate).html(tableBuilder);
    }
}

function fakeDcData()
{
    var data = {};
    data['maxScore'] = 100;
    data['entries'] = [];
    for (var i = 0; i < 50; i++)
    {
        data['entries'].push({'user': "User" + i, 'score': Math.floor(Math.random()*100), 'tr': Math.floor(Math.random() * 200)});
    }
    return data;
}