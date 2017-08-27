import React from 'react';
import Immutable from 'immutable';

// import { pointsForWord } from './build_mode';
import WordPartDisplay from './word_part_display';

const UserBox = (props) => {
  const answers = [];
  const showLexiconSymbols = props.showLexiconSymbols;
  props.answers.forEach((word, idx) => {
    answers.push(
      <div
        key={idx}
        data-toggle="tooltip"
        data-placement="left"
        title={word.get('d')}
      >
        <WordPartDisplay
          text={`${word.get('fh')} `}
          classes="text-info small"
        />
        <WordPartDisplay
          text={`${word.get('w')}${showLexiconSymbols ? word.get('s') : ''}`}
        />
        <WordPartDisplay
          text={` ${word.get('bh')}`}
          classes="text-info small"
        />
      </div>);
  });
  const percentScore = props.totalWords > 0 ?
    (100 * (props.answers.size / props.totalWords)).toFixed(1) : 0;

  const fractionScore = `${props.answers.size}/${props.totalWords}`;

  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <span>{props.username}</span>
      </div>
      <div
        className="panel-body"
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
      >{answers}
      </div>
      <div className="panel-footer">
        <div className="row">
          <div className="col-sm-4 col-md-4">
            <span
              style={{ fontSize: '1.8em' }}
              className="text text-success"
            >{`${percentScore}%`}</span>
          </div>
          <div className="col-sm-8 col-md-6 col-md-offset-2">
            <div
              style={{
                fontSize: '1.8em',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
              className="text text-success"
            >{fractionScore}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

UserBox.propTypes = {
  answers: React.PropTypes.instanceOf(Immutable.List),
  totalWords: React.PropTypes.number,
  username: React.PropTypes.string,
  showLexiconSymbols: React.PropTypes.bool,
};

export default UserBox;
