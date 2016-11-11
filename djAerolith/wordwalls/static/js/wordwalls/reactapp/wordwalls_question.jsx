import React from 'react';

import Chip from './game_chip';
import Tile from './game_tile';
import QuestionText from './question_text';

const DEFAULT_BLANK_CHARACTER = '?';

class WordwallsQuestion extends React.Component {
  /**
   * Get the dimensions of a tile given the length of the word.
   * @param  {number} length
   * @param {boolean} chipAdded If there is a "chip", it'll take up
   * space, thus making the effective length longer
   * @return {Array.<Number>} A 2-tuple (width, height)
   */
  static getTileDimensions(length, chipAdded) {
    let newLength = length;
    if (chipAdded === true) {
      newLength = length + 1;
    }
    if (newLength <= 8) {
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
      16: [10, 10],
    }[newLength];
  }

  /**
   * Get the color for this tile given the number of anagrams.
   * Use the bootstrap theme's colors and ROYGBIV ordering.
   * @param  {number} numAnagrams - cannot be higher than 9.
   * @return {Array.<String>} A color hex code, opacity, text color,
   *  alternate text color tuple. The alternate text color is used
   *  for when tiles are off.
   */
  static getColorFromAnagrams(numAnagrams) {
    return {
      9: ['#3e3f3a', 1, '#ffffff', '#800080'],  // dark (black)
      8: ['#3e3f3a', 0.65, '#ffffff', '#400040'], // Gray tile.
      7: ['#325d88', 1, '#ffffff', '#325d88'], // A dark blue.
      6: ['#29abe0', 1, '#ffffff', '#29abe0'], // A lighter blue.
      5: ['#93c54b', 1, '#ffffff', '#93c54b'], // A greenish color.
      4: ['#fce053', 1, '#3e3f3a', '#938231'], // A light yellow
      3: ['#f47c3c', 1, '#ffffff', '#f47c3c'], // Orange
      2: ['#d9534f', 1, '#ffffff', '#d9534f'], // Red
      1: ['#ffffff', 1, '#3e3f3a', '#3e3f3a'], // White tile, dark text.
    }[String(numAnagrams)];
  }

  /**
   * Draw a rectangular border, that may have a stroke of 0px (hidden)
   * @return {React.Element}
   */
  borderRectangle() {
    return (<rect
      width={this.props.xSize}
      height={this.props.ySize}
      x={this.props.gridX}
      y={this.props.gridY}
      stroke="#3e3f3a"
      strokeWidth="1px"
      fill="none"
      strokeOpacity={this.props.displayStyle.showBorders ? '1' : '0'}
    />);
  }

  clickedQ() {
    this.props.onShuffle(this.props.qNumber);
  }

  render() {
    // var tiles, numAnagrams, x, y,
      // tileWidth, tileHeight, key, heightPct, xPadding, dims, color,
      // numberFontSize, letterFontSize, countFrom, letter;
    const tiles = [];
    let numAnagrams;

    if (this.props.words) {
      numAnagrams = Math.min(this.props.words.size, 9);
    } else {
      // No words for this question; return an empty g.
      return <g>{this.borderRectangle()}</g>;
    }
    const color = this.getColorFromAnagrams(numAnagrams);
    const dims = this.getTileDimensions(this.props.letters.length,
      this.props.displayStyle.showChips);
    const tileWidth = dims[0];
    const tileHeight = dims[1];
    const heightPct = tileHeight / this.props.ySize;

    const y = this.props.gridY + (this.props.ySize * ((1 - heightPct) / 2));
    const xPadding = this.props.gridX + (tileWidth * 0.1);
    // XXX: This is a bit of an ugly formula, but it's fast.
    // See http://stackoverflow.com/a/22580176/1737333 for perhaps
    // a better approach.
    const letterFontSize = dims[0] * 8;
    const numberFontSize = dims[0] * 5;
    let countFrom = 0;
    if (this.props.displayStyle.showChips) {
      tiles.push(<Chip
        radius={tileWidth / 2}
        x={xPadding}
        y={y}
        color={color}
        fontSize={numberFontSize}
        number={this.props.words.size}
        key={`q${this.props.qNumber}chip`}
      />);
      countFrom = 1;
    }
    let x;
    let letter;

    if (this.props.displayStyle.on) {
      for (let i = countFrom, letterIdx = 0;
            i < this.props.letters.length + countFrom;
            i += 1, letterIdx += 1) {
        x = xPadding + (i * (tileWidth + 1));
        letter = this.props.letters[letterIdx];
        if (letter === DEFAULT_BLANK_CHARACTER &&
            this.props.displayStyle.blankCharacter !== '') {
          letter = this.props.displayStyle.blankCharacter;
        }
        tiles.push(
          <Tile
            color={color}
            key={`q${this.props.qNumber}tile${letterIdx}`}
            x={x}
            y={y}
            width={tileWidth}
            height={tileHeight}
            fontSize={letterFontSize}
            letter={letter}
          />);
      }
    } else {
      // Tiles are off, just use a <text>
      tiles.push(
        <QuestionText
          font={this.props.displayStyle.font}
          bold={this.props.displayStyle.bold}
          color={color}
          key={`q${this.props.qNumber}qtext`}
          x={xPadding + (countFrom * (tileWidth + 1))}
          y={this.props.gridY + (this.props.ySize / 2)}
          fontSize={letterFontSize}
          letters={this.props.letters}
        />);
    }

    return (
      <g
        onMouseDown={/* disallow highlighting text */e => e.preventDefault()}
        onClick={this.clickedQ}
        style={{
          cursor: 'default',
        }}
      >{tiles}{this.borderRectangle()}</g>
    );
  }
}

WordwallsQuestion.propTypes = {
  displayStyle: React.PropTypes.object.isRequired,
  letters: React.PropTypes.string,
  qNumber: React.PropTypes.number.isRequired,
  words: React.PropTypes.any,
  gridX: React.PropTypes.number.isRequired,
  gridY: React.PropTypes.number.isRequired,
  xSize: React.PropTypes.number.isRequired,
  ySize: React.PropTypes.number.isRequired,
  onShuffle: React.PropTypes.func.isRequired,
};

export default WordwallsQuestion;
