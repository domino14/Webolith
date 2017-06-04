/* eslint-disable jsx-a11y/label-has-for */
/**
 * @fileOverview A Bootstrap-based checkbox component.
 */
import React from 'react';

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
  inputName: React.PropTypes.string,
  on: React.PropTypes.bool,
  onChange: React.PropTypes.func,
  label: React.PropTypes.string,
  disabled: React.PropTypes.bool,
};

export default CheckBox;
