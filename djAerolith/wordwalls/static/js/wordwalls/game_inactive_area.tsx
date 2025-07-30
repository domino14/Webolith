/**
 * @fileOverview A hero unit for when game is inactive, that will allow the
 * user to select what to do.
 */

import React from 'react';
import * as Immutable from 'immutable';

import SolutionsModal from './solutions_modal';
import ChallengeResultsModal from './challenge_results_modal';
import StartButton from './start_button';
import HeroButton from './hero_button';
import { type ImmutableQuestion } from './immutable-types';

interface ChallengeEntry {
  user: string;
  score: number;
  tr: number;
  w: number;
  addl: string;
}

interface ChallengeData {
  entries: ChallengeEntry[];
  maxScore: number;
}

interface GameInactiveAreaProps {
  questions: Immutable.OrderedMap<string, ImmutableQuestion>;
  numCorrect: number;
  totalWords: number;
  markMissed: (idx: number, alphagram: string) => void;
  showLexiconSymbols: boolean;
  isChallenge: boolean;
  challengeData: ChallengeData;
  numberOfRounds: number;
  resetTableCreator: () => void;
  tableCreatorModalSelector: string;
  listName: string;
  hideErrors: boolean;
  handleStart: () => void;
}

function GameInactiveArea({
  questions,
  numCorrect,
  totalWords,
  markMissed,
  showLexiconSymbols,
  isChallenge,
  challengeData,
  numberOfRounds,
  resetTableCreator,
  tableCreatorModalSelector,
  listName,
  hideErrors,
  handleStart,
}: GameInactiveAreaProps) {
  const handleStartClick = () => {
    handleStart();
  };

  /**
   * Render the table "management" buttons, ie create new table, leave table.
   */
  const renderTableManagementButtons = () => (
    <div className="row">
      <hr style={{ borderTop: '1px solid #ccc' }} />
      <HeroButton
        addlButtonClass="btn-info"
        onClick={resetTableCreator}
        modalSelector={tableCreatorModalSelector}
        buttonText="Load New Word List"
      />
      <HeroButton
        addlButtonClass="btn-danger"
        onClick={() => {
          window.location.href = '/';
        }}
        buttonText="Back to Main Page"
      />
    </div>
  );

  const renderJumbotronHeader = () => {
    let jumbotronHeader: React.ReactNode = null;
    let challengeButton: React.ReactNode = null;
    const startButton = (
      <StartButton
        buttonText="Start"
        buttonClass="btn btn-primary btn-lg"
        handleButtonClick={handleStartClick}
      />
    );

    if (isChallenge) {
      challengeButton = (
        <HeroButton
          addlButtonClass="btn-primary"
          modalSelector=".challenge-results-modal"
          buttonText="Show Challenge Results"
        />
      );
    }
    if (numberOfRounds > 0) {
      jumbotronHeader = (
        <div>
          <h1>Game over!</h1>
          <p>
            You can continue by clicking
            {' '}
            {startButton}
            {' '}
            again, or
            view solutions / results below.
          </p>
          <div className="row">
            <HeroButton
              addlButtonClass="btn-primary"
              modalSelector=".solutions-modal"
              buttonText="Show Solutions"
            />
            {challengeButton}
          </div>
        </div>
      );
    } else if (!listName) {
      jumbotronHeader = (
        <div>
          <h1>Welcome!</h1>
          <p>Please choose an option from below.</p>
        </div>
      );
    } else {
      jumbotronHeader = (
        <div>
          <p>
            Ready to
            {' '}
            {startButton}
          </p>
          <p>
            List name:
            {' '}
            {listName.trim()}
          </p>
          <p>Press Start to quiz, or one of the options below.</p>
        </div>
      );
    }
    return jumbotronHeader;
  };

  /**
   * Modals are not quite "rendered" in a specific location. This just
   * puts them in the DOM so they can be brought up with a button click.
   */
  const renderModals = () => (
    <div>
      <ChallengeResultsModal
        challengeData={challengeData}
        hideErrors={hideErrors}
      />
      <SolutionsModal
        questions={questions}
        numCorrect={numCorrect}
        totalWords={totalWords}
        markMissed={markMissed}
        showLexiconSymbols={showLexiconSymbols}
      />
    </div>
  );

  return (
    <div className="bg-body-tertiary p-5 rounded-3 mb-4">
      {renderJumbotronHeader()}
      {renderTableManagementButtons()}
      {renderModals()}
    </div>
  );
}

export default GameInactiveArea;
