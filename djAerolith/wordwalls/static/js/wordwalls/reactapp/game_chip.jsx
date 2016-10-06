define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      var transform, fontFamily;

      transform = "translate(" + (this.props.x + this.props.radius) + "," +
        (this.props.y + this.props.radius) + ")";
      fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';

      return (
        <g transform={transform}>
          <circle
            cx={0}
            cy={0}
            r={this.props.radius}
            stroke="black"
            strokeWidth="0.5px"
            fill={this.props.color[0]}
            opacity={this.props.color[1]}
            />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            alignmentBaseline="central"
            fontFamily={fontFamily}
            fontSize={this.props.fontSize}
            stroke={this.props.color[2]}
            fill={this.props.color[2]}
            strokeWidth="1px">{this.props.number}</text>
        </g>
      );

    }
  });
});