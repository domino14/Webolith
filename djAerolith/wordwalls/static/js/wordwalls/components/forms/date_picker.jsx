/**
 * @fileOverview A Bootstrap-based datepicker component.
 */

import React from 'react';
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
        toDisplay: date => moment.utc(date).format('ddd MMM DD YYYY'),
        toValue: date => new Date(date),
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
    return (
      <div>
        <label
          htmlFor={this.props.id}
          style={{ marginTop: '0.75em' }}
        >{this.props.label}</label>
        <div className="input-group date col-sm-6">
          <input
            type="text"
            className="form-control"
            id={this.props.id}
            value={this.props.value.toDate().toDateString()}
            onChange={this.props.onDateChange}
            ref={node => (this.inputNode = node)}
          />
          <div className="input-group-addon">
            <span className="glyphicon glyphicon-th" />
          </div>
        </div>
      </div>);
  }
}

DatePicker.propTypes = {
  id: React.PropTypes.string,
  value: React.PropTypes.instanceOf(moment),
  label: React.PropTypes.string,
  onDateChange: React.PropTypes.func,
  startDate: React.PropTypes.instanceOf(Date),
};

export default DatePicker;
