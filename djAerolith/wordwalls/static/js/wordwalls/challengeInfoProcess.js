WW = WW || {};
WW.App = WW.App || {};
WW.App.Challenges = function() {
  var sortEntry_, processDcResults_, fakeDcData_;
  sortEntry = function(e1, e2)
  {
    if (e1['score'] == e2['score']) {
      return e2['tr'] - e1['tr'];
    } else {
      return e2['score'] - e1['score'];
    }
  }
  processDcResults = function(data, divIdToPopulate) {
    if (_.isNull(data) {
      $("#" + divIdToPopulate).text(
        "No one has done this challenge today. Be the first!");
    } else {
        var tableBuilder = '<table id="dcResultsTable"><tr>'
        var maxScore = data['maxScore'];
        var entries = data['entries'];

        entries.sort(sortEntry);
        tableBuilder += '<td class="dcResultsTableHeader">#</td>' +
                        '<td class="dcResultsTableHeader">Name</td>' +
                        '<td class="dcResultsTableHeader">Score</td>' +
                        '<td class="dcResultsTableHeader">Remaining</td></tr>'
        for (var i = 0; i < entries.length; i++)
        {
            var entry = entries[i];
            var user = entry['user'];
            var score = entry['score'];
            var tr = entry['tr'];
            var addlData = entry['addl'];
            try {
                addlData = $.parseJSON(addlData);
            }
            catch (e) {}
            var medalHtml = '';
            if (addlData) {
                if (addlData.medal == 'Platinum') {
                    medalHtml = '<img src="/static/img/aerolith/platinum_star_16x16.png">';
                }
                else if (addlData.medal == 'Gold') {
                    medalHtml = '<img src="/static/img/aerolith/gold_medal_16x16.png">';
                }
                else if (addlData.medal == 'Silver') {
                    medalHtml = '<img src="/static/img/aerolith/silver_medal_16x16.png">';
                }
                else if (addlData.medal == 'Bronze') {
                    medalHtml = '<img src="/static/img/aerolith/bronze_medal_16x16.png">';
                }
            }

            tableBuilder += '<tr>' +
                            '<td class="dcResultsTableCell">' + (i+1) +
                            '</td><td class="dcResultsTableCell"><a href="/accounts/profile/' + user +
                                        '" target="_blank">' + medalHtml + user + '</a>' +
                            '</td><td class="dcResultsTableCell">' + (score/maxScore * 100).toFixed(1) + '%' +
                            '</td><td class="dcResultsTableCell">' + tr + ' s.' + '</td></tr>'

        }
        tableBuilder += '</table>'
        $("#" + divIdToPopulate).html(tableBuilder);
    }
}

  fakeDcData = function() {
    var data, i;
    data = {};
    data['maxScore'] = 100;
    data['entries'] = [];
    for (i = 0; i < 50; i++) {
      data['entries'].push({
        'user': "User" + i,
        'score': Math.floor(Math.random()*100),
        'tr': Math.floor(Math.random() * 200)
      });
    }
    return data;
  }


}