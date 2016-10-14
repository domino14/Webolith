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
                name={this.props.inputName}
                checked={this.props.on}
                value={this.props.inputName /* doesn't matter */}
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