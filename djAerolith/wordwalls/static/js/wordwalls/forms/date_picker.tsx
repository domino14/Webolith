/**
 * @fileOverview A Bootstrap-based datepicker component.
 */

import React, { useEffect, useRef } from 'react';

import moment from 'moment';
import $ from 'jquery';
import 'bootstrap-datepicker';

interface DatePickerProps {
  id: string;
  value: ReturnType<typeof moment>;
  label: string;
  onDateChange: (date: Date) => void;
  startDate: Date;
}

function DatePicker({
  id,
  value,
  label,
  onDateChange,
  startDate,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      $(inputRef.current).datepicker({
        startDate,
        todayBtn: 'linked',
        todayHighlight: true,
        autoclose: true,
        endDate: new Date(),
        format: {
          // datepicker stores dates in utc internally, so we need to show them
          // correctly.
          toDisplay: (date: Date) => moment.utc(date).format('ddd MMM DD YYYY'),
          toValue: (date: string) => new Date(date),
        },
      })
        .on('changeDate', (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          // We must manually trigger the `onChange` event of the input,
          // because it won't be triggered automatically.
          // XXX: We should not be doing this; instead we should find a
          // React datepicker and use bootstrap-react, etc. But this will do
          // for now.
          onDateChange(new Date(e.date));
        });
    }

    // Cleanup function
    return () => {
      if (inputRef.current) {
        $(inputRef.current).datepicker('destroy');
      }
    };
  }, [startDate, onDateChange]);

  return (
    <div>
      <label // eslint-disable-line jsx-a11y/label-has-for
        htmlFor={id}
        style={{ marginTop: '0.75em' }}
      >
        {label}
      </label>
      <div className="input-group date col-sm-6">
        <input
          type="text"
          className="form-control"
          id={id}
          value={value.toDate().toDateString()}
          onChange={() => {}} // Controlled by datepicker
          ref={inputRef}
        />
        <div className="input-group-addon">
          <span className="glyphicon glyphicon-th" />
        </div>
      </div>
    </div>
  );
}

export default DatePicker;
