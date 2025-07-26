import React, { useState, useCallback } from 'react';

import Styling from '../style';

import WordwallsSettings from './wordwalls_settings';
// import TableSettings from './table_settings';
import SettingsSidebar from './settings_sidebar';

const SETTINGS_TYPE_WORDWALLS = 'Wordwalls Settings';
// const SETTINGS_TYPE_TABLE_SETTINGS = 'Table Settings';
// const SETTINGS_TYPE_BASE_SETTINGS = 'Aerolith Settings';

interface SettingsModalBodyProps {
  onWordwallsOptionsModify: (key: string, value: unknown) => void;
  // onTableSettingsModify?: (key: string, value: unknown) => void;
  displayStyle: Styling;
  saveWordwallsChanges: () => void;
}

function SettingsModalBody({
  onWordwallsOptionsModify,
  displayStyle,
  saveWordwallsChanges,
}: SettingsModalBodyProps) {
  const [activeSettingsType, setActiveSettingsType] = useState(SETTINGS_TYPE_WORDWALLS);
  const [saveAllowed, setSaveAllowed] = useState(true);

  const allowSave = useCallback((allow: boolean) => {
    setSaveAllowed(allow);
  }, []);

  const handleSettingsTypeChange = useCallback((option: string) => () => {
    setActiveSettingsType(option);
  }, []);

  let subPanel: React.ReactNode = null;
  let savebtnClass = 'btn btn-primary';
  if (!saveAllowed) {
    savebtnClass += ' disabled';
  }

  if (activeSettingsType === SETTINGS_TYPE_WORDWALLS) {
    subPanel = (
      <WordwallsSettings
        onOptionsModify={onWordwallsOptionsModify}
        displayStyle={displayStyle}
        allowSave={allowSave}
      />
    );
  }
  // } else if (activeSettingsType === SETTINGS_TYPE_TABLE_SETTINGS) {
  //   subPanel = (
  //     <TableSettings
  //       onSettingsModify={onTableSettingsModify}
  //     />
  //   );
  // }

  return (
    <div>
      <div className="modal-body">
        <div className="row">
          <div className="col-sm-3">
            <SettingsSidebar
              settingsTypes={[
                SETTINGS_TYPE_WORDWALLS,
                // SETTINGS_TYPE_TABLE_SETTINGS,
                // SETTINGS_TYPE_BASE_SETTINGS,
              ]}
              activeSettingsType={activeSettingsType}
              setSettingsType={handleSettingsTypeChange}
            />
          </div>
          <div className="col-sm-9">
            {subPanel}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-default"
          data-dismiss="modal"
        >
          Close
        </button>
        <button
          type="button"
          className={savebtnClass}
          onClick={saveWordwallsChanges}
          data-dismiss="modal"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

export default SettingsModalBody;
