import React from 'react';

import fonts, { type Fonts } from './fonts';

const ColorConstants = {
  White: '#feffff',
  Black: '#3e3f3a',
  Green: '#5ef386',
  Yellow: '#d3e948',
  Blue: '#60c0dc',
  Purple: '#725ef3',
  Magenta: '#e95ad6',
};

interface ChipColor {
  color: string;
  opacity: number;
  textColor: string;
  outline: string;
}

function getColorFromAnagrams(numAnagrams: number): ChipColor {
  let effectiveNumAnagrams = numAnagrams;
  if (numAnagrams > 9) {
    effectiveNumAnagrams = 9;
  }
  const colorMap: Record<number, ChipColor> = {
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
  };
  return colorMap[effectiveNumAnagrams];
}

interface GameChipProps {
  x: number;
  y: number;
  radius: number;
  fontSize: number;
  number: number;
}

function GameChip({
  x, y, radius, fontSize, number,
}: GameChipProps) {
  const transform = `translate(${x + radius}, ${y + radius})`;
  const color = getColorFromAnagrams(number);
  return (
    <g transform={transform}>
      <circle
        cx={0}
        cy={0}
        r={radius}
        stroke={color.outline}
        strokeWidth="0.5px"
        fill={color.color}
        opacity={color.opacity}
      />
      <text
        x={0}
        y={0}
        dy={(fonts as Fonts).sansmono.dy}
        textAnchor="middle"
        fontFamily={(fonts as Fonts).sansmono.fontFamily}
        fontSize={`${fontSize}%`}
        stroke={color.textColor}
        fill={color.textColor}
        strokeWidth="1px"
      >
        {number}
      </text>
    </g>
  );
}

export default GameChip;
