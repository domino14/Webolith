/* eslint-disable jsx-a11y/label-has-associated-control */

import React from 'react';
import PropTypes from 'prop-types';

function Select(props) {
  const inputColSizeClass = `col-md-${props.colSize}`;
  const options = [];
  const additionalSelectProps = {};
  let badge;
  if (props.badge) {
    badge = (<span className="label label-success">{props.badge}</span>);
  }
  props.options.forEach((element) => {
    const o = (
      <option
        value={element.value}
        key={element.value}
      >
        {element.displayValue}
      </option>
    );
    options.push(o);
  });
  if (props.numItems > 1) {
    additionalSelectProps.size = props.numItems;
  }
  if (props.disabled) {
    additionalSelectProps.disabled = true;
  }
  return (
    <div className="form-group">
      <div className="row">
        <div className={inputColSizeClass}>
          <label style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {props.label}
            {' '}
            {badge}
          </label>
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
    </div>
  );
}

Select.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    displayValue: PropTypes.string,
  })).isRequired,
  colSize: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  selectedValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  numItems: PropTypes.number,
  badge: PropTypes.string,
  disabled: PropTypes.bool,
};

Select.defaultProps = {
  badge: null,
  disabled: false,
  numItems: 1,
};

export default Select;
