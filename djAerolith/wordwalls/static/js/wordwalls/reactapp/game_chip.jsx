import React from 'react';

const GameChip = (props) => {
  const transform = `translate(${props.x + props.radius}, ${props.y + props.radius})`;
  const fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';

  return (
    <g transform={transform}>
      <circle
        cx={0}
        cy={0}
        r={props.radius}
        stroke="black"
        strokeWidth="0.5px"
        fill={props.color.color}
        opacity={props.color.opacity}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={fontFamily}
        fontSize={`${props.fontSize}%`}
        stroke={props.color.textColor}
        fill={props.color.textColor}
        strokeWidth="1px"
      >{props.number}</text>
    </g>
  );
};

GameChip.propTypes = {
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  radius: React.PropTypes.number,
  color: React.PropTypes.shape({
    color: React.PropTypes.string,
    opacity: React.PropTypes.number,
    textColor: React.PropTypes.string,
    alternateTextColor: React.PropTypes.string,
  }),
  fontSize: React.PropTypes.number,
  number: React.PropTypes.number,
};

export default GameChip;
