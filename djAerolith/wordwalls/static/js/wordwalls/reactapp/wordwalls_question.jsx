define([
  'react'
], function(React) {
  "use strict";
  // This represents a question and renders given the user's style.
  var WordwallsQuestion = React.createClass({
    /**
     * Calculate the class of the tile from the displayStyle.
     * @return {string}
     */
    getTileClass: function() {
      var classes;
      classes = ['tile'];
      if (this.props.displayStyle.on) {
        classes.push('tileon');
        classes.push('tile' + this.props.displayStyle.selection);
      } else {
        classes.push('tileoff');
      }
      if (this.props.displayStyle.font === 'mono') {
        classes.push('tilemono');
      } else if (this.props.displayStyle.font === 'sans') {
        classes.push('tilesans');
      }
      if (this.props.displayStyle.bold) {
        classes.push('tilebold');
      }
      return classes.join(' ');
    },
    render: function() {
      var tiles, numAnagrams, chipClassName, unsolvedWords, liClass;
      tiles = [];
      unsolvedWords = this.props.words.filter(function(word) {
        return word.solved === false;
      });
      numAnagrams = Math.min(unsolvedWords.length, 9);
      for (var i = 0; i < this.props.letters.length; i++) {
        tiles.push(<span
          className={this.getTileClass()}
          key={i}>{this.props.letters[i]}</span>);
      }
      chipClassName = "chip chip" + String(numAnagrams);
      if (this.props.displayStyle.showBorders) {
        liClass = 'qle borders';
      } else {
        liClass = 'qle noborders';
      }
      return (
        <li className={liClass}>
          <span className={chipClassName}>{numAnagrams}</span>
          <span className="tiles">{tiles}</span>
        </li>
      );
    }
  });

  return WordwallsQuestion;
});