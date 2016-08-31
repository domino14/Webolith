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
      var tiles, numAnagrams, chipClassName, liClass, tileClass;
      tiles = [];
      if (this.props.displayStyle.showBorders) {
        liClass = 'qle borders';
      } else {
        liClass = 'qle noborders';
      }
      if (this.props.words) {
        numAnagrams = Math.min(this.props.words.size, 9);
      } else {
        // No words for this question; return an empty list item.
        return <li className={liClass}/>;
      }
      tileClass = this.getTileClass();
      for (var i = 0; i < this.props.letters.length; i++) {
        tiles.push(<span
          className={tileClass}
          key={i}>{this.props.letters[i]}</span>);
      }
      chipClassName = "chip chip" + String(numAnagrams);

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