define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    propTypes: {
      width: React.PropTypes.number,
      height: React.PropTypes.number,
      letter: React.PropTypes.string,
      fontSize: React.PropTypes.number,
      x: React.PropTypes.number,
      y: React.PropTypes.number,
      color: React.PropTypes.array,
    },
    render: function() {
      var transform, fontFamily, letter, fontSize;
      transform = `translate(${this.props.x},${this.props.y})`;
      fontFamily = 'Menlo,Consolas,"Ubuntu Mono",monospace';

      letter = this.props.letter;
      fontSize = this.props.fontSize;
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
            width={this.props.width}
            height={this.props.height}
            strokeWidth="0.5px"
            stroke="black"
            fill={this.props.color[0]}
            opacity={this.props.color[1]}
            rx={1}  /* radiuses */
            ry={1}
          />
          <text
            x={this.props.width / 2}
            y={this.props.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fontFamily}
            fontSize={`${fontSize}%`}
            stroke={this.props.color[2]}
            fill={this.props.color[2]}
            strokeWidth="0.75px"
          >{letter}</text>
        </g>
      );
    }
  });
});