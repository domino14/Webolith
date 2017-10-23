import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

import Styling from './style';
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
      return [19, 19];
    }
    return {
      9: [18, 18],
      10: [17, 17],
      11: [15.5, 15.5],
      12: [14, 14],
      13: [13, 13],
      14: [12.5, 12.5],
      15: [11.75, 11.75],
      // Only when a chip is added.
      16: [11, 11],
    }[newLength];
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

    const dims = WordwallsQuestion.getTileDimensions(
      this.props.letters.length,
      this.props.displayStyle.showChips,
    );
    const tileWidth = dims[0];
    const tileHeight = dims[1];
    const heightPct = tileHeight / this.props.ySize;

    const y = this.props.gridY + (this.props.ySize * ((1 - heightPct) / 2));
    const xPadding = this.props.gridX + 0.5;
    // XXX: This is a bit of an ugly formula, but it's fast.
    // See http://stackoverflow.com/a/22580176/1737333 for perhaps
    // a better approach.
    const letterFontSize = dims[0] * 7;
    const numberFontSize = dims[0] * 4;
    let countFrom = 0;
    if (this.props.displayStyle.showChips) {
      tiles.push(<Chip
        radius={(tileWidth / 2) - 1}
        x={xPadding + 0.5}
        y={y + 0.5}
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
        x = xPadding + (i * tileWidth);
        letter = this.props.letters[letterIdx];
        if (letter === DEFAULT_BLANK_CHARACTER &&
            this.props.displayStyle.blankCharacter !== '') {
          letter = this.props.displayStyle.blankCharacter;
        }
        tiles.push(<Tile
          tileStyle={this.props.displayStyle.tileStyle}
          font={this.props.displayStyle.font}
          bold={this.props.displayStyle.showBold}
          key={`q${this.props.qNumber}tile${letterIdx}`}
          x={x}
          y={y}
          width={tileWidth}
          height={tileHeight}
          fontSize={letterFontSize * this.props.displayStyle.fontMultiplier}
          letter={letter}
        />);
      }
    } else {
      // Tiles are off, just use a <text>
      tiles.push(<QuestionText
        font={this.props.displayStyle.font}
        bold={this.props.displayStyle.showBold}
        key={`q${this.props.qNumber}qtext`}
        x={xPadding + (countFrom * (tileWidth + 1))}
        y={this.props.gridY + (this.props.ySize / 2)}
        fontSize={letterFontSize * 1.2 * this.props.displayStyle.fontMultiplier}
        letters={this.props.letters}
        background={this.props.displayStyle.background}
        bodyBackground={this.props.displayStyle.bodyBackground}
      />);
    }

    return (
      <g
        onMouseDown={/* disallow highlighting text */e => e.preventDefault()}
        onClick={this.clickedQ}
        style={{
          cursor: 'default',
        }}
        transform={
          `scale(${this.props.scaleTransform})`}
      >{tiles}{this.borderRectangle()}
      </g>
    );
  }
}

WordwallsQuestion.defaultProps = {
  scaleTransform: 1.0,
  letters: '',
};

WordwallsQuestion.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  letters: PropTypes.string,
  qNumber: PropTypes.number.isRequired,
  words: PropTypes.instanceOf(Immutable.Map).isRequired,
  gridX: PropTypes.number.isRequired,
  gridY: PropTypes.number.isRequired,
  xSize: PropTypes.number.isRequired,
  ySize: PropTypes.number.isRequired,
  onShuffle: PropTypes.func.isRequired,
  scaleTransform: PropTypes.number,
};

export default WordwallsQuestion;
