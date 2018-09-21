import React from 'react';
import PropTypes from 'prop-types';

import fonts from './fonts';

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

const GameTile = (props) => {
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
      >{letter}
      </text>
    </g>
  );
};

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

export default GameTile;
