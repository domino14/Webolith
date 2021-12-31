/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * @fileOverview A Bootstrap-based text numerical input component.
 */

import React from 'react';
import PropTypes from 'prop-types';

function NumberInput(props) {
  const inputColSizeClass = `col-md-${props.colSize}`;
  const addlInputProps = {};
  if (props.disabled === true) {
    addlInputProps.disabled = true;
  }
  if (props.minAllowed != null) {
    addlInputProps.min = props.minAllowed;
  }
  if (props.maxAllowed != null) {
    addlInputProps.max = props.maxAllowed;
  }
  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {props.label}
          </label>
          <input
            type="number"
            {...addlInputProps}
            value={props.value}
            className="form-control input-sm"
            onChange={props.onChange}
          />
        </div>
      </div>
    </div>
  );
}

NumberInput.defaultProps = {
  minAllowed: null,
  maxAllowed: null,
  disabled: false,
};

NumberInput.propTypes = {
  colSize: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  // Note that value is a string. This is because number inputs still
  // have string values, especially for empty inputs. ('')
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  minAllowed: PropTypes.number,
  maxAllowed: PropTypes.number,
};

export default NumberInput;
