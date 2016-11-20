/* eslint-disable jsx-a11y/label-has-for */
/**
 * @fileOverview A Bootstrap-based text input component.
 */

import React from 'react';

const TextInput = (props) => {
  const inputColSizeClass = `col-md-${props.colSize}`;
  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label>{props.label}</label>
          <input
            type="text"
            name={props.inputName}
            value={props.value}
            className="form-control input-sm"
            maxLength={props.maxLength}
            onChange={props.onChange}
            onKeyPress={props.onKeyPress}
          />
        </div>
      </div>
    </div>
  );
};

TextInput.propTypes = {
  colSize: React.PropTypes.number,
  label: React.PropTypes.string,
  inputName: React.PropTypes.string,
  value: React.PropTypes.string,
  maxLength: React.PropTypes.number,
  onChange: React.PropTypes.func,
  onKeyPress: React.PropTypes.func,
};

export default TextInput;
