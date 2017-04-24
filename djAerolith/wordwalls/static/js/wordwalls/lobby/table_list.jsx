/**
 * @fileOverview A list of tables that have at least one player in them.
 */
import React from 'react';
// omg eslint
const Table = props => (
  // let colorModifier;
  // if (props.lexicon === 'CSW15') {
  //   colorModifier = 'panel-danger';  // redcoats
  // } else if (props.lexicon === 'America') {
  //   colorModifier = 'panel-info';  // light blue
  // } // Otherwise no modifier.
  // return (
  /*
    <div className={`panel ${colorModifier}`}>
      <div className="panel-heading">
        <div className="row">
          <div className="col-sm-4">
            Table {props.tablenum} ({props.lexicon})
          </div>
          <div className="col-sm-4">
            Host: {props.admin}
          </div>
        </div>
      </div>
      <div className="panel-body">
        <div className="row">
          <div className="col-sm-4">
            List: {props.wordList}
          </div>
          <div className="col-sm-4">
            In table: {props.users.join(' ')}
          </div>
          <div className="col-sm-4">
            <button
              className="btn btn-sm btn-info"
            >Join</button>
          </div>
        </div>
      </div>
    </div>
  */
  <li className="list-group-item">
    <div className="row">
      <div className="col-sm-2">
        Table {props.tablenum}
      </div>
      <div className="col-sm-3">
        <b>{props.lexicon}</b>
      </div>
      <div className="col-sm-4">
        <span className="text-muted">Host: {props.admin}</span>
      </div>
      <div className="col-sm-3">
        <button
          className="btn btn-info"
        >Join</button>
      </div>
    </div>
    <div className="row">
      <div className="col-sm-4">
        <span className="text-info">List: {props.wordList}</span>
      </div>
      <div className="col-sm-4">
        <span className="text-muted">In table: {props.users.join(' ')}</span>
      </div>
    </div>

  </li>


);


Table.propTypes = {
  tablenum: React.PropTypes.number,
  lexicon: React.PropTypes.string,
  wordList: React.PropTypes.string,
  admin: React.PropTypes.string,
  users: React.PropTypes.arrayOf(React.PropTypes.string),
};

class TableList extends React.Component {
  foo() {
    this.bar = 3;
  }

  renderTables() {
    const tables = this.props.activeTables.map((table, idx) => (
      <Table
        key={idx}
        tablenum={table.tablenum}
        lexicon={table.lexicon}
        wordList={table.wordList}
        users={table.users}
        admin={table.admin}
        secondsPerRound={table.secondsPerRound}
        questionsPerRound={table.questionsPerRound}
      />
    ));
    return tables;
  }

  render() {
    return (
      <div className="well" style={{ maxHeight: 350, overflowY: 'auto' }}>
        <ul className="list-group">
          {this.renderTables()}
        </ul>
      </div>
    );
  }
}

TableList.propTypes = {
  activeTables: React.PropTypes.arrayOf(React.PropTypes.shape({
    tablenum: React.PropTypes.number.isRequired,
    admin: React.PropTypes.string,
    users: React.PropTypes.arrayOf(React.PropTypes.string),
    wordList: React.PropTypes.string,
    lexicon: React.PropTypes.string,
    secondsPerRound: React.PropTypes.number,
    questionsPerRound: React.PropTypes.number,
  })),
};

export default TableList;
