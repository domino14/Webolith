import React from 'react';
import PropTypes from 'prop-types';

class ChallengeResults extends React.Component {
  static getMedalName(medal) {
    if (!medal) {
      return null;
    }
    return {
      gold: 'gold_medal',
      silver: 'silver_medal',
      bronze: 'bronze_medal',
      platinum: 'platinum_star',
      goldstar: 'gold_star',
    }[medal];
  }

  /**
   * Get a link for the user, given the user name and additional data.
   */
  static getUserLink(user, addlData) {
    const parsedAddl = JSON.parse(addlData);
    const medalName = ChallengeResults.getMedalName(parsedAddl
      ? parsedAddl.medal.toLowerCase() : null);
    const medal = medalName ? (
      <img
        src={`/static/img/aerolith/${medalName}_16x16.png`}
        alt={medalName}
      />
    ) : '';
    return (
      <a
        href={`/accounts/profile/${user}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {medal}
        {user}
      </a>
    );
  }

  render() {
    const entries = [];
    if (!this.props.challengeData.entries) {
      return null;
    }
    const { maxScore } = this.props.challengeData;
    const userTHStyle = {};
    const tableLayoutStyle = {};
    if (this.props.fixedLayout) {
      userTHStyle.width = '45%';
      tableLayoutStyle.tableLayout = 'fixed';
    }
    this.props.challengeData.entries.forEach((entry, index) => {
      const userLink = ChallengeResults.getUserLink(entry.user, entry.addl);
      let errorsColumn = null;
      if (!this.props.hideErrors) {
        errorsColumn = <td>{`${entry.w}`}</td>;
      }
      const overflowStyle = {};

      if (this.props.fixedLayout) {
        overflowStyle.overflow = 'hidden';
      }
      const entryTr = (
        <tr key={entry.user}>
          <td>{index + 1}</td>
          <td style={overflowStyle}>{userLink}</td>
          <td>{`${(100 * (entry.score / maxScore)).toFixed(1)}%`}</td>
          {errorsColumn}
          <td>{`${entry.tr} s.`}</td>
        </tr>
      );
      entries.push(entryTr);
    });
    let errorsHeader = null;
    if (!this.props.hideErrors) {
      errorsHeader = <th>Errors</th>;
    }

    return (
      <div
        className="modal-body table-responsive"
        style={{
          overflowY: 'scroll',
          height: this.props.height,
        }}
      >
        <table className="table table-condensed" style={tableLayoutStyle}>
          <thead>
            <tr>
              <th>#</th>
              <th style={userTHStyle}>User</th>
              <th>Score</th>
              {errorsHeader}
              <th>Rem.</th>
            </tr>
          </thead>
          <tbody>
            {entries}
          </tbody>
        </table>
      </div>
    );
  }
}

ChallengeResults.defaultProps = {
  fixedLayout: false,
};

ChallengeResults.propTypes = {
  challengeData: PropTypes.shape({
    entries: PropTypes.arrayOf(PropTypes.shape({
      user: PropTypes.string,
      score: PropTypes.number,
      tr: PropTypes.number,
      w: PropTypes.number,
      addl: PropTypes.string,
    })),
    lexicon: PropTypes.string,
    maxScore: PropTypes.number,
  }).isRequired,
  hideErrors: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  fixedLayout: PropTypes.bool,
};

export default ChallengeResults;
