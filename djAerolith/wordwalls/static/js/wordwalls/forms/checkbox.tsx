/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * @fileOverview A Bootstrap-based checkbox component.
 */
import React from 'react';

interface CheckBoxProps {
  on: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
}

function CheckBox({
  on, onChange, label, disabled = false,
}: CheckBoxProps) {
  const addlInputProps = disabled ? { disabled: true } : {};

  return (
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            {...addlInputProps}
            checked={on}
            onChange={onChange}
          />
          {label}
        </label>
      </div>
    </div>
  );
}

export default CheckBox;
