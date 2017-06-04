/* eslint-disable jsx-a11y/label-has-for */

import React from 'react';

const Select = (props) => {
  const inputColSizeClass = `col-md-${props.colSize}`;
  const options = [];
  const additionalSelectProps = {};
  props.options.forEach((element, idx) =>
    options.push(<option
      value={element.value}
      key={idx}
    >{element.displayValue}</option>));
  if (props.numItems > 1) {
    additionalSelectProps.size = props.numItems;
  }
  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label>{props.label}</label>
          <select
            value={props.selectedValue}
            onChange={props.onChange}
            className="form-control"
            {...additionalSelectProps}
          >
            {options}
          </select>
        </div>
      </div>
    </div>);
};

Select.propTypes = {
  options: React.PropTypes.arrayOf(React.PropTypes.shape({
    value: React.PropTypes.string,
    displayValue: React.PropTypes.string,
  })),
  colSize: React.PropTypes.number,
  label: React.PropTypes.string,
  selectedValue: React.PropTypes.string,
  onChange: React.PropTypes.func,
  numItems: React.PropTypes.number,
};


export default Select;
