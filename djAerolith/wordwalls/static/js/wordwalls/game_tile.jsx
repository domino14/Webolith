import React from 'react';
import PropTypes from 'prop-types';

import fonts from './fonts';

// const LETTER_VALUES = {
//   A: 1,
//   B: 3,
//   C: 3,
//   D: 2,
//   E: 1,
//   F: 4,
//   G: 2,
//   H: 4,
//   I: 1,
//   J: 8,
//   K: 5,
//   L: 1,
//   M: 3,
//   N: 1,
//   O: 1,
//   P: 3,
//   Q: 10,
//   R: 1,
//   S: 1,
//   T: 1,
//   U: 1,
//   V: 4,
//   W: 4,
//   X: 8,
//   Y: 4,
//   Z: 10,
//   '?': 0,
// };

/**
 * Get a color given a string tile style. The tile style is just a
 * stringified number from 1 - 9.
 */
function colorFromTileStyle(style) {
  return {
    1: {
      color: '#4417b7',
      outline: '#492889',
      textColor: '#ffffff',
    },
    2: {
      color: '#fdb72b',
      outline: '#a57719',
      textColor: '#000000',
    },
    3: {
      color: '#dcf834',
      outline: '#ecfa7b',
      textColor: '#000000',
    },
    4: {
      color: '#ca0813',
      outline: '#650205',
      textColor: '#ffffff',
    },
    5: {
      color: '#333333',
      outline: '#000000',
      textColor: '#ffffff',
    },
    6: {
      color: '#fedf32',
      outline: '#fee651',
      textColor: '#000000',
    },
    7: {
      color: '#dddddd',
      outline: '#bbbbbb',
      textColor: '#000000',
    },
    8: {
      color: '#f75a50',
      outline: '#a93733',
      textColor: '#f6eeeb',
    },
    9: {
      color: '#229875',
      outline: '#145537',
      textColor: '#dbe5e6',
    },
  }[style];
}

// Get the desired font size and weights as a function of the width.
function tileProps(width) {
  // This formula is not the most scientific. The tiles look optimal at 130%
  // if the tile size is 31.
  const size = (130 / 31) * width;
  let weight = '500';
  if (width < 24) {
    weight = '300';
  }
  const valueSize = (80 / 31) * width;
  return {
    size,
    weight,
    valueSize,
  };
}

function GameTile(props) {
  let { fontSize, letter } = props;
  let transform = `translate(${props.x},${props.y})`;
  if (props.angle !== 0) {
    transform = `${transform} rotate(${props.angle}, ${props.width / 2}, ${props.height / 2})`;
  }
  const fontWeight = props.bold ? 'bold' : 'normal';
  const color = colorFromTileStyle(props.tileStyle);

  switch (letter) {
    case '1':
      letter = 'CH';
      fontSize *= 0.62;
      break;
    case '2':
      letter = 'LL';
      fontSize *= 0.62;
      break;
    case '3':
      letter = 'RR';
      fontSize *= 0.62;
      break;
    case 'Ñ':
      letter = 'ñ';
      break;
    default:
      break;
  }

  return (
    <g transform={transform}>
      <rect
        width={props.width}
        height={props.height}
        strokeWidth={props.strokeWidth}
        stroke={color.outline}
        fill={color.color}
        rx={2} /* radiuses */
        ry={2}
      />
      <text
        x={props.width / 2}
        y={props.height / 2}
        dy={fonts[props.font].dy}
        textAnchor="middle"
        fontFamily={fonts[props.font].fontFamily}
        fontWeight={fontWeight}
        fontSize={`${fontSize}%`}
        stroke={color.textColor}
        fill={color.textColor}
      >
        {letter}
      </text>
      {/* <PointValue
        fontFamily={fonts[props.font].fontFamily}
        dy={fonts[props.font].dy}
        stroke={color.textColor}
        fill={color.textColor}
        value={LETTER_VALUES[letter]}
        tileWidth={props.width}
        tileHeight={props.height}
      /> */}
    </g>
  );
}

GameTile.propTypes = {
  width: PropTypes.number.isRequired,
  strokeWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  letter: PropTypes.string.isRequired,
  fontSize: PropTypes.number.isRequired,
  tileStyle: PropTypes.string.isRequired,
  font: PropTypes.string.isRequired,
  bold: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  angle: PropTypes.number.isRequired,
};

function PointValue(props) {
  if (!props.value) {
    return null;
  }
  const font = tileProps(props.tileWidth);
  return (
    <text
      x={8.5 * (props.tileWidth / 10)}
      y={8.5 * (props.tileHeight / 10)}
      dy={props.dy}
      textAnchor="middle"
      fontFamily={props.fontFamily}
      fontSize={`${font.valueSize}%`}
      stroke={props.stroke}
      strokeWidth="0.05px"
      fill={props.fill}
    >
      {props.value}
    </text>
  );
}

PointValue.propTypes = {
  fontFamily: PropTypes.string.isRequired,
  dy: PropTypes.number.isRequired,
  stroke: PropTypes.string.isRequired,
  fill: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  tileWidth: PropTypes.number.isRequired,
  tileHeight: PropTypes.number.isRequired,
};

export default GameTile;
