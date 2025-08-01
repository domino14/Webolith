import React from 'react';

interface ChallengeEntry {
  user: string;
  score: number;
  tr: number;
  w: number;
  addl: string;
}

interface ChallengeData {
  entries?: ChallengeEntry[];
  lexicon?: string;
  maxScore?: number;
}

interface ChallengeResultsProps {
  challengeData: ChallengeData;
  hideErrors: boolean;
  height: number;
  fixedLayout?: boolean;
}

interface ParsedAddlData {
  medal?: string;
}

type MedalType = 'gold' | 'silver' | 'bronze' | 'platinum' | 'goldstar';

const MEDAL_NAMES: Record<MedalType, string> = {
  gold: 'gold_medal',
  silver: 'silver_medal',
  bronze: 'bronze_medal',
  platinum: 'platinum_star',
  goldstar: 'gold_star',
};

function getMedalName(medal: string | null | undefined): string | null {
  if (!medal) {
    return null;
  }
  return MEDAL_NAMES[medal.toLowerCase() as MedalType] || null;
}

/**
 * Get a link for the user, given the user name and additional data.
 */
function getUserLink(user: string, addlData: string) {
  let parsedAddl: ParsedAddlData | null = null;
  try {
    parsedAddl = JSON.parse(addlData) as ParsedAddlData;
  } catch {
    // Invalid JSON, ignore
  }

  const medalName = getMedalName(parsedAddl?.medal);
  const medal = medalName ? (
    <img
      src={`/static/img/aerolith/${medalName}_16x16.png`}
      alt={medalName}
    />
  ) : null;

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

function ChallengeResults({
  challengeData,
  hideErrors,
  height,
  fixedLayout = false,
}: ChallengeResultsProps) {
  if (!challengeData.entries) {
    return null;
  }

  const { maxScore = 1 } = challengeData;
  const userTHStyle: React.CSSProperties = {};
  const tableLayoutStyle: React.CSSProperties = {};

  if (fixedLayout) {
    userTHStyle.width = '35%';
    tableLayoutStyle.tableLayout = 'fixed';
  }

  const entries = challengeData.entries.map((entry, index) => {
    const userLink = getUserLink(entry.user, entry.addl);
    const overflowStyle: React.CSSProperties = {};

    if (fixedLayout) {
      overflowStyle.overflow = 'hidden';
    }

    return (
      <tr key={entry.user}>
        <td>{index + 1}</td>
        <td style={overflowStyle}>{userLink}</td>
        <td>{`${(100 * (entry.score / maxScore)).toFixed(1)}%`}</td>
        {!hideErrors && <td>{`${entry.w}`}</td>}
        <td>{`${entry.tr} s.`}</td>
      </tr>
    );
  });

  return (
    <div
      className="modal-body table-responsive"
      style={{
        overflowY: 'scroll',
        height,
      }}
    >
      <table className="table table-sm" style={tableLayoutStyle}>
        <thead>
          <tr>
            <th>#</th>
            <th style={userTHStyle}>User</th>
            <th>Score</th>
            {!hideErrors && <th>Errors</th>}
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

export default ChallengeResults;
