define([
  'react'
], function(React) {
  "use strict";
  // This represents a question and renders given the user's style.
  var WordwallsQuestion = React.createClass({
    render: function() {
      var tiles, numAnagrams, chipClassName;
      tiles = [];
      numAnagrams = Math.min(this.props.words.length, 9);
      for (var i = 0; i < this.props.letters.length; i++) {
        tiles.push(<span
          className="tile tileon tile1 tilemono"
          key={i}>{this.props.letters[i]}</span>);
      }
      chipClassName = "chip chip" + String(numAnagrams);
      return (
        <li className="qle borders">
          <span className={chipClassName}>{numAnagrams}</span>
          <span className="tiles">{tiles}</span>
        </li>
      );
    }
  });

  return WordwallsQuestion;
});