/**
 * @fileOverview A native HTML5 date input component.
 */

import React, { forwardRef } from 'react';

import moment from 'moment';

interface DatePickerProps {
  id: string;
  value: ReturnType<typeof moment>;
  label: string;
  onDateChange: (date: Date) => void;
  startDate: Date;
  maxDate?: Date;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  id,
  value,
  label,
  onDateChange,
  startDate,
  maxDate,
}, ref) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date string as local date to avoid timezone issues
    // e.target.value is in format "YYYY-MM-DD"
    const dateStr = e.target.value;
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
    onDateChange(selectedDate);
  };

  // Format dates for HTML5 date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const maxDateToUse = maxDate || today;

  return (
    <div>
      <label 
        htmlFor={id}
        style={{ marginTop: '0.75em' }}
      >
        {label}
      </label>
      <div className="col-sm-6">
        <input
          type="date"
          className="form-control"
          id={id}
          ref={ref}
          value={formatDateForInput(value.toDate())}
          onChange={handleDateChange}
          min={formatDateForInput(startDate)}
          max={formatDateForInput(maxDateToUse)}
        />
      </div>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
