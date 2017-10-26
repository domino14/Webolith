import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import backgroundURL from './background';

const SolutionPanel = (props) => {
  let words = props.solvedWords.sort().map(word => (
    <span key={word}>{word} </span>
  ));
  if (!words.length) {
    words = (
      <span className="text-muted">
        {`${props.totalCount} words of length ${props.wordLength}`}
      </span>);
  }
  const panel = (
    <li className="list-group-item">
      <span className="badge">
        {`${props.totalCount - props.solvedWords.length}`}
      </span>
      <span
        className={
          `${props.totalCount === props.solvedWords.length ? 'text-success' : ''}`}
      >
        {words}
      </span>
    </li>
  );
  return panel;
};

SolutionPanel.propTypes = {
  wordLength: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  solvedWords: PropTypes.arrayOf(PropTypes.string).isRequired,
};

class BuildBoard extends React.Component {
  renderAnswers() {
    // XXX: This is slowish. Maybe it's still fast enough for all intents
    // and purposes.
    // Render the user's answers.
    // An array of 15 elements, one for each possible word length.
    const solsarr = [];
    const solscounts = [];
    for (let i = 0; i < 15; i += 1) {
      solsarr.push([]);
      solscounts.push(0);
    }
    const origQuestion = this.props.origQuestions.get(this.alphagram);
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
    this.props.answerers.forEach((answered) => {
      // Answerers is a map of player to answers
      answered.forEach((word) => {
        solsarr[word.get('w').length - 1].push(<span>{word.get('w')} </span>);
      });
    });

    const answers = [];
    solscounts.forEach((ct, idx) => {
      if (ct !== 0) {
        const solvedWordsForLength = [];
        this.props.answerers.forEach((answered) => {
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
        answers.push(<SolutionPanel
          key={`length${idx + 1}`}
          wordLength={idx + 1}
          totalCount={ct}
          solvedWords={solvedWordsForLength}
        />);
      }
    });
    return answers;
  }

  render() {
    const leftMargin = 5;
    const topMargin = 4;
    const style = {
      backgroundImage: backgroundURL(this.props.displayStyle.background),
    };
    if (this.props.displayStyle.background === 'pool_table') {
      // Stretch this one.
      style.backgroundSize = '100% 100%';
    }

    // xSize and ySize are the size that each question object takes
    // up.
    const questionDisplayStyle = {
      tilesOn: this.props.displayStyle.tilesOn,
      tileStyle: this.props.displayStyle.tileStyle,
      blankCharacter: this.props.displayStyle.blankCharacter,
      font: this.props.displayStyle.font,
      showChips: this.props.displayStyle.showChips,
      bold: this.props.displayStyle.showBold,
      showBorders: this.props.displayStyle.showBorders,
      fontMultiplier: this.props.displayStyle.fontMultiplier,
      background: this.props.displayStyle.background,
      bodyBackground: this.props.displayStyle.bodyBackground,
    };
    const question = this.props.questions.get(0);
    this.alphagram = question.get('a');
    let renderedQuestion = null;
    if (question) {
      renderedQuestion = (
        <WordwallsQuestion
          displayStyle={questionDisplayStyle}
          letters={question.get('displayedAs')}
          qNumber={0}
          words={question.get('wMap')}
          gridX={(this.props.width > 320 ? this.props.width / 8.0 : 30)}
          gridY={0}
          ySize={40}
          xSize={200}
          onShuffle={this.props.onShuffle}
          scaleTransform={1.75}
        />);
    }

    return (
      <div>
        <svg
          style={style}
          width={this.props.width + (2 * leftMargin)}
          height={60 + (2 * topMargin)}
          onMouseDown={(e) => { e.preventDefault(); }}
        >{renderedQuestion}
        </svg>
        <ul className="list-group">
          {this.renderAnswers()}
        </ul>
      </div>
    );
  }
}

BuildBoard.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  width: PropTypes.number.isRequired,
  questions: PropTypes.instanceOf(Immutable.List).isRequired,
  onShuffle: PropTypes.func.isRequired,
  answerers: PropTypes.instanceOf(Immutable.Map).isRequired,
  origQuestions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
};

export default BuildBoard;
