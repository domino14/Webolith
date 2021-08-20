import React from 'react';
import PropTypes from 'prop-types';

import fonts from './fonts';

const ColorConstants = {
  White: '#feffff',
  Black: '#3e3f3a',
  Green: '#5ef386',
  Yellow: '#d3e948',
  Blue: '#60c0dc',
  Purple: '#725ef3',
  Magenta: '#e95ad6',
};

function getColorFromAnagrams(numAnagrams) {
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
      color: ColorConstants.Magenta,
      opacity: 1,
      textColor: ColorConstants.White,
      outline: '#7e7f7a',
    },
    5: {
      color: ColorConstants.Green,
      opacity: 1,
      textColor: ColorConstants.Black,
      outline: '#7e7f7a',
    },
    4: {
      color: ColorConstants.Yellow,
      opacity: 1,
      textColor: ColorConstants.Black,
      outline: '#7e7f7a',
    },
    3: {
      color: ColorConstants.Blue,
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
      color: ColorConstants.White,
      opacity: 1,
      textColor: ColorConstants.Black,
      outline: '#7e7f7a',
    },
  }[effectiveNumAnagrams];
}

const GameChip = (props) => {
  const transform = `translate(${props.x + props.radius}, ${props.y + props.radius})`;
  const color = getColorFromAnagrams(props.number);
  return (
    <g transform={transform}>
      <circle
        cx={0}
        cy={0}
        r={props.radius}
        stroke={color.outline}
        strokeWidth="0.5px"
        fill={color.color}
        opacity={color.opacity}
      />
      <text
        x={0}
        y={0}
        dy={fonts.sansmono.dy}
        textAnchor="middle"
        fontFamily={fonts.sansmono.fontFamily}
        fontSize={`${props.fontSize}%`}
        stroke={color.textColor}
        fill={color.textColor}
        strokeWidth="1px"
      >
        {props.number}
      </text>
    </g>
  );
};

GameChip.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  radius: PropTypes.number.isRequired,
  fontSize: PropTypes.number.isRequired,
  number: PropTypes.number.isRequired,
};

export default GameChip;
