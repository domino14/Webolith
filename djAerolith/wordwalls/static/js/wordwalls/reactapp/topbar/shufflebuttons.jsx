define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      return (
        <div>
          <div className="row">
            <div className="col-md-3">
              <button
                className="btn btn-info btn-sm"
                style={{width: 125}}
                type="button">
                <span
                  className="badge">1</span> Shuffle
              </button>
            </div>
            <div className="col-md-3 col-md-offset-1">
              <button
                className="btn btn-info btn-sm"
                style={{width: 125}}
                type="button">
                <span
                  className="badge">2</span> Alphagram
              </button>
            </div>
            <div className="col-md-3 col-md-offset-1">
              <button
                className="btn btn-info btn-sm"
                style={{width: 125}}
                type="button">
                <span
                  className="badge">3</span> Custom
              </button>
            </div>
          </div>
        </div>
      );
    }
  });
});