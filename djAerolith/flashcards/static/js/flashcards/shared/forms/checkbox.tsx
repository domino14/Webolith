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
  id?: string;
  name?: string;
  helpText?: string;
}

function CheckBox({
  on, onChange, label, disabled = false, id, name, helpText,
}: CheckBoxProps) {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const addlInputProps = disabled ? { disabled: true } : {};

  return (
    <div className="checkbox">
      <label htmlFor={inputId}>
        <input
          type="checkbox"
          id={inputId}
          name={name}
          {...addlInputProps}
          checked={on}
          onChange={onChange}
        />
        {' '}
        {label}
      </label>
      {helpText && (
        <p className="help-block">
          {helpText}
        </p>
      )}
    </div>
  );
}

export default CheckBox;
