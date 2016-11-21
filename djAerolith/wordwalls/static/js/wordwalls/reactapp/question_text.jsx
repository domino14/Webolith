import React from 'react';
import Utils from './utils';

const QuestionText = (props) => {
  let fontFamily;
  if (props.font === 'mono') {
    fontFamily = '"Courier New",monospace';
  } else if (props.font === 'sans') {
    fontFamily = 'Arial,Geneva,Helvetica,Helv,sans-serif';
  } else if (props.font === 'sansmono') {
    fontFamily = 'Monaco,Consolas,"Ubuntu Mono",monospace';
  }
  const fontWeight = props.bold ? 'bold' : 'normal';

  return (
    <text
      x={props.x}
      y={props.y}
      fontFamily={fontFamily}
      dominantBaseline="central"
      fontSize={`${props.fontSize}%`}
      stroke="#000000"
      fill="#000000"
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
