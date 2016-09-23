define([
  'react',
  'jsx!reactapp/game_tile'
], function(React, Tile) {
  "use strict";
  // This represents a question and renders given the user's style.
  var WordwallsQuestion = React.createClass({
    /**
     * Get the dimensions of a tile given the length of the word.
     * @param  {number} length
     * @return {Array.<Number>} A 2-tuple (width, height)
     */
    getTileDimensions: function(length) {
      if (length <= 9) {
        return [18, 20];
      }
      return {
        10: [16, 18],
        11: [14.5, 16],
        12: [13, 14.5],
        13: [12, 13],
        14: [11.5, 11.5],
        15: [10.75, 10.75]
      }[length];
    },
    /**
     * Get the color for this tile given the number of anagrams.
     * Use the bootstrap theme's colors and ROYGBIV ordering.
     * @param  {number} numAnagrams - cannot be higher than 9.
     * @return {Array.<String>} A color hex code, opacity, text color tuple.
     */
    getColorFromAnagrams: function(numAnagrams) {
      return {
        '9': ['#3e3f3a', 1, '#ffffff'],  // dark (black)
        '8': ['#3e3f3a', 0.65, '#ffffff'], // Gray tile.
        '7': ['#325d88', 1, '#ffffff'], // A dark blue.
        '6': ['#29abe0', 1, '#ffffff'], // A lighter blue.
        '5': ['#93c54b', 1, '#ffffff'], // A greenish color.
        '4': ['#fce053', 1, '#3e3f3a'], // A light yellow
        '3': ['#f47c3c', 1, '#ffffff'], // Orange
        '2': ['#d9534f', 1, '#ffffff'], // Red
        '1': ['#ffffff', 1, '#3e3f3a'] // White tile, dark text.
      }[String(numAnagrams)];
    },
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
      var tiles, numAnagrams, chipClassName, liClass, tileClass, x, y,
        tileWidth, tileHeight, key, heightPct, xPadding, dims, color, fontSize;
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
      color = this.getColorFromAnagrams(numAnagrams);
      dims = this.getTileDimensions(this.props.letters.length);
      tileWidth = dims[0];
      tileHeight = dims[1];
      heightPct = tileHeight / this.props.ySize;

      y = this.props.gridY + this.props.ySize * (1 - heightPct) / 2;
      xPadding = this.props.gridX + tileWidth * 0.1;
      // XXX: This is a bit of an ugly formula, but it's fast.
      fontSize = dims[0] * 8 + '%';
      for (var i = 0; i < this.props.letters.length; i++) {
        x = xPadding + tileWidth * i + i;
        key = "q" + this.props.qNumber + "tile" + i;
        tiles.push(
          <Tile
            color={color}
            key={key}
            x={x}
            y={y}
            width={tileWidth}
            height={tileHeight}
            fontSize={fontSize}
            letter={this.props.letters[i]}/>);
      }
      chipClassName = "chip chip" + String(numAnagrams);

      return (
        /*
        <li className={liClass}>
          <span className={chipClassName}>{numAnagrams}</span>
          <span className="tiles">{tiles}</span>
        </li>

        */
        <g>{tiles}</g>
      );
    }
  });

  return WordwallsQuestion;
});