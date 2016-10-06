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
                className="form-control input-sm"/>
            </div>
          </div>
        </div>
      );
    }

  });
});