/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * @fileOverview A Bootstrap-based text input component.
 */

import React from 'react';

interface TextInputProps {
  colSize: number;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function TextInput({
  colSize,
  label,
  value,
  onChange,
  maxLength = 100,
  onKeyPress = () => {},
}: TextInputProps) {
  const inputColSizeClass = `col-md-${colSize}`;

  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {label}
          </label>
          <input
            type="text"
            value={value}
            className="form-control input-sm"
            maxLength={maxLength}
            onChange={onChange}
            onKeyPress={onKeyPress}
          />
        </div>
      </div>
    </div>
  );
}

export default TextInput;
