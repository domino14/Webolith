/**
 * @fileOverview A Bootstrap-based datepicker component.
 */

import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';
import $ from 'jquery';
import 'bootstrap-datepicker';

class DatePicker extends React.Component {
  componentDidMount() {
    $(this.inputNode).datepicker({
      startDate: this.props.startDate,
      todayBtn: 'linked',
      todayHighlight: true,
      autoclose: true,
      endDate: new Date(),
      format: {
        // datepicker stores dates in utc internally, so we need to show them
        // correctly.
        toDisplay: (date) => moment.utc(date).format('ddd MMM DD YYYY'),
        toValue: (date) => new Date(date),
      },
    })
      .on('changeDate', (e) => {
      // We must manually trigger the `onChange` event of the input,
      // because it won't be triggered automatically.
      // XXX: We should not be doing this; instead we should find a
      // React datepicker and use bootstrap-react, etc. But this will do
      // for now.
        this.props.onDateChange(new Date(e.date));
      });
  }

  render() {
    // need nesting to get rid of jsx-a11y rule below
    return (
      <div>
        <label // eslint-disable-line jsx-a11y/label-has-for
          htmlFor={this.props.id}
          style={{ marginTop: '0.75em' }}
        >
          {this.props.label}
        </label>
        <div className="input-group date col-sm-6">
          <input
            type="text"
            className="form-control"
            id={this.props.id}
            value={this.props.value.toDate().toDateString()}
            onChange={this.props.onDateChange}
            ref={(node) => {
              this.inputNode = node;
            }}
          />
          <span className="input-group-text">
            <i className="bi bi-calendar4" />
          </span>
        </div>
      </div>
    );
  }
}

DatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.instanceOf(moment).isRequired,
  label: PropTypes.string.isRequired,
  onDateChange: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date).isRequired,
};

export default DatePicker;
