import React from 'react';
import PropTypes from 'prop-types';

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
            onChange={e => props.setLexicon(parseInt(e.target.value, 10))}
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
            onChange={e => props.setQuestionsPerRound(parseInt(e.target.value, 10))}
            disabled={props.disabledInputs}
          />
        </form>
      </div>
    </div>
  </div>
);

Sidebar.propTypes = {
  gameTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeGameType: PropTypes.string.isRequired,
  setGameType: PropTypes.func.isRequired,
  currentLexicon: PropTypes.number.isRequired,
  setLexicon: PropTypes.func.isRequired,
  desiredTime: PropTypes.string.isRequired,
  setTime: PropTypes.func.isRequired,
  questionsPerRound: PropTypes.number.isRequired,
  setQuestionsPerRound: PropTypes.func.isRequired,
  disabledInputs: PropTypes.bool.isRequired,

  availableLexica: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    lexicon: PropTypes.string,
    description: PropTypes.string,
    counts: PropTypes.object,
  })).isRequired,
};

export default Sidebar;

