/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events */
import React, { useRef } from 'react';

import SettingsModal from './settings_modal';
import Styling from '../style';

interface SettingsCogProps {
  displayStyle: Styling;
  onSave: (style: Styling) => void;
}

function SettingsCog({ displayStyle, onSave }: SettingsCogProps) {
  const myPrefsModalRef = useRef<React.ComponentRef<typeof SettingsModal> | null>(null);

  const resetSettings = () => {
    // Make sure that the settings modal matches the display style
    // currently in the props.
    if (myPrefsModalRef.current) {
      myPrefsModalRef.current.reset(displayStyle);
    }
  };

  return (
    <div>
      <div
        data-toggle="modal"
        title="Settings"
        onClick={resetSettings}
        data-target=".settings-modal"
      >
        <i
          className="glyphicon glyphicon-cog hovertip"
          style={{ fontSize: '175%' }}
          aria-hidden="true"
          title="Settings"
          data-toggle="tooltip"
        />
      </div>
      <SettingsModal
        ref={myPrefsModalRef}
        displayStyle={displayStyle}
        onSave={onSave}
      />
    </div>
  );
}

export default SettingsCog;
