import React from 'react';

const GameTile = (props) => {
  let letter;
  let fontSize;
  const transform = `translate(${props.x},${props.y})`;
  const fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';

  letter = props.letter;
  fontSize = props.fontSize;
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
        strokeWidth="0.5px"
        stroke="black"
        fill={props.color.color}
        opacity={props.color.opacity}
        rx={1}  /* radiuses */
        ry={1}
      />
      <text
        x={props.width / 2}
        y={props.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={fontFamily}
        fontSize={`${fontSize}%`}
        stroke={props.color.textColor}
        fill={props.color.textColor}
        strokeWidth="0.75px"
      >{letter}</text>
    </g>
  );
};

GameTile.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  letter: React.PropTypes.string,
  fontSize: React.PropTypes.number,
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  color: React.PropTypes.shape({
    color: React.PropTypes.string,
    opacity: React.PropTypes.number,
    textColor: React.PropTypes.string,
    alternateTextColor: React.PropTypes.string,
  }),
};

export default GameTile;
