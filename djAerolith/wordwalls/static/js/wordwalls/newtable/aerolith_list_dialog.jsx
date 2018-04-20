import React from 'react';
import PropTypes from 'prop-types';

import Select from '../forms/select';

class AerolithListDialog extends React.Component {
  static genOptions(listOptions) {
    const opts = listOptions.map(option => ({
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
            label="Aerolith Lists"
            selectedValue={this.props.selectedList}
            onChange={event => this.props.onSelectedListChange(event.target.value)}
            options={AerolithListDialog.genOptions(this.props.listOptions)}
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: '0.75em' }}
            onClick={this.props.onListSubmit}
            data-dismiss="modal"
          >Play!
          </button>
          <button
            className="btn btn-info"
            style={{ marginTop: '0.75em', marginLeft: '1em' }}
            onClick={this.props.onFlashcardSubmit}
            data-dismiss="modal"
          >Flashcard
          </button>
        </div>
      </div>
    );
  }
}

AerolithListDialog.propTypes = {
  selectedList: PropTypes.string.isRequired,
  onSelectedListChange: PropTypes.func.isRequired,
  listOptions: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    lexicon: PropTypes.string,
    numAlphas: PropTypes.number,
    id: PropTypes.number,
    wordLength: PropTypes.number,
  })).isRequired,
  onListSubmit: PropTypes.func.isRequired,
  onFlashcardSubmit: PropTypes.func.isRequired,
};

export default AerolithListDialog;
