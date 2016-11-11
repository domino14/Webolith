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
        fill={props.color[0]}
        opacity={props.color[1]}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={fontFamily}
        fontSize={`${props.fontSize}%`}
        stroke={props.color[2]}
        fill={props.color[2]}
        strokeWidth="1px"
      >{props.number}</text>
    </g>
  );
};

GameChip.propTypes = {
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  radius: React.PropTypes.number,
  color: React.PropTypes.array,
  fontSize: React.PropTypes.number,
  number: React.PropTypes.number,
};

export default GameChip;
