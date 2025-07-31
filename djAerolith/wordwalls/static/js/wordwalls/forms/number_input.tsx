 
/**
 * @fileOverview A Bootstrap-based text numerical input component.
 */

import React from 'react';

interface NumberInputProps {
  colSize: number;
  label: string;
  // Note that value is a string. This is because number inputs still
  // have string values, especially for empty inputs. ('')
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  minAllowed?: number | null;
  maxAllowed?: number | null;
}

function NumberInput({
  colSize,
  label,
  value,
  onChange,
  disabled = false,
  minAllowed = null,
  maxAllowed = null,
}: NumberInputProps) {
  const inputColSizeClass = `col-md-${colSize}`;
  const addlInputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

  if (disabled === true) {
    addlInputProps.disabled = true;
  }
  if (minAllowed != null) {
    addlInputProps.min = minAllowed;
  }
  if (maxAllowed != null) {
    addlInputProps.max = maxAllowed;
  }

  return (
    <div className="mb-3">
      <div className="row">
        <div className={inputColSizeClass}>
          <label className="form-label" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {label}
          </label>
          <input
            type="number"
            {...addlInputProps}
            value={value}
            className="form-control"
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}

export default NumberInput;
