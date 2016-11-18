/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PrefsModal from './prefs_modal';

class Preferences extends React.Component {
  constructor() {
    super();
    this.resetSettings = this.resetSettings.bind(this);
  }

  resetSettings() {
    // Make sure that the preferences modal matches the display style
    // currently in the props.
    this.myPrefsModal.reset(this.props.displayStyle);
  }

  render() {
    return (
      <div>
        <div
          data-toggle="modal"
          onClick={this.resetSettings}
          data-target=".prefs-modal"
        >
          <i
            className="glyphicon glyphicon-cog"
            style={{ fontSize: '175%' }}
            aria-hidden="true"
          />
        </div>
        <PrefsModal
          ref={ref => (this.myPrefsModal = ref)}
          displayStyle={this.props.displayStyle}
          onSave={this.props.onSave}
        />
      </div>
    );
  }
}

Preferences.propTypes = {
  displayStyle: React.PropTypes.shape({
    tc: React.PropTypes.object,
    bc: React.PropTypes.object,
  }),
  onSave: React.PropTypes.func,
};

export default Preferences;
