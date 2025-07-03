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
    // Create a copy of the current style
    const updatedStyle = this.state.style.copy();
    updatedStyle.setStyleKey(stateKey, value);

    // If dark mode is toggled, apply it immediately
    if (stateKey === 'darkMode') {
      // Apply dark mode immediately without saving
      if (value) {
        document.body.classList.add('dark-mode');

        // Update backgrounds to appropriate ones for dark mode
        import('../background')
          .then(({ getAppropriateBackground }) => {
            // Only update if the current background isn't suitable for dark mode
            const newBackground = getAppropriateBackground(updatedStyle.background, true, false);
            // eslint-disable-next-line max-len
            const newBodyBackground = getAppropriateBackground(updatedStyle.bodyBackground, true, true);

            if (newBackground !== updatedStyle.background) {
              updatedStyle.setStyleKey('background', newBackground);
            }
            if (newBodyBackground !== updatedStyle.bodyBackground) {
              updatedStyle.setStyleKey('bodyBackground', newBodyBackground);
            }

            // Update state with new style to refresh the UI
            this.setState({ style: updatedStyle });
          });

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

        // Update backgrounds to appropriate ones for light mode
        import('../background')
          .then(({ getAppropriateBackground }) => {
            // Get current backgrounds for logging
            const currentBackground = updatedStyle.background;
            const currentBodyBackground = updatedStyle.bodyBackground;

            // Only update if the current background isn't suitable for light mode
            let newBackground = getAppropriateBackground(currentBackground, false, false);
            // eslint-disable-next-line max-len
            let newBodyBackground = getAppropriateBackground(currentBodyBackground, false, true);

            // eslint-disable-next-line max-len, no-console
            console.log('Background transition:', currentBackground, '->', newBackground, 'Body:', currentBodyBackground, '->', newBodyBackground);

            // eslint-disable-next-line max-len
            // Make sure we don't default to empty background ('None') when switching to light mode unless that was the explicit choice before
            if (newBackground === '' && currentBackground !== '') {
              // Default to 'pool_table' for the main background if coming from a dark background
              newBackground = 'pool_table';
              // eslint-disable-next-line no-console
              console.log('Correcting empty background to pool_table');
            }

            if (newBodyBackground === '' && currentBodyBackground !== '') {
              // Default to 'hexellence' for the body background if coming from a dark background
              newBodyBackground = 'hexellence';
              // eslint-disable-next-line no-console
              console.log('Correcting empty body background to hexellence');
            }

            // Then set the background values
            if (newBackground !== updatedStyle.background) {
              updatedStyle.setStyleKey('background', newBackground);
            }
            if (newBodyBackground !== updatedStyle.bodyBackground) {
              updatedStyle.setStyleKey('bodyBackground', newBodyBackground);
            }

            // Update state with new style to refresh the UI
            this.setState({ style: updatedStyle });
          });

        // Explicitly remove dark mode from modals when switching to light mode
        import('../modal_dark_mode')
          .then(({ removeDarkModeFromExistingModals }) => {
            setTimeout(() => {
              removeDarkModeFromExistingModals();
            }, 100);
          });
      }
    } else {
      // For all other options, just update the state
      this.setState({ style: updatedStyle });
    }
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
