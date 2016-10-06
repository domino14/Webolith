define([
  'react',
  'jsx!reactapp/topbar/prefs_modal_body'
], function(React, PrefsModalBody) {
  "use strict";

  return React.createClass({
    render: function() {


      return (
        <div className="modal fade prefs-modal"
          role="dialog"
          tabIndex="-1">
          <div className="modal-dialog modal-lg"
            role="document">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4
                  className="modal-title">Preferences</h4>
              </div>

              <PrefsModalBody
                displayStyle={this.props.displayStyle}/>

              <div className="modal-footer">
                <button type="button"
                  className="btn btn-default"
                  data-dismiss="modal">Close</button>
                <button type="button"
                  className="btn btn-primary">Save changes</button>
              </div>

            </div>
          </div>
        </div>
      );
    }
  });
});