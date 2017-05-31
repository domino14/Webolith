/**
 * @fileOverview A list of tables that have at least one player in them.
 */
import React from 'react';
// omg eslint
const Table = props => (

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
          onClick={() => props.onJoinClicked(props.tablenum)}
        >Join</button>
      </div>
    </div>
    <div className="row">
      <div className="col-sm-4">
        List: <span className="text-info">{props.wordList}</span>
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
  onJoinClicked: React.PropTypes.func,
};

class TableList extends React.Component {
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
        onJoinClicked={this.props.onJoinClicked}
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
  onJoinClicked: React.PropTypes.func,
};

export default TableList;
