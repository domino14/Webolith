define([
  'react'
], function(React) {
  "use strict";

  var classMap;
  classMap = {
    'server': 'text-muted',
    'error': 'text-danger',
    'chat': ''
  };

  return React.createClass({
    render: function() {
      var cn = classMap[this.props.type];
      return (
        <div>
          <span className={cn}>{this.props.children}</span>
        </div>
      );
    }
  });
});