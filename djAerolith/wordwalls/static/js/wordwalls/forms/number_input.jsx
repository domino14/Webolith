/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * @fileOverview A Bootstrap-based text numerical input component.
 */

import React from 'react';
import PropTypes from 'prop-types';

const NumberInput = (props) => {
  const inputColSizeClass = props.colSize ? `col-md-${props.colSize}` : '';
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
    <div className={inputColSizeClass}>
      <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }} className="form-label mb-1">
        {props.label}
      </label>
      <input
        type="number"
        {...addlInputProps}
        value={props.value}
        className="form-control"
        onChange={props.onChange}
      />
    </div>
  );
};

NumberInput.defaultProps = {
  minAllowed: null,
  maxAllowed: null,
  disabled: false,
  colSize: null,
};

NumberInput.propTypes = {
  colSize: PropTypes.number,
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
