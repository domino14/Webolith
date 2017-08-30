import React from 'react';
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
          <Select
            colSize={4}
            label="Mode"
            badge="New!"
            selectedValue={this.props.multiplayerOn ? 'multi' : 'single'}
            options={[{ value: 'single', displayValue: 'Single Player' },
                      { value: 'multi', displayValue: 'Multiplayer' }]}
            onChange={e => this.props.onMultiplayerModify(
              e.target.value === 'multi')}
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: '0.75em' }}
            onClick={this.props.onListSubmit}
            data-dismiss="modal"
          >Play!</button>
          <button
            className="btn btn-info"
            style={{ marginTop: '0.75em', marginLeft: '1em' }}
            onClick={this.props.onFlashcardSubmit}
            data-dismiss="modal"
          >Flashcard</button>
        </div>
      </div>
    );
  }
}

AerolithListDialog.propTypes = {
  selectedList: React.PropTypes.string,
  onSelectedListChange: React.PropTypes.func,
  listOptions: React.PropTypes.arrayOf(React.PropTypes.shape({
    name: React.PropTypes.string,
    lexicon: React.PropTypes.string,
    numAlphas: React.PropTypes.number,
    id: React.PropTypes.number,
    wordLength: React.PropTypes.number,
  })),
  onListSubmit: React.PropTypes.func,
  onFlashcardSubmit: React.PropTypes.func,
  multiplayerOn: React.PropTypes.bool,
  onMultiplayerModify: React.PropTypes.func,
};

export default AerolithListDialog;
