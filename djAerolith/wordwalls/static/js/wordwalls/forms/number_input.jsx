/* eslint-disable jsx-a11y/label-has-for */
/**
 * @fileOverview A Bootstrap-based text numerical input component.
 */

import React from 'react';

const NumberInput = (props) => {
  const inputColSizeClass = `col-md-${props.colSize}`;
  const addlInputProps = {};
  if (props.disabled === true) {
    addlInputProps.disabled = true;
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
            name={props.inputName}
            value={props.value}
            className="form-control input-sm"
            onChange={props.onChange}
          />
        </div>
      </div>
    </div>
  );
};

NumberInput.propTypes = {
  colSize: React.PropTypes.number,
  label: React.PropTypes.string,
  inputName: React.PropTypes.string,
  // Note that value is a string. This is because number inputs still
  // have string values, especially for empty inputs. ('')
  value: React.PropTypes.string,
  onChange: React.PropTypes.func,
  disabled: React.PropTypes.bool,
};

export default NumberInput;
