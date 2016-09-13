define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      var transform, fontFamily;
      transform = "translate(" + this.props.x + "," + this.props.y + ")";
      fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';
      return (
        <g transform={transform}>
          <rect
            width={this.props.width}
            height={this.props.height}
            strokeWidth="0.5px"
            stroke="black"
            fill={this.props.color[0]}
            opacity={this.props.color[1]}
            rx={1}  /* radiuses */
            ry={1}/>
          <text
            x={this.props.width/2}
            y={this.props.height/2}
            textAnchor="middle"
            alignmentBaseline="central"
            fontFamily={fontFamily}
            fontSize="160%"
            stroke={this.props.color[2]}
            fill={this.props.color[2]}
            strokeWidth="1px">{this.props.letter}</text>
        </g>
      );
    }
  });
});