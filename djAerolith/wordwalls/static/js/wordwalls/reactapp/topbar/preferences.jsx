/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PrefsModal from './prefs_modal';

class Preferences extends React.Component {
  constructor() {
    super();
    this.resetSettings = this.resetSettings.bind(this);
  }

  resetSettings() {
    this.myPrefsModal.reset();
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
            className="fa fa-cog fa-2x"
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
  displayStyle: React.PropTypes.object,
  onSave: React.PropTypes.func,
};

export default Preferences;
