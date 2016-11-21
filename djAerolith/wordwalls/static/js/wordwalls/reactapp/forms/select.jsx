/* eslint-disable jsx-a11y/label-has-for */

import React from 'react';

const Select = (props) => {
  const inputColSizeClass = `col-md-${props.colSize}`;
  const options = [];
  props.options.forEach((element, idx) =>
    options.push(<option
      value={element.value}
      key={idx}
    >{element.displayValue}</option>));

  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label>{props.label}</label>
          <select
            value={props.selectedValue}
            onChange={props.onChange}
            className="form-control"
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
};


export default Select;
