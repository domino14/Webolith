import React from 'react';
import Utils from './utils';

const QuestionText = (props) => {
  let fontFamily;
  if (props.font === 'mono') {
    fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';
  } else if (props.font === 'sans') {
    fontFamily = 'Arial,Geneva,Helvetica,Helv,sans-serif';
  }
  const fontWeight = props.bold ? 'bold' : 'normal';

  return (
    <text
      x={props.x}
      y={props.y}
      fontFamily={fontFamily}
      alignmentBaseline="central"
      fontSize={`${props.fontSize}%`}
      stroke={props.color[3]}
      fill={props.color[3]}
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
  color: React.PropTypes.array,
  letters: React.PropTypes.string,
};

export default QuestionText;
