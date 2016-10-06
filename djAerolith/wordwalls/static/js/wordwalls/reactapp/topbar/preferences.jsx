define([
  'react',
  'jsx!reactapp/topbar/prefs_modal',
  'bootstrap'
], function(React, PrefsModal) {
  "use strict";
  return React.createClass({

    render: function() {
      return (
        <div>
          <button
            type="button"
            data-toggle="modal"
            data-target=".prefs-modal">
            <i className="fa fa-cog fa-2x"
              aria-hidden="true"></i>
          </button>
          <PrefsModal
            displayStyle={this.props.displayStyle}
          />
        </div>
      );
    }
  });
});