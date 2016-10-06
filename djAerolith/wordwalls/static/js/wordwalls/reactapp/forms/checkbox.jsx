/**
 * @fileOverview A Bootstrap-based checkbox component.
 */
define([
  'react'
], function(React) {
  "use strict";

  return React.createClass({
    render: function() {
      return (
        <div className="form-group">
          <div className="checkbox">
            <label>
              <input
                type="checkbox"
                checked={this.props.on}
                onChange={this.props.onChange}
              />
              {this.props.label}
            </label>
          </div>
        </div>
      );
    }

  });
});