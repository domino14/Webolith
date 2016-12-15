import React from 'react';

import TableCreator from './table_creator';


const NewTable = props =>
  (<div>
    <div
      data-toggle="modal"
      title="New Table"
      data-target=".table-modal"
    >
      <button
        className="btn btn-danger btn-sm"
        style={{ marginTop: '-6px' /* why? */}}
      >New</button>
    </div>
    <TableCreator
      defaultLexicon={props.defaultLexicon}
      availableLexica={props.availableLexica}
      challengeInfo={props.challengeInfo}
      tablenum={props.tablenum}
    />
  </div>);

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
};

export default NewTable;
