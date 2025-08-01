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
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  id,
  value,
  label,
  onDateChange,
  startDate,
}, ref) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    onDateChange(selectedDate);
  };

  // Format dates for HTML5 date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const today = new Date();

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
          max={formatDateForInput(today)}
        />
      </div>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
