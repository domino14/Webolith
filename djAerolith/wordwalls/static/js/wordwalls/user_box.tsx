import React, { useRef, useEffect } from 'react';

import * as Immutable from 'immutable';

import WordPartDisplay from './word_part_display';
import { type ImmutableWordAnswer } from './immutable-types';

interface UserBoxProps {
  answers: Immutable.List<ImmutableWordAnswer>;
  wrongAnswers: number;
  hideErrors: boolean;
  totalWords: number;
  username: string;
  showLexiconSymbols: boolean;
}

function UserBox({
  answers,
  wrongAnswers,
  hideErrors,
  totalWords,
  username,
  showLexiconSymbols,
}: UserBoxProps) {
  const panelBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new answers are added
  useEffect(() => {
    if (panelBodyRef.current) {
      panelBodyRef.current.scrollTop = panelBodyRef.current.scrollHeight;
    }
  }, [answers]);

  const answerElements: React.ReactElement[] = [];
  answers.forEach((word) => {
    const wordEl = (
      <div
        key={word.get('w')}
        data-bs-toggle="tooltip"
        data-placement="left"
        title={word.get('d')}
      >
        <WordPartDisplay text={`${word.get('fh')} `} classes="text-info small" />
        <WordPartDisplay
          text={
            `${word.get('ifh') ? '･' : ''}${word.get('w')}`
            + `${word.get('ibh') ? '･' : ''}${showLexiconSymbols ? word.get('s') : ''}`
          }
        />
        <WordPartDisplay text={` ${word.get('bh')}`} classes="text-info small" />
      </div>
    );
    answerElements.push(wordEl);
  });

  const percentScore = totalWords > 0 ? (100 * (answers.size / totalWords)).toFixed(1) : 0;

  const fractionScore = `${answers.size}/${totalWords}`;

  const wrongAnswersElement = !hideErrors ? (
    <div className="col-sm-12">
      <div
        style={{
          fontSize: '1em',
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
        className="text text-danger"
      >
        {wrongAnswers}
      </div>
    </div>
  ) : null;

  return (
    <div className="card">
      <div className="card-header">
        <span>{username}</span>
      </div>
      <div
        className="card-body"
        style={{
          height: 200,
          overflow: 'auto',
        }}
        ref={panelBodyRef}
      >
        {answerElements}
      </div>
      <div className="card-footer">
        <div className="row">
          <div className="col-sm-4 col-md-4">
            <span style={{ fontSize: '1.5em' }} className="text text-success">
              {`${percentScore}%`}
            </span>
          </div>
          <div className="col-sm-8 col-md-6 offset-md-2">
            <div className="row">
              <div className="col-sm-12">
                <div
                  style={{
                    fontSize: '1.5em',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                  className="text text-success"
                >
                  {fractionScore}
                </div>
              </div>
              {wrongAnswersElement}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserBox;
