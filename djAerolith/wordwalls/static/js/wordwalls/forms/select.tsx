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
  const inputColSizeClass = `col-md-${colSize}`;
  const additionalSelectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {};

  let badgeElement: React.ReactElement | null = null;
  if (badge) {
    badgeElement = (<span className="label label-success">{badge}</span>);
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
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {label}
            {' '}
            {badgeElement}
          </label>
          <select
            value={selectedValue}
            onChange={onChange}
            className="form-control"
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
