/**
 * @fileOverview A list of tables that have at least one player in them.
 */
import React from 'react';

import Table from './table';

class TableList extends React.Component {
  renderTables() {
    const privateTableList = [];
    const publicTableList = [];

    Object.keys(this.props.activeTables).forEach((tableid) => {
      const table = this.props.activeTables[tableid];
      const tNode = (
        <Table
          key={tableid}
          tablenum={table.tablenum}
          lexicon={table.lexicon}
          wordList={table.wordList}
          users={table.users}
          host={table.host}
          multiplayer={table.multiplayer}
          secondsPerRound={table.secondsPerRound}
          questionsPerRound={table.questionsPerRound}
          onJoinClicked={this.props.onJoinClicked}
          username={this.props.username}
        />);
      if (!table.users.length) {
        return;  // Don't show an empty table.
      }
      if (table.multiplayer) {
        publicTableList.push(tNode);
      } else {
        privateTableList.push(tNode);
      }
    });
    // Sort public tables before private tables
    publicTableList.push(...privateTableList);
    return publicTableList;
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
  username: React.PropTypes.string,
};

export default TableList;
