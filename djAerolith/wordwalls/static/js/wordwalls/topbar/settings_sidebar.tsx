import React from 'react';

import Pills from '../newtable/pills';

interface SettingsSidebarProps {
  settingsTypes: string[];
  activeSettingsType: string;
  setSettingsType: (option: string) => () => void;
}

function SettingsSidebar({
  settingsTypes,
  activeSettingsType,
  setSettingsType,
}: SettingsSidebarProps) {
  return (
    <div>
      <Pills
        stacked
        options={settingsTypes}
        activePill={activeSettingsType}
        onPillClick={setSettingsType}
      />
    </div>
  );
}

export default SettingsSidebar;
