import React from 'react';

import Pills from '../newtable/pills';

const SettingsSidebar = props => (
  <div>
    <Pills
      stacked
      options={props.settingsTypes}
      activePill={props.activeSettingsType}
      onPillClick={props.setSettingsType}
    />
  </div>
);

SettingsSidebar.propTypes = {
  settingsTypes: React.PropTypes.arrayOf(React.PropTypes.string),
  activeSettingsType: React.PropTypes.string,
  setSettingsType: React.PropTypes.func,
};

export default SettingsSidebar;
