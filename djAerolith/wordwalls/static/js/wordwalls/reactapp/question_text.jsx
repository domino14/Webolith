define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      var transform, fontFamily, fontWeight;
      transform = "translate(" + this.props.x + "," + this.props.y + ")";
      if (this.props.font === 'mono') {
        fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';
      } else if (this.props.font === 'sans') {
        fontFamily = 'Arial,Geneva,Helvetica,Helv,sans-serif';
      }
      fontWeight = this.props.bold ? "bold" : "normal";

      return (
        <text
          x={this.props.x}
          y={this.props.y}
          fontFamily={fontFamily}
          alignmentBaseline="central"
          fontSize={this.props.fontSize}
          stroke={this.props.color[3]}
          fill={this.props.color[3]}
          fontWeight={fontWeight}
          strokeWidth="0.5px">{this.props.letters}</text>
      );
    }
  });
});