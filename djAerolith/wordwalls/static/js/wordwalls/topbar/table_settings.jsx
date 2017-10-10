import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '../forms/checkbox';


class TableSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-lg-12">
            <form>
              <Checkbox
                on={this.props.tablePrivate}
                onChange={(event) => {
                  this.props.onSettingsModify('private', event.target.checked);
                }}
                label="Private"
              />
              <p>Note: To switch between single and multiplayer tables, you
              must instead create a new table.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

TableSettings.propTypes = {
  onSettingsModify: PropTypes.func.isRequired,
  tablePrivate: PropTypes.bool.isRequired,
};

export default TableSettings;
