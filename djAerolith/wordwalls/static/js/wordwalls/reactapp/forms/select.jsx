/* eslint-disable jsx-a11y/label-has-for */

import React from 'react';

const Select = (props) => {
  const options = [];
  props.options.forEach((element, idx) =>
    options.push(<option
      value={element.value}
      key={idx}
    >{element.displayValue}</option>));

  return (<div className="form-group">
    <label>{props.label}</label>
    <select
      value={props.selectedValue}
      onChange={props.onChange}
      className="form-control"
    >
      {options}
    </select>
  </div>);
};

Select.propTypes = {
  options: React.PropTypes.arrayOf(React.PropTypes.shape({
    value: React.PropTypes.string,
    displayValue: React.PropTypes.string,
  })),
  label: React.PropTypes.string,
  selectedValue: React.PropTypes.string,
  onChange: React.PropTypes.func,
};


export default Select;
