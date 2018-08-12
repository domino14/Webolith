/* eslint-disable jsx-a11y/label-has-for */
/**
 * @fileOverview A Bootstrap-based text input component.
 */

import React from 'react';
import PropTypes from 'prop-types';

const TextInput = (props) => {
  const inputColSizeClass = `col-md-${props.colSize}`;
  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {props.label}
          </label>
          <input
            type="text"
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

TextInput.defaultProps = {
  onKeyPress: () => {},
  maxLength: 100,
};

TextInput.propTypes = {
  colSize: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func,
};

export default TextInput;
