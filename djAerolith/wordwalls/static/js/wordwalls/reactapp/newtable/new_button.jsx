import React from 'react';

import TableCreator from './table_creator';


class NewTable extends React.Component {
  constructor() {
    super();
    this.resetDialog = this.resetDialog.bind(this);
  }

  resetDialog() {
    this.myTableCreator.resetDialog();
  }

  render() {
    return (
      <div>
        <div
          data-toggle="modal"
          title="New Table"
          data-target=".table-modal"
        >
          <button
            className="btn btn-danger btn-sm"
            style={{ marginTop: '-6px' /* why? */}}
            onClick={this.resetDialog}
          >New</button>
        </div>
        <TableCreator
          ref={ref => (this.myTableCreator = ref)}
          defaultLexicon={this.props.defaultLexicon}
          availableLexica={this.props.availableLexica}
          challengeInfo={this.props.challengeInfo}
          tablenum={this.props.tablenum}
          onLoadNewList={this.props.onLoadNewList}
          gameGoing={this.props.gameGoing}
        />
      </div>);
  }
}

NewTable.propTypes = {
  defaultLexicon: React.PropTypes.number,
  availableLexica: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    lexicon: React.PropTypes.string,
    description: React.PropTypes.string,
    counts: React.PropTypes.object,
  })),
  challengeInfo: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    seconds: React.PropTypes.number,
    numQuestions: React.PropTypes.number,
    name: React.PropTypes.string,
    orderPriority: React.PropTypes.number,
  })),
  tablenum: React.PropTypes.number,
  onLoadNewList: React.PropTypes.func,
  gameGoing: React.PropTypes.bool,
};

export default NewTable;
