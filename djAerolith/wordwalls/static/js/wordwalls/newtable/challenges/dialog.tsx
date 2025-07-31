import React, { useRef } from 'react';

import moment from 'moment';

import DatePicker from '../../forms/date_picker';
import ChallengeResults from './challenge_results';
import ChallengeButtonRow from './challenge_button';

interface ChallengeInfo {
  id: number;
  seconds: number;
  numQuestions: number;
  name: string;
  orderPriority: number;
}

interface Lexicon {
  id: number;
  lexicon: string;
  description: string;
}

interface ChallengeDone {
  challengeID: number;
}

interface ChallengeLeaderboardEntry {
  user: string;
  score: number;
  tr: number;
  w: number;
  addl: string;
}

interface ChallengeLeaderboardData {
  entries?: ChallengeLeaderboardEntry[];
  challengeName?: string;
  lexicon?: string;
  maxScore?: number;
}

interface ChallengeDialogProps {
  challengeInfo: ChallengeInfo[];
  challengesDoneAtDate: ChallengeDone[];
  currentDate: ReturnType<typeof moment>;
  onDateChange: (date: Date) => void;
  onChallengeSelected: (challengeID: number) => () => void;
  onChallengeSubmit: () => void;
  challengeLeaderboardData: ChallengeLeaderboardData;
  lexicon: number;
  availableLexica: Lexicon[];
  hideErrors: boolean;
  specialChallengeInfo: ChallengeInfo[];
  currentChallenge: number;
  disabled: boolean;
}

// XXX merge with similar function in blanks/dialog_container.js
function getLexiconName(availableLexica: Lexicon[], lexicon: number): string {
  const lex = availableLexica.find((el) => el.id === lexicon);
  if (lex) {
    return lex.lexicon;
  }
  return '';
}

const ALL_TIME_TOUGHIE_LEXICA = ['CSW24', 'NWL23'];

function ChallengeDialog({
  challengeInfo,
  challengesDoneAtDate,
  currentDate,
  onDateChange,
  onChallengeSelected,
  onChallengeSubmit,
  challengeLeaderboardData,
  lexicon,
  availableLexica,
  hideErrors,
  specialChallengeInfo,
  currentChallenge,
  disabled,
}: ChallengeDialogProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDatePickerClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.showPicker?.();
    }
  };

  // For the different order priorities, make different buttons.
  const rows: React.ReactNode[] = [];
  const challs = challengesDoneAtDate.map((el) => el.challengeID);

  rows.push(
    <ChallengeButtonRow
      title="By Word Length"
      size="md"
      key="ch2"
      challenges={challengeInfo.filter((ch) => ch.orderPriority === 1)}
      onChallengeClick={onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={currentChallenge}
    />,
  );

  if (specialChallengeInfo.length) {
    rows.push(
      <ChallengeButtonRow
        title="Special Challenges"
        size="sm"
        key="ch6"
        challenges={specialChallengeInfo.filter((ch) => ch.orderPriority === 5)}
        onChallengeClick={onChallengeSelected}
        solvedChallenges={challs}
        selectedChallenge={currentChallenge}
      />,
    );
  }

  rows.push(
    <ChallengeButtonRow
      title="Word Builder"
      size="sm"
      key="ch5"
      challenges={challengeInfo.filter((ch) => ch.orderPriority === 4)}
      onChallengeClick={onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={currentChallenge}
    />,
  );

  // Bingo toughies
  rows.push(
    <ChallengeButtonRow
      title="Bingo Toughies"
      size="sm"
      key="ch3"
      challenges={
        // Leave out the "Common Words (long)" for now, and all-time toughies
        // for all but permitted lexica.
        challengeInfo.filter((ch) => {
          if (ch.orderPriority !== 6) {
            return false;
          }
          if (
            (ch.id === 28 || ch.id === 29)
            && !ALL_TIME_TOUGHIE_LEXICA.includes(
              getLexiconName(availableLexica, lexicon),
            )
          ) {
            return false;
          }
          return true;
        })
      }
      onChallengeClick={onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={currentChallenge}
    />,
  );

  // Longer challenges
  rows.push(
    <ChallengeButtonRow
      title="Longer challenges"
      size="sm"
      key="ch3-long"
      challenges={challengeInfo.filter((ch) => ch.orderPriority === 2)}
      onChallengeClick={onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={currentChallenge}
    />,
  );

  // Finally, some uncommon challenges.
  rows.push(
    <ChallengeButtonRow
      title="Other Word Lengths"
      size="sm"
      key="ch4"
      onChallengeClick={onChallengeSelected}
      solvedChallenges={challs}
      selectedChallenge={currentChallenge}
      challenges={challengeInfo.filter((ch) => ch.orderPriority === 3)}
    />,
  );

  return (
    <div className="row">
      <div className="col-sm-7">
        <div 
          onClick={handleDatePickerClick}
          style={{ cursor: 'pointer' }}
          title="Click anywhere to open date picker"
        >
          <DatePicker
            id="challenge-date"
            label="Challenge Date"
            value={currentDate}
            onDateChange={onDateChange}
            startDate={new Date(2011, 5, 14)}
            ref={dateInputRef}
          />
        </div>

        {rows}

        <button
          className="btn btn-primary"
          style={{ marginTop: '0.75em' }}
          onClick={onChallengeSubmit}
          data-bs-dismiss="modal"
          disabled={disabled}
          type="button"
        >
          Play!
        </button>
      </div>
      <div className="col-sm-5">
        <ChallengeResults
          challengeData={challengeLeaderboardData}
          hideErrors={hideErrors}
          height={400}
          fixedLayout
        />
      </div>
    </div>
  );
}

export default ChallengeDialog;
