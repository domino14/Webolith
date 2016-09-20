define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      return (
        <div className="row">
          <div className="col-md-3">
            <button
              className="btn btn-info btn-xs"
              style={{width: 125}}
              type="button"
              onClick={this.props.shuffle}>
              <span
                className="badge">1</span> Shuffle
            </button>
          </div>
          <div className="col-md-3 col-md-offset-1">
            <button
              className="btn btn-info btn-xs"
              style={{width: 125}}
              type="button"
              onClick={this.props.alphagram}>
              <span
                className="badge">2</span> Alphagram
            </button>
          </div>
          <div className="col-md-3 col-md-offset-1">
            <button
              className="btn btn-info btn-xs"
              style={{width: 125}}
              type="button"
              onClick={this.props.customOrder}>
              <span
                className="badge">3</span> Custom
            </button>
          </div>
        </div>
      );
    }
  });
});