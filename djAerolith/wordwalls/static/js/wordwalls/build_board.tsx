import React, { useMemo } from 'react';
import * as Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import backgroundURL from './background';
import { type ImmutableQuestion } from './immutable-types';

interface SolutionPanelProps {
  wordLength: number;
  totalCount: number;
  solvedWords: string[];
}

function SolutionPanel({ wordLength, totalCount, solvedWords }: SolutionPanelProps) {
  let words: React.ReactNode = solvedWords.sort().map((word) => (
    <span key={word}>
      {word}
      {' '}
    </span>
  ));

  if (!words.length) {
    words = (
      <span className="text-muted">
        {`${totalCount} words of length ${wordLength}`}
      </span>
    );
  }

  return (
    <li className="list-group-item">
      <span className="badge">
        {`${totalCount - solvedWords.length}`}
      </span>
      <span
        className={
          `${totalCount === solvedWords.length ? 'text-success' : ''}`
        }
      >
        {words}
      </span>
    </li>
  );
}

interface BuildBoardProps {
  displayStyle: Styling;
  width: number;
  questions: Immutable.List<ImmutableQuestion>;
  onShuffle: (idx: number) => void;
  answerers: Immutable.Map<string, Immutable.List<Immutable.Map<string, string>>>;
  origQuestions: Immutable.OrderedMap<string, ImmutableQuestion>;
  scaleTransform: number;
}

function BuildBoard({
  displayStyle,
  width,
  questions,
  onShuffle,
  answerers,
  origQuestions,
  scaleTransform,
}: BuildBoardProps) {
  const question = questions.get(0);
  const alphagram = question?.get('a');

  const answers = useMemo(() => {
    if (!alphagram || !question) {
      return null;
    }

    // XXX: This is slowish. Maybe it's still fast enough for all intents
    // and purposes.
    // Render the user's answers.
    // An array of 15 elements, one for each possible word length.
    const solsarr: string[][] = [];
    const solscounts: number[] = [];
    for (let i = 0; i < 15; i += 1) {
      solsarr.push([]);
      solscounts.push(0);
    }

    const origQuestion = origQuestions.get(alphagram);
    // count words of each length.
    if (!origQuestion) {
      return null;
    }

    const words = origQuestion.get('ws');
    if (!words) {
      return null;
    }

    words.forEach((word) => {
      solscounts[word.get('w').length - 1] += 1;
    });

    answerers.forEach((answered) => {
      // Answerers is a map of player to answers
      answered.forEach((word) => {
        solsarr[word.get('w').length - 1].push(word.get('w'));
      });
    });

    const answerElements: React.ReactNode[] = [];
    solscounts.forEach((ct, idx) => {
      if (ct !== 0) {
        const solvedWordsForLength: string[] = [];
        answerers.forEach((answered) => {
          answered.forEach((word) => {
            // XXX TODO XXX
            // This is hugely inefficient - a triple nested loop in a render
            // call! This needs to be reworked
            // (Luckily, we are still dealing with relatively small numbers here...)
            if (word.get('w').length === idx + 1) {
              solvedWordsForLength.push(word.get('w'));
            }
          });
        });
        answerElements.push(
          <SolutionPanel
            key={`length${idx + 1}`}
            wordLength={idx + 1}
            totalCount={ct}
            solvedWords={solvedWordsForLength}
          />,
        );
      }
    });
    return answerElements;
  }, [alphagram, question, origQuestions, answerers]);

  const leftMargin = 5;
  const topMargin = 4;
  const style: React.CSSProperties = {
    backgroundImage: backgroundURL(displayStyle.background),
  };

  if (displayStyle.background === 'pool_table') {
    // Stretch this one.
    style.backgroundSize = '100% 100%';
  }

  let renderedQuestion: React.ReactNode = null;
  if (question?.size) {
    renderedQuestion = (
      <WordwallsQuestion
        displayStyle={displayStyle}
        letters={question.get('displayedAs')}
        qNumber={0}
        words={question.get('wMap')}
        gridX={(width > 320 ? width / 8.0 : 30)}
        gridY={0}
        ySize={40}
        xSize={200}
        onShuffle={onShuffle}
        scaleTransform={scaleTransform * 1.75}
        isTyping={false}
      />
    );
  }

  return (
    <div>
      <svg
        style={style}
        width={scaleTransform * (width + (2 * leftMargin))}
        height={scaleTransform * (60 + (2 * topMargin))}
        onMouseDown={(e) => { e.preventDefault(); }}
      >
        {renderedQuestion}
      </svg>
      <ul className="list-group">
        {answers}
      </ul>
    </div>
  );
}

export default BuildBoard;
