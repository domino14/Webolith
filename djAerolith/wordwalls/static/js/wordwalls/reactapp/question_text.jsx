import React from 'react';
import Utils from './utils';

const QuestionText = (props) => {
  let fontFamily;
  if (props.font === 'mono') {
    fontFamily = '"Courier New",monospace';
  } else if (props.font === 'sans') {
    fontFamily = 'Arial,Geneva,Helvetica,Helv,sans-serif';
  }
  const fontWeight = props.bold ? 'bold' : 'normal';

  return (
    <text
      x={props.x}
      y={props.y}
      fontFamily={fontFamily}
      dominantBaseline="central"
      fontSize={`${props.fontSize}%`}
      stroke="#3e3f3a"
      fill="#3e3f3a"
      fontWeight={fontWeight}
      strokeWidth="0.5px"
    >{Utils.displaySpanishDigraphs(props.letters)}</text>
  );
};

QuestionText.propTypes = {
  font: React.PropTypes.string,
  bold: React.PropTypes.bool,
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  fontSize: React.PropTypes.number,
  letters: React.PropTypes.string,
};

export default QuestionText;
