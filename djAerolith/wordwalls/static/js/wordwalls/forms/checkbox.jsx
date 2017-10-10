/* eslint-disable jsx-a11y/label-has-for */
/**
 * @fileOverview A Bootstrap-based checkbox component.
 */
import React from 'react';
import PropTypes from 'prop-types';

const CheckBox = (props) => {
  let addlInputProps = {};
  if (props.disabled === true) {
    addlInputProps = {
      disabled: true,
    };
  }
  return (
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            {...addlInputProps}
            name={props.inputName}
            checked={props.on}
            value={props.inputName/* doesn't matter */}
            onChange={props.onChange}
          />
          {props.label}
        </label>
      </div>
    </div>);
};

CheckBox.propTypes = {
  inputName: PropTypes.string.isRequired,
  on: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

CheckBox.defaultProps = {
  disabled: false,
};

export default CheckBox;
