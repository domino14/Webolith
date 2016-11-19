import React from 'react';
import Immutable from 'immutable';

import Chip from './game_chip';
import Tile from './game_tile';
import QuestionText from './question_text';

const DEFAULT_BLANK_CHARACTER = '?';

const ColorConstants = {
  White: '#feffa2',
  Black: '#3e3f3a',
  Green: '#5ef386',
  Yellow: '#d3e948',
  Blue: '#60c0dc',
  Purple: '#725ef3',
  Magenta: '#e95ad6',
};

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
      return [18, 18];
    }
    return {
      9: [17, 17],
      10: [16, 16],
      11: [14.5, 14.5],
      12: [13, 13],
      13: [12, 12],
      14: [11.5, 11.5],
      15: [10.75, 10.75],
      // Only when a chip is added.
      16: [10, 10],
    }[newLength];
  }

  /**
   * Get a color given the number of anagrams.
   * @param  {number} numAnagrams
   * @return {Object} A color hex code, opacity, text color, outline.
   */
  static getColorFromAnagrams(numAnagrams) {
    let effectiveNumAnagrams = numAnagrams;
    if (numAnagrams > 9) {
      effectiveNumAnagrams = 9;
    }
    return {
      9: {
        color: ColorConstants.Black,
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      8: {
        color: ColorConstants.Black,
        opacity: 0.65,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      7: {
        color: '#325d88',
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      6: {
        color: ColorConstants.Blue,
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      5: {
        color: ColorConstants.Green,
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      4: {
        color: ColorConstants.Yellow,
        opacity: 1,
        textColor: ColorConstants.Black,
        outline: '#7e7f7a',
      },
      3: {
        color: ColorConstants.Magenta,
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      2: {
        color: ColorConstants.Purple,
        opacity: 1,
        textColor: ColorConstants.White,
        outline: '#7e7f7a',
      },
      1: {
        color: '#fff0a2',
        opacity: 1,
        textColor: ColorConstants.Black,
        outline: '#7e7f7a',
      },
    }[effectiveNumAnagrams];
  }

  constructor() {
    super();
    this.clickedQ = this.clickedQ.bind(this);
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
      stroke="#7e7f7a"
      strokeWidth="1px"
      fill="none"
      strokeOpacity={this.props.displayStyle.showBorders ? '1' : '0'}
    />);
  }

  clickedQ() {
    this.props.onShuffle(this.props.qNumber);
  }

  render() {
    const tiles = [];

    if (!this.props.words) {
      // No words for this question; return an empty g.
      return <g>{this.borderRectangle()}</g>;
    }
    const color = WordwallsQuestion.getColorFromAnagrams(this.props.words.size);
    const dims = WordwallsQuestion.getTileDimensions(this.props.letters.length,
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

    if (this.props.displayStyle.tilesOn) {
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
            tileStyle={this.props.displayStyle.tileStyle}
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
  displayStyle: React.PropTypes.shape({
    showChips: React.PropTypes.bool,
    tilesOn: React.PropTypes.bool,
    tileStyle: React.PropTypes.string,
    font: React.PropTypes.string,
    showBorders: React.PropTypes.bool,
    bold: React.PropTypes.bool,
    blankCharacter: React.PropTypes.string,
  }),
  letters: React.PropTypes.string,
  qNumber: React.PropTypes.number.isRequired,
  words: React.PropTypes.instanceOf(Immutable.Map),
  gridX: React.PropTypes.number.isRequired,
  gridY: React.PropTypes.number.isRequired,
  xSize: React.PropTypes.number.isRequired,
  ySize: React.PropTypes.number.isRequired,
  onShuffle: React.PropTypes.func.isRequired,
};

export default WordwallsQuestion;
