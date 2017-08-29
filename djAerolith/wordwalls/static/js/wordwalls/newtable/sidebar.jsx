import React from 'react';

import Pills from './pills';
import Select from '../forms/select';
import NumberInput from '../forms/number_input';

/**
 * Get lexicon options from the given object in a Select-friendly format.
 * @param  {Array.<Object>} lexicaObject
 * @return {Array.<Object>}
 */
function getLexiconOptions(lexicaObject) {
  return lexicaObject.map(obj => ({
    value: String(obj.id),
    displayValue: obj.lexicon,
  }));
}

const Sidebar = props => (
  <div>

    <Pills
      stacked
      options={props.gameTypes}
      activePill={props.activeGameType}
      onPillClick={props.setGameType}
    />

    <div className="row">
      <div className="col-sm-12">
        <form>
          <Select
            colSize={10}
            label="Lexicon"
            selectedValue={String(props.currentLexicon)}
            options={getLexiconOptions(props.availableLexica)}
            onChange={e => props.setLexicon(
              parseInt(e.target.value, 10))}
          />
          <NumberInput
            colSize={10}
            label="Minutes"
            value={props.desiredTime}
            onChange={e => props.setTime(e.target.value)}
            disabled={props.disabledInputs}
          />
          <NumberInput
            colSize={10}
            label="Questions Per Round"
            value={String(props.questionsPerRound)}
            onChange={e => props.setQuestionsPerRound(
              parseInt(e.target.value, 10))}
            disabled={props.disabledInputs}
          />
        </form>
      </div>
    </div>
  </div>
);

Sidebar.propTypes = {
  gameTypes: React.PropTypes.arrayOf(React.PropTypes.string),
  activeGameType: React.PropTypes.string,
  setGameType: React.PropTypes.func,
  currentLexicon: React.PropTypes.number,
  // XXX: Something is terribly wrong with eslint; these props are
  // clearly used.
  setLexicon: React.PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  desiredTime: React.PropTypes.string,
  setTime: React.PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  questionsPerRound: React.PropTypes.number,
  setQuestionsPerRound: React.PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  disabledInputs: React.PropTypes.bool,

  availableLexica: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    lexicon: React.PropTypes.string,
    description: React.PropTypes.string,
    counts: React.PropTypes.object,
  })),
};

export default Sidebar;

