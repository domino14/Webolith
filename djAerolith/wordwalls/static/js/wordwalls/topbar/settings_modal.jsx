import React from 'react';

import ModalSkeleton from '../modal_skeleton';
import SettingsModalBody from './settings_modal_body';
import Styling from '../style';

class SettingsModal extends React.Component {
  constructor(props) {
    super(props);
    // Create a copy of this.props.displayStyle, used only for
    // rendering preferences.
    this.state = {
      style: this.props.displayStyle.copy(),
      isMultiplayer: this.props.isMultiplayer,
    };
    this.onWordwallsOptionsModify = this.onWordwallsOptionsModify.bind(this);
    this.saveWordwallsChanges = this.saveWordwallsChanges.bind(this);
    this.reset = this.reset.bind(this);
  }

  /**
   * When an option in the modal changes, this function will get called,
   * which will update the state accordingly.
   */
  onWordwallsOptionsModify(stateKey, value) {
    this.state.style.setStyleKey(stateKey, value);
    this.setState({
      style: this.state.style,
    });
  }

  reset(displayStyle) {
    this.setState({
      style: displayStyle.copy(),
    });
  }

  /**
   * Call the save function in this.props to persist the state to the
   * backend. Note that instead of reading DOM elements we're just
   * persisting the state itself, which should track all of the changes.
   */
  saveWordwallsChanges() {
    this.props.onSave(this.state.style);
  }

  render() {
    return (
      <ModalSkeleton
        title="Settings"
        modalClass="settings-modal"
        size="modal-xl"
      >
        <SettingsModalBody
          onWordwallsOptionsModify={this.onWordwallsOptionsModify}
          displayStyle={this.state.style}
          saveWordwallsChanges={this.saveWordwallsChanges}
          isMultiplayer={this.state.isMultiplayer}
        />
      </ModalSkeleton>
    );
  }
}

SettingsModal.propTypes = {
  displayStyle: React.PropTypes.instanceOf(Styling),
  onSave: React.PropTypes.func,
  isMultiplayer: React.PropTypes.bool,
};

export default SettingsModal;
