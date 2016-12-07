import React from 'react';

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
    const medalName = ChallengeResults.getMedalName(
      parsedAddl ? parsedAddl.medal.toLowerCase() : null);
    const medal = medalName ? (<img
      src={`/static/img/aerolith/${medalName}_16x16.png`}
      alt={medalName}
    />) : '';
    return (<a
      href={`/accounts/profile/${user}`}
      target="_blank"
      rel="noopener noreferrer"
    >{medal}{user}</a>);
  }

  render() {
    const entries = [];
    if (!this.props.challengeData.entries) {
      return null;
    }
    const maxScore = this.props.challengeData.maxScore;
    this.props.challengeData.entries.forEach((entry, index) => {
      const userLink = ChallengeResults.getUserLink(entry.user, entry.addl);
      entries.push(<tr key={index}>
        <td>{index + 1}</td>
        <td>{userLink}</td>
        <td>{`${(100 * (entry.score / maxScore)).toFixed(1)}%`}</td>
        <td>{`${entry.tr} s.`}</td>
      </tr>);
    });

    return (
      <div
        className="modal-body table-responsive"
        style={{
          overflowY: 'scroll',
          height: '500px',
        }}
      >
        <table className="table table-condensed">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Score</th>
              <th>Remaining</th>
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

ChallengeResults.propTypes = {
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
};

export default ChallengeResults;

