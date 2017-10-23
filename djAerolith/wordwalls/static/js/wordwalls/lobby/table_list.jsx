/**
 * @fileOverview A list of tables that have at least one player in them.
 */
import React from 'react';
import PropTypes from 'prop-types';
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
        return; // Don't show an empty table.
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
  // activeTables: PropTypes.arrayOf(PropTypes.shape({
  //   tablenum: PropTypes.number.isRequired,
  //   admin: PropTypes.string,
  //   users: PropTypes.arrayOf(PropTypes.string),
  //   wordList: PropTypes.string,
  //   lexicon: PropTypes.string,
  //   secondsPerRound: PropTypes.number,
  //   questionsPerRound: PropTypes.number,
  // })),
  activeTables: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onJoinClicked: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};

export default TableList;
