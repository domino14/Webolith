import React, {
  useState, useEffect, useCallback, forwardRef, useImperativeHandle,
} from 'react';

import ModalSkeleton from '../modal_skeleton';
import SettingsModalBody from './settings_modal_body';
import Styling from '../style';

interface SettingsModalProps {
  displayStyle: Styling;
  onSave: (style: Styling) => void;
}

export interface SettingsModalRef {
  reset: (displayStyle: Styling) => void;
}

const SettingsModal = forwardRef<SettingsModalRef, SettingsModalProps>(({
  displayStyle,
  onSave,
}, ref) => {
  // Create a copy of displayStyle, used only for rendering preferences.
  const [style, setStyle] = useState(() => displayStyle.copy());

  useEffect(() => {
    // If displayStyle prop changes (like after saving), update the internal state
    setStyle(displayStyle.copy());
  }, [displayStyle]);

  /**
   * When an option in the modal changes, this function will get called,
   * which will update the state accordingly.
   */
  const onWordwallsOptionsModify = useCallback((stateKey: string, value: unknown) => {
    // Create a copy of the current style
    const updatedStyle = style.copy();
    updatedStyle.setStyleKey(stateKey, value);

    // If dark mode is toggled, apply it immediately
    if (stateKey === 'darkMode') {
      // Apply dark mode immediately without saving
      if (value) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');

        // Update backgrounds to appropriate ones for dark mode
        import('../background')
          .then(({ getAppropriateBackground }) => {
            // Only update if the current background isn't suitable for dark mode
            const newBackground = getAppropriateBackground(updatedStyle.background, true, false);
            const newBodyBackground = getAppropriateBackground(
              updatedStyle.bodyBackground,
              true,
              true,
            );

            if (newBackground !== updatedStyle.background) {
              updatedStyle.setStyleKey('background', newBackground);
            }
            if (newBodyBackground !== updatedStyle.bodyBackground) {
              updatedStyle.setStyleKey('bodyBackground', newBodyBackground);
            }

            // Update state with new style to refresh the UI
            setStyle(updatedStyle);
          });

        // Bootstrap 5 handles modal theming automatically via data-bs-theme
      } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');

        // Update backgrounds to appropriate ones for light mode
        import('../background')
          .then(({ getAppropriateBackground }) => {
            // Get current backgrounds for logging
            const currentBackground = updatedStyle.background;
            const currentBodyBackground = updatedStyle.bodyBackground;

            // Only update if the current background isn't suitable for light mode
            let newBackground = getAppropriateBackground(currentBackground, false, false);
            let newBodyBackground = getAppropriateBackground(currentBodyBackground, false, true);

            // eslint-disable-next-line no-console
            console.log(
              'Background transition:',
              currentBackground,
              '->',
              newBackground,
              'Body:',
              currentBodyBackground,
              '->',
              newBodyBackground,
            );

            // Make sure we don't default to empty background ('None') when switching to light mode
            // unless that was the explicit choice before
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
            setStyle(updatedStyle);
          });

        // Bootstrap 5 handles modal theming automatically via data-bs-theme
      }
    } else {
      // For all other options, just update the state
      setStyle(updatedStyle);
    }
  }, [style]);

  const reset = useCallback((newDisplayStyle: Styling) => {
    const newStyle = newDisplayStyle.copy();

    // Make sure dark mode attribute matches the current style
    if (newStyle.darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    setStyle(newStyle);
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
  }), [reset]);

  /**
   * Call the save function in props to persist the state to the
   * backend. Note that instead of reading DOM elements we're just
   * persisting the state itself, which should track all of the changes.
   */
  const saveWordwallsChanges = useCallback(() => {
    onSave(style);
  }, [style, onSave]);

  return (
    <ModalSkeleton
      title="Settings"
      modalClass="settings-modal"
      size="modal-xl"
    >
      <SettingsModalBody
        onWordwallsOptionsModify={onWordwallsOptionsModify}
        displayStyle={style}
        saveWordwallsChanges={saveWordwallsChanges}
      />
    </ModalSkeleton>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
