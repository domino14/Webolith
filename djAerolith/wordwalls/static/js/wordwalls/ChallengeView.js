/*global define*/
define ([
  'jquery',
  'underscore',
  'text!templates/challengeResults.html',
  'mustache'
], function($, _, ChallengeResults, Mustache) {
  var sortEntry_, processDcResults_, getMedalName_;
  sortEntry_ = function(e1, e2) {
    if (e1.score === e2.score) {
      return e2.tr - e1.tr;
    } else {
      return e2.score - e1.score;
    }
  };
  getMedalName_ = function(medal) {
    if (!medal) {
      return null;
    }
    return {
      'gold': 'gold_medal',
      'silver': 'silver_medal',
      'bronze': 'bronze_medal',
      'platinum': 'platinum_star',
      'goldstar': 'gold_star'
    }[medal];
  };
  processDcResults_ = function(data, divIdToPopulate) {
    var maxScore, entries, addlData, context, $el;
    context = {results: []};
    $el = $("#" + divIdToPopulate);
    if (_.isNull(data)) {
      $el.text("No one has done this challenge today. Be the first!");
      return;
    }
    maxScore = data.maxScore;
    entries = data.entries;
    entries.sort(sortEntry_);
    _.each(entries, function(entry, index) {
      addlData = entry.addl;
      try {
        addlData = $.parseJSON(addlData);
      }
      catch (e) {}
      context.results.push({
        place: index + 1,
        user: entry.user,
        medal: getMedalName_(addlData ? addlData.medal.toLowerCase() : null),
        scorePercent: (entry.score / maxScore * 100).toFixed(1),
        secondsRemaining: entry.tr
      });
    });
    $el.html(Mustache.render(ChallengeResults, context));
  };
  return {
    processDcResults: processDcResults_
  };
});