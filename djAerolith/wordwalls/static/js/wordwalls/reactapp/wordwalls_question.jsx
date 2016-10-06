define([
  'react',
  'jsx!reactapp/game_tile',
  'jsx!reactapp/game_chip'
], function(React, Tile, Chip) {
  "use strict";
  // This represents a question and renders given the user's style.
  var WordwallsQuestion = React.createClass({
    /**
     * Get the dimensions of a tile given the length of the word.
     * @param  {number} length
     * @param {boolean} chipAdded If there is a "chip", it'll take up
     * space, thus making the effective length longer
     * @return {Array.<Number>} A 2-tuple (width, height)
     */
    getTileDimensions: function(length, chipAdded) {
      if (chipAdded === true) {
        length = length + 1;
      }
      if (length <= 8) {
        return [18, 20];
      }
      return {
        9: [17, 19],
        10: [16, 18],
        11: [14.5, 16],
        12: [13, 14.5],
        13: [12, 13],
        14: [11.5, 11.5],
        15: [10.75, 10.75],
        // Only when a chip is added.
        16: [10, 10]
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
        tileWidth, tileHeight, key, heightPct, xPadding, dims, color,
        numberFontSize, letterFontSize, countFrom;
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
      dims = this.getTileDimensions(this.props.letters.length,
        this.props.displayStyle.showChips);
      tileWidth = dims[0];
      tileHeight = dims[1];
      heightPct = tileHeight / this.props.ySize;

      y = this.props.gridY + this.props.ySize * (1 - heightPct) / 2;
      xPadding = this.props.gridX + tileWidth * 0.1;
      // XXX: This is a bit of an ugly formula, but it's fast.
      // See http://stackoverflow.com/a/22580176/1737333 for perhaps
      // a better approach.
      letterFontSize = dims[0] * 8 + '%';
      numberFontSize = dims[0] * 5 + '%';
      countFrom = 0;
      if (this.props.displayStyle.showChips) {
        tiles.push(<Chip
          radius={tileWidth/2}
          x={xPadding}
          y={y}
          color={color}
          fontSize={numberFontSize}
          number={this.props.words.size}
          key={"q" + this.props.qNumber + "chip"}/>);
        countFrom = 1;
      }

      for (var i = countFrom, letterIdx = 0;
           i < this.props.letters.length+countFrom;
           i++, letterIdx++) {
        x = xPadding + i * (tileWidth + 1);
        key = "q" + this.props.qNumber + "tile" + letterIdx;
        tiles.push(
          <Tile
            color={color}
            key={key}
            x={x}
            y={y}
            width={tileWidth}
            height={tileHeight}
            fontSize={letterFontSize}
            letter={this.props.letters[letterIdx]}/>);
      }
      chipClassName = "chip chip" + String(numAnagrams);

      return (
        <g
          onMouseDown={this.mouseDown}
          onClick={this.clickedQ}
          style={{cursor: 'default'}}
        >{tiles}</g>
      );
    },

    clickedQ: function() {
      this.props.onShuffle(this.props.qNumber);
    },

    mouseDown: function(e) {
      // Disallow highlighting text.
      e.preventDefault();
    }
  });

  return WordwallsQuestion;
});