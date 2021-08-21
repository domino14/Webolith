/* eslint-disable jsx-a11y/label-has-associated-control */
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
    <div className="form-check">
      <label className="form-label mb-1">
        <input
          type="checkbox"
          className="form-check-input"
          {...addlInputProps}
          checked={props.on}
          onChange={props.onChange}
        />
        {props.label}
      </label>
    </div>
  );
};

CheckBox.propTypes = {
  on: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

CheckBox.defaultProps = {
  disabled: false,
};

export default CheckBox;
