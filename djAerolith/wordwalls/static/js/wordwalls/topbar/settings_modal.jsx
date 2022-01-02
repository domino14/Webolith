import React from 'react';
import PropTypes from 'prop-types';

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
    this.setState((state) => {
      state.style.setStyleKey(stateKey, value);
      return { style: state.style };
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
        />
      </ModalSkeleton>
    );
  }
}

SettingsModal.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  onSave: PropTypes.func.isRequired,
};

export default SettingsModal;
