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
    console.log('da tables', this.props.activeTables);
    return Object.keys(this.props.activeTables).map((tableid) => {
      const table = this.props.activeTables[tableid];
      return (
        <Table
          key={tableid}
          tablenum={table.tablenum}
          lexicon={table.lexicon}
          wordList={table.wordList}
          users={table.users}
          admin={table.admin}
          secondsPerRound={table.secondsPerRound}
          questionsPerRound={table.questionsPerRound}
          onJoinClicked={this.props.onJoinClicked}
        />);
    });
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
  // activeTables: React.PropTypes.arrayOf(React.PropTypes.shape({
  //   tablenum: React.PropTypes.number.isRequired,
  //   admin: React.PropTypes.string,
  //   users: React.PropTypes.arrayOf(React.PropTypes.string),
  //   wordList: React.PropTypes.string,
  //   lexicon: React.PropTypes.string,
  //   secondsPerRound: React.PropTypes.number,
  //   questionsPerRound: React.PropTypes.number,
  // })),
  activeTables: React.PropTypes.object,  // eslint-disable-line react/forbid-prop-types
  onJoinClicked: React.PropTypes.func,
};

export default TableList;
