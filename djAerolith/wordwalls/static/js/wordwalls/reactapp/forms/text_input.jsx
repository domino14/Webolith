/**
 * @fileOverview A Bootstrap-based text input component.
 */
define([
  'react'
], function(React) {
  "use strict";

  return React.createClass({
    render: function() {
      var inputColSizeClass;
      inputColSizeClass = "col-lg-" + this.props.colSize;
      return (
        <div className="form-group">
          <div className="row">
            <div className={inputColSizeClass}>
              <label>{this.props.label}</label>
              <input type="text"
                name={this.props.inputName}
                className="form-control input-sm"
                maxLength={this.props.maxLength}
                onChange={this.props.onChange}
                onKeyPress={this.props.onKeyPress}
              />
            </div>
          </div>
        </div>
      );
    }

  });
});