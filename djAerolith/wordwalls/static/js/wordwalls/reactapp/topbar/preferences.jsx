define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    handleCogClick: function() {
      // do nothing for now.
      console.log('The cog was clicked.');
    },
    render: function() {
      return (
        <div>
          <i className="fa fa-cog fa-2x"
            aria-hidden="true"
            onClick={this.handleCogClick}></i>
        </div>
      );
    }
  });
});