/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';

import SettingsModal from './settings_modal';
import Styling from '../style';

class SettingsCog extends React.Component {
  constructor() {
    super();
    this.resetSettings = this.resetSettings.bind(this);
  }

  resetSettings() {
    // Make sure that the settings modal matches the display style
    // currently in the props.
    this.myPrefsModal.reset(this.props.displayStyle);
  }

  render() {
    return (
      <div>
        <div
          data-toggle="modal"
          title="Settings"
          onClick={this.resetSettings}
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
          ref={(ref) => {
            this.myPrefsModal = ref;
          }}
          displayStyle={this.props.displayStyle}
          onSave={this.props.onSave}
          isMultiplayer={this.props.isMultiplayer}
        />
      </div>
    );
  }
}

SettingsCog.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  onSave: PropTypes.func.isRequired,
  isMultiplayer: PropTypes.bool.isRequired,
};

export default SettingsCog;
