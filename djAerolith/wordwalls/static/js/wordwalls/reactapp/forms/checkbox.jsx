/**
 * @fileOverview A Bootstrap-based checkbox component.
 */
import React from 'react';

const CheckBox = props =>
  <div className="form-group">
    <div className="checkbox">
      <label>
        <input
          type="checkbox"
          name={props.inputName}
          checked={props.on}
          value={props.inputName/* doesn't matter */}
          onChange={props.onChange}
        />
        {props.label}
      </label>
    </div>
  </div>;

CheckBox.propTypes = {
  inputName: React.PropTypes.string,
  on: React.PropTypes.bool,
  onChange: React.PropTypes.func,
  label: React.PropTypes.string,
};

export default CheckBox;
