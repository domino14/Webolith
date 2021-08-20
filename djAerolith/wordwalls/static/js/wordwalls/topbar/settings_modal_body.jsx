import React from 'react';
import PropTypes from 'prop-types';

import Styling from '../style';

import WordwallsSettings from './wordwalls_settings';
// import TableSettings from './table_settings';
import SettingsSidebar from './settings_sidebar';

const SETTINGS_TYPE_WORDWALLS = 'Wordwalls Settings';
// const SETTINGS_TYPE_TABLE_SETTINGS = 'Table Settings';
// const SETTINGS_TYPE_BASE_SETTINGS = 'Aerolith Settings';

class SettingsModalBody extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeSettingsType: SETTINGS_TYPE_WORDWALLS,
      saveAllowed: true,
    };
    this.allowSave = this.allowSave.bind(this);
  }

  allowSave(allow) {
    this.setState({
      saveAllowed: allow,
    });
  }

  render() {
    let subPanel;
    let savebtnClass;
    savebtnClass = 'btn btn-primary';
    if (!this.state.saveAllowed) {
      savebtnClass += ' disabled';
    }

    if (this.state.activeSettingsType === SETTINGS_TYPE_WORDWALLS) {
      subPanel = (
        <WordwallsSettings
          onOptionsModify={this.props.onWordwallsOptionsModify}
          displayStyle={this.props.displayStyle}
          allowSave={this.allowSave}
        />
      );
    }
    // } else if (this.state.activeSettingsType === SETTINGS_TYPE_TABLE_SETTINGS) {
    //   subPanel = (
    //     <TableSettings
    //       onSettingsModify={this.props.onTableSettingsModify}
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
                activeSettingsType={this.state.activeSettingsType}
                setSettingsType={(option) => () => this.setState({
                  activeSettingsType: option,
                })}
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
            className="btn btn-secondary"
            data-dismiss="modal"
          >
            Close
          </button>
          <button
            type="button"
            className={savebtnClass}
            onClick={this.props.saveWordwallsChanges}
            data-dismiss="modal"
          >
            Save changes
          </button>
        </div>

      </div>
    );
  }
}

SettingsModalBody.propTypes = {
  onWordwallsOptionsModify: PropTypes.func.isRequired,
  // onTableSettingsModify: PropTypes.func,
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  saveWordwallsChanges: PropTypes.func.isRequired,
};

export default SettingsModalBody;
