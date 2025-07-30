/* eslint-disable jsx-a11y/label-has-associated-control */

import React from 'react';

interface SelectOption {
  value: string;
  displayValue: string;
}

interface SelectProps {
  options: SelectOption[];
  colSize: number;
  label: string;
  selectedValue: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  numItems?: number;
  badge?: string | null;
  disabled?: boolean;
}

function Select({
  options,
  colSize,
  label,
  selectedValue,
  onChange,
  numItems = 1,
  badge = null,
  disabled = false,
}: SelectProps) {
  // Ensure minimum width for better usability
  const effectiveColSize = Math.max(colSize, 4);
  const inputColSizeClass = `col-md-${effectiveColSize}`;
  const additionalSelectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {};

  let badgeElement: React.ReactElement | null = null;
  if (badge) {
    badgeElement = (<span className="badge bg-success">{badge}</span>);
  }

  const optionElements = options.map((element) => (
    <option
      value={element.value}
      key={element.value}
      data-testid={`searchrow-${element.value}`}
    >
      {element.displayValue}
    </option>
  ));

  if (numItems > 1) {
    additionalSelectProps.size = numItems;
  }
  if (disabled) {
    additionalSelectProps.disabled = true;
  }

  return (
    <div className="mb-3">
      <div className="row">
        <div className={inputColSizeClass}>
          <label className="form-label" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {label}
            {' '}
            {badgeElement}
          </label>
          <select
            value={selectedValue}
            onChange={onChange}
            className="form-select"
            style={{ minWidth: '120px' }}
            {...additionalSelectProps}
          >
            {optionElements}
          </select>
        </div>
      </div>
    </div>
  );
}

export default Select;
