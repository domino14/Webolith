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
import { useWordVaultReview, type WordVaultReview } from './use_wordvault_review';
import { plural } from './use_wordvault';
import Notifications from './notifications';

/**
 * Reminds the player to send the ratings from a WordVault review round.
 * If that round isn't the list in this table anymore, the ratings can be
 * sent or discarded from here.
 */
function WordVaultReviewReminder({ review }: { review: WordVaultReview }) {
  const { session } = review;
  if (!session || session.status !== 'rating') {
    return review.message && !review.active ? (
      <div className={`alert alert-${review.message.kind} py-2`} role="status">
        {review.message.text}
      </div>
    ) : null;
  }
  const n = Object.keys(session.ratings).length;
  if (review.active) {
    return (
      <div className="alert alert-info py-2" role="status">
        Check your WordVault ratings in Show Solutions, then send them to WordVault.
        You can practice the missed cards after that.
      </div>
    );
  }
  return (
    <div className="alert alert-warning py-2 d-flex align-items-center gap-2 flex-wrap" role="status">
      <span>
        {`You haven't sent your ratings for ${plural(n, 'card')} from your last WordVault round.`}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={review.busy}
        onClick={review.submit}
      >
        {review.busy ? 'Sending…' : 'Send them'}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-link text-body-secondary ms-auto"
        disabled={review.busy}
        onClick={() => Notifications.confirm(
          'Discard ratings?',
          `You've already seen these ${plural(n, 'card')}. If you discard their ratings,
          WordVault will show them to you again as if you hadn't, which throws off
          its scheduling. Only discard them if something went wrong.`,
          review.discard,
        )}
      >
        Discard…
      </button>
    </div>
  );
}

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
  markMissed: (questions: { idx: number; alphagram: string }[]) => void;
  showLexiconSymbols: boolean;
  lexicon: string;
  isBuild: boolean;
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
  lexicon,
  isBuild,
  isChallenge,
  challengeData,
  numberOfRounds,
  resetTableCreator,
  tableCreatorModalSelector,
  listName,
  hideErrors,
  handleStart,
}: GameInactiveAreaProps) {
  const review = useWordVaultReview();
  // Another round of a WordVault review list is practice; the first round's
  // ratings have to be sent before it.
  const startBlocked = review.active && review.session?.status === 'rating';
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
        disabled={startBlocked}
        title={startBlocked ? 'Send your WordVault ratings first.' : undefined}
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
          {startBlocked ? (
            <p>
              Rate your cards in Show Solutions and send the ratings to WordVault.
              Then you can practice the missed ones by clicking
              {' '}
              {startButton}
              {' '}
              again.
            </p>
          ) : (
            <p>
              You can continue by clicking
              {' '}
              {startButton}
              {' '}
              again, or
              view solutions / results below.
            </p>
          )}
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
        lexicon={lexicon}
        isBuild={isBuild}
      />
    </div>
  );

  return (
    <div className="bg-body-tertiary p-5 rounded-3 mb-4">
      <WordVaultReviewReminder review={review} />
      {renderJumbotronHeader()}
      {renderTableManagementButtons()}
      {renderModals()}
    </div>
  );
}

export default GameInactiveArea;
