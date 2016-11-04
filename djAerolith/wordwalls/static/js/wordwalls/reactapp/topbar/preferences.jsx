define([
  'react',
  'jsx!reactapp/topbar/prefs_modal',
  'bootstrap'
], function(React, PrefsModal) {
  "use strict";
  return React.createClass({
    resetSettings: function() {
      this.myPrefsModal.reset();
    },
    render: function() {
      return (
        <div>
          <div
            data-toggle="modal"
            onClick={this.resetSettings}
            data-target=".prefs-modal"
          >
            <i
              className="fa fa-cog fa-2x"
              aria-hidden="true"
            />
          </div>
          <PrefsModal
            ref={ref => (this.myPrefsModal = ref)}
            displayStyle={this.props.displayStyle}
            onSave={this.props.onSave}
          />
        </div>
      );
    }
  });
});