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
      stroke={props.color.alternateTextColor}
      fill={props.color.alternateTextColor}
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
  color: React.PropTypes.shape({
    color: React.PropTypes.string,
    opacity: React.PropTypes.number,
    textColor: React.PropTypes.string,
    alternateTextColor: React.PropTypes.string,
  }),
  letters: React.PropTypes.string,
};

export default QuestionText;
