import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

// import { pointsForWord } from './build_mode';
import WordPartDisplay from './word_part_display';

const UserBox = (props) => {
  const answers = [];
  const { showLexiconSymbols } = props;
  props.answers.forEach((word) => {
    const wordEl = (
      <div
        key={word.get('w')}
        data-toggle="tooltip"
        data-placement="left"
        title={word.get('d')}
      >
        <WordPartDisplay
          text={`${word.get('fh')} `}
          classes="text-info small"
        />
        <WordPartDisplay
          text={
            `${word.get('ifh') ? '･' : ''}${word.get('w')}`
            + `${word.get('ibh') ? '･' : ''}${showLexiconSymbols ? word.get('s') : ''}`
}
        />
        <WordPartDisplay
          text={` ${word.get('bh')}`}
          classes="text-info small"
        />
      </div>
    );
    answers.push(wordEl);
  });
  const percentScore = props.totalWords > 0
    ? (100 * (props.answers.size / props.totalWords)).toFixed(1) : 0;

  const fractionScore = `${props.answers.size}/${props.totalWords}`;
  let wrongAnswers = null;
  if (!props.hideErrors) {
    wrongAnswers = (
      <div className="col-sm-12">
        <div
          style={{
            fontSize: '1em',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}
          className="text text-danger"
        >
          {props.wrongAnswers}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span>{props.username}</span>
      </div>
      <div
        className="card-body"
        style={{
          height: 200,
          overflow: 'auto',
        }}
        ref={(domNode) => {
          if (domNode === null) {
            return;
          }
          domNode.scrollTop = domNode.scrollHeight; // eslint-disable-line no-param-reassign
        }}
      >
        {answers}
      </div>
      <div className="card-footer">
        <div className="row">
          <div className="col-sm-4 col-md-4">
            <span
              style={{ fontSize: '1.5em' }}
              className="text text-success"
            >
              {`${percentScore}%`}
            </span>
          </div>
          <div className="col-sm-8 col-md-6 col-md-offset-2">
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
              {wrongAnswers}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UserBox.propTypes = {
  answers: PropTypes.instanceOf(Immutable.List).isRequired,
  wrongAnswers: PropTypes.number.isRequired,
  hideErrors: PropTypes.bool.isRequired,
  totalWords: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  showLexiconSymbols: PropTypes.bool.isRequired,
};

export default UserBox;
