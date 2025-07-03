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

  componentDidUpdate(prevProps) {
    // If displayStyle prop changes (like after saving), update the internal state
    if (prevProps.displayStyle !== this.props.displayStyle) {
      this.setState({
        style: this.props.displayStyle.copy(),
      });
    }
  }

  /**
   * When an option in the modal changes, this function will get called,
   * which will update the state accordingly.
   */
  onWordwallsOptionsModify(stateKey, value) {
    this.setState((state) => {
      state.style.setStyleKey(stateKey, value);

      // If dark mode is toggled, apply it immediately
      if (stateKey === 'darkMode') {
        // Apply dark mode immediately without saving
        if (value) {
          document.body.classList.add('dark-mode');

          // Also apply dark mode to any existing modals
          import('../modal_dark_mode')
            .then(({ applyDarkModeToExistingModals, setupDarkModeModalObserver }) => {
              setTimeout(() => {
                applyDarkModeToExistingModals();
                setupDarkModeModalObserver();
              }, 100);
            });
        } else {
          document.body.classList.remove('dark-mode');
          // No need to handle removing dark mode from modals as the CSS will take care of it
        }
      }

      return { style: state.style };
    });
  }

  reset(displayStyle) {
    const newStyle = displayStyle.copy();

    // Make sure dark mode class matches the current style
    if (newStyle.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    this.setState({
      style: newStyle,
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
