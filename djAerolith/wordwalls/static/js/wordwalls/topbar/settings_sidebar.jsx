import React from 'react';
import PropTypes from 'prop-types';

import Pills from '../newtable/pills';

function SettingsSidebar(props) {
  return (
    <div>
      <Pills
        stacked
        options={props.settingsTypes}
        activePill={props.activeSettingsType}
        onPillClick={props.setSettingsType}
      />
    </div>
  );
}

SettingsSidebar.propTypes = {
  settingsTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeSettingsType: PropTypes.string.isRequired,
  setSettingsType: PropTypes.func.isRequired,
};

export default SettingsSidebar;
