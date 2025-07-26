import React from 'react';

import Utils from './utils';

import { darkBackgrounds } from './background';
import fonts, { type Fonts } from './fonts';

interface QuestionTextProps {
  font: string;
  bold: boolean;
  x: number;
  y: number;
  fontSize: number;
  letters: string;
  background: string;
  bodyBackground: string;
}

function QuestionText({
  font,
  bold,
  x,
  y,
  fontSize,
  letters,
  background,
  bodyBackground,
}: QuestionTextProps) {
  let fontColor = '#111111';
  // If the background is dark, make the text white.
  if (
    darkBackgrounds.has(background)
    || (background === '' && darkBackgrounds.has(bodyBackground))
  ) {
    fontColor = '#eeeeee';
  }

  const fontWeight = bold ? 'bold' : 'normal';

  return (
    <text
      x={x}
      y={y}
      dy={(fonts as Fonts)[font].dy}
      fontFamily={(fonts as Fonts)[font].fontFamily}
      fontSize={`${fontSize}%`}
      stroke={fontColor}
      fill={fontColor}
      fontWeight={fontWeight}
      strokeWidth="0.5px"
    >
      {Utils.displaySpanishDigraphs(letters)}
    </text>
  );
}

export default QuestionText;
