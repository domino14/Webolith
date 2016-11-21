import React from 'react';

import PrefsModalBody from './prefs_modal_body';
import Styling from '../style';

class PrefsModal extends React.Component {
  constructor(props) {
    super(props);
    // Create a copy of this.props.displayStyle, used only for
    // rendering preferences.
    this.state = {
      saveAllowed: true,
      style: this.props.displayStyle.copy(),
    };
    this.onOptionsModify = this.onOptionsModify.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.reset = this.reset.bind(this);
    this.allowSave = this.allowSave.bind(this);
  }

  /**
   * When an option in the modal changes, this function will get called,
   * which will update the state accordingly.
   */
  onOptionsModify(stateKey, value) {
    this.state.style.setStyleKey(stateKey, value);
    this.setState({
      style: this.state.style,
    });
  }

  reset(displayStyle) {
    this.setState({
      saveAllowed: true,
      style: displayStyle.copy(),
    });
  }

  /**
   * Call the save function in this.props to persist the state to the
   * backend. Note that instead of reading DOM elements we're just
   * persisting the state itself, which should track all of the changes.
   */
  saveChanges() {
    this.props.onSave(this.state.style);
  }

  allowSave(allow) {
    this.setState({
      saveAllowed: allow,
    });
  }

  render() {
    let savebtnClass;
    savebtnClass = 'btn btn-primary';
    if (!this.state.saveAllowed) {
      savebtnClass += ' disabled';
    }

    return (
      <div
        className="modal fade prefs-modal"
        role="dialog"
        tabIndex="-1"
      >
        <div
          className="modal-dialog modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <h4
                className="modal-title"
              >Preferences</h4>
            </div>

            <PrefsModalBody
              onOptionsModify={this.onOptionsModify}
              displayStyle={this.state.style}
              allowSave={this.allowSave}
            />

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
              >Close</button>
              <button
                type="button"
                className={savebtnClass}
                onClick={this.saveChanges}
                data-dismiss="modal"
              >Save changes</button>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

PrefsModal.propTypes = {
  displayStyle: React.PropTypes.instanceOf(Styling),
  onSave: React.PropTypes.func,
};

export default PrefsModal;
