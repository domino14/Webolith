define([
  'react',
  'jsx!reactapp/topbar/prefs_modal_body'
], function(React, PrefsModalBody) {
  "use strict";

  return React.createClass({
    getInitialState: function() {
      return {
        tilesOn: this.props.displayStyle.tc.on,
        customTileOrder: this.props.displayStyle.tc.customOrder,
        blankCharacter: this.props.displayStyle.tc.blankCharacter,
        fontSans: this.props.displayStyle.tc.font === 'sans',
        showBorders: this.props.displayStyle.bc.showBorders,
        // showChips is not a legacy option so let's set it to false
        // so that it's not an uncontrolled component.
        // (undefined value/checked causes an uncontrolled component)
        showChips: this.props.displayStyle.tc.showChips || false,
        showBold: this.props.displayStyle.tc.bold,

        saveAllowed: true
      };
    },

    /**
     * When an option in the modal changes, this function will get called,
     * which will update the state accordingly.
     */
    onOptionsModify: function(stateKey, value) {
      var newState = {};
      newState[stateKey] = value;
      this.setState(newState);
    },

    /**
     * Call the save function in this.props to persist the state to the
     * backend. Note that instead of reading DOM elements we're just
     * persisting the state itself, which should track all of the changes.
     */
    saveChanges: function() {
      this.props.onSave({
        tc: {
          on: this.state.tilesOn,
          bold: this.state.showBold,
          customOrder: this.state.customTileOrder,
          blankCharacter: this.state.blankCharacter,
          font: this.state.fontSans ? 'sans' : 'mono',
          showChips: this.state.showChips
        },
        bc: {
          showBorders: this.state.showBorders
        }
      });
    },

    allowSave: function(allow) {
      this.setState({
        saveAllowed: allow
      });
    },

    render: function() {
      var savebtnClass;
      savebtnClass = 'btn btn-primary';
      if (!this.state.saveAllowed) {
        savebtnClass += ' disabled';
      }

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
                // The displayStyle in the modal body will be initialized
                // with whatever the user originally has saved.
                // However, the PrefsModalBody will keep its own state
                // as to what is checked/selected. This seems easiest.
                initialSettings={this.props.displayStyle}
                onOptionsModify={this.onOptionsModify}
                tilesOn={this.state.tilesOn}
                customTileOrder={this.state.customTileOrder}
                blankCharacter={this.state.blankCharacter}
                fontSans={this.state.fontSans}
                showBorders={this.state.showBorders}
                showChips={this.state.showChips}
                showBold={this.state.showBold}
                allowSave={this.allowSave}
              />

              <div className="modal-footer">
                <button type="button"
                  className="btn btn-default"
                  data-dismiss="modal">Close</button>
                <button type="button"
                  className={savebtnClass}
                  onClick={this.saveChanges}>Save changes</button>
              </div>

            </div>
          </div>
        </div>
      );
    }
  });
});