import React from 'react';
import PropTypes from 'prop-types';

import Utils from './utils';

import { darkBackgrounds } from './background';
import fonts from './fonts';

const QuestionText = (props) => {
  let fontColor = '#111111';
  // If the background is dark, make the text white.
  if (darkBackgrounds.has(props.background) ||
      (props.background === '' && darkBackgrounds.has(props.bodyBackground))) {
    fontColor = '#eeeeee';
  }

  const fontWeight = props.bold ? 'bold' : 'normal';

  return (
    <text
      x={props.x}
      y={props.y}
      dy={fonts[props.font].dy}
      fontFamily={fonts[props.font].fontFamily}
      fontSize={`${props.fontSize}%`}
      stroke={fontColor}
      fill={fontColor}
      fontWeight={fontWeight}
      strokeWidth="0.5px"
    >{Utils.displaySpanishDigraphs(props.letters)}
    </text>
  );
};

QuestionText.propTypes = {
  font: PropTypes.string.isRequired,
  bold: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  fontSize: PropTypes.number.isRequired,
  letters: PropTypes.string.isRequired,
  background: PropTypes.string.isRequired,
  bodyBackground: PropTypes.string.isRequired,
};

export default QuestionText;
