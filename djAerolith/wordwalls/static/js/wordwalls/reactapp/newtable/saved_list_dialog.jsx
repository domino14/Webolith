import React from 'react';
import Select from '../forms/select';

class SavedListDialog extends React.Component {
  static genOptions(listOptions) {
    const opts = listOptions.lists.map(option => ({
      value: String(option.id),
      displayValue: option.name,
    }));
    return opts;
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-12">
          <Select
            colSize={9}
            numItems={15}
            label="My Saved Lists"
            selectedValue={this.props.selectedList}
            onChange={event => this.props.onSelectedListChange(event.target.value)}
            options={SavedListDialog.genOptions(this.props.listOptions)}
          />
          <button
            className="btn btn-info"
            style={{ marginTop: '0.75em' }}
            onClick={this.props.onListSubmit}
            data-dismiss="modal"
          >Play!</button>
        </div>
      </div>
    );
  }
}

SavedListDialog.propTypes = {
  selectedList: React.PropTypes.string,
  onSelectedListChange: React.PropTypes.func,
  listOptions: React.PropTypes.shape({
    lists: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.number,
      name: React.PropTypes.string,
    })),
    count: React.PropTypes.number,
  }),
  onListSubmit: React.PropTypes.func,
};

export default SavedListDialog;
