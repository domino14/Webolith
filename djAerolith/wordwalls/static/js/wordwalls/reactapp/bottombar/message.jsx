define([
  'react'
], function(React) {
  "use strict";

  var colorMap;
  colorMap = {
    // muted blueish info color
    'server': 'cyan',
    'error': 'red',
    'chat': 'black'
  };

  return React.createClass({
    render: function() {
      var color = colorMap[this.props.type];
      return (
        <div>
          <span style={{color: color}}>{this.props.children}</span>
        </div>
      );
    }
  });
});