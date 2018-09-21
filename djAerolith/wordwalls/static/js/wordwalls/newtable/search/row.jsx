import React from 'react';
import PropTypes from 'prop-types';

import Select from '../../forms/select';
import NumberInput from '../../forms/number_input';
import TextInput from '../../forms/text_input';

import {
  SearchTypesEnum,
  searchCriteriaOptions,
  SearchTypesInputs } from './types';

const convertOptions = options => options.map(el => ({
  value: el[0],
  displayValue: el[1],
}));

const SelectValue = props => (
  <div className="col-xs-3">
    <Select
      colSize={12}
      label={props.label}
      selectedValue={String(props.value)}
      options={convertOptions(props.options)}
      onChange={(event) => {
        props.modifySearchParam(props.index, 'value', event.target.value);
      }}
    />
  </div>);

SelectValue.propTypes = {
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  modifySearchParam: PropTypes.func.isRequired,
};

const NumberValue = props => (
  <div className="col-xs-3">
    <NumberInput
      colSize={12}
      label={props.label}
      value={String(props.defaultValue)}
      minAllowed={props.minAllowed}
      maxAllowed={props.maxAllowed}
      onChange={event => props.modifySearchParam(
        props.index,
        props.paramName,
        event.target.value,
      )}
    />
  </div>);

NumberValue.propTypes = {
  minAllowed: PropTypes.number.isRequired,
  maxAllowed: PropTypes.number.isRequired,
  defaultValue: PropTypes.number.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  paramName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const MinMaxValues = props => (
  <div style={{ marginTop: '2px' }}>
    <NumberValue
      label="Min"
      defaultValue={props.minValue}
      minAllowed={props.minAllowed}
      maxAllowed={props.maxAllowed}
      modifySearchParam={props.modifySearchParam}
      index={props.index}
      paramName="minValue"
    />
    <NumberValue
      label="Max"
      defaultValue={props.maxValue}
      minAllowed={props.minAllowed}
      maxAllowed={props.maxAllowed}
      modifySearchParam={props.modifySearchParam}
      index={props.index}
      paramName="maxValue"
    />
  </div>);

MinMaxValues.propTypes = {
  minValue: PropTypes.number.isRequired,
  maxValue: PropTypes.number.isRequired,
  minAllowed: PropTypes.number.isRequired,
  maxAllowed: PropTypes.number.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

const StringValue = props => (
  <div className="col-xs-4 col-sm-6" style={{ marginTop: '2px' }}>
    <TextInput
      colSize={12}
      label="Value"
      value={props.value}
      onChange={event => props.modifySearchParam(
        props.index,
        'value',
        event.target.value,
      )}
    />
  </div>);

StringValue.propTypes = {
  value: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
};

const SearchRow = (props) => {
  let specificForm;

  switch (SearchTypesEnum.properties[props.searchType].inputType) {
    case SearchTypesInputs.TWO_NUMBERS:
      specificForm = (
        <MinMaxValues
          minValue={props.searchCriterion.minValue}
          maxValue={props.searchCriterion.maxValue}
          minAllowed={props.minAllowedValue}
          maxAllowed={props.maxAllowedValue}
          modifySearchParam={props.modifySearchParam}
          index={props.index}
        />);
      break;
    case SearchTypesInputs.ONE_NUMBER:
      specificForm = (
        <NumberValue
          label="Value"
          paramName="value"
          defaultValue={props.searchCriterion.value}
          minAllowed={props.minAllowedValue}
          maxAllowed={props.maxAllowedValue}
          modifySearchParam={props.modifySearchParam}
          index={props.index}
        />);
      break;
    case SearchTypesInputs.ONE_STRING:
      specificForm = (
        <StringValue
          value={props.searchCriterion.value}
          index={props.index}
          modifySearchParam={props.modifySearchParam}
        />);
      break;
    case SearchTypesInputs.SELECT:
      specificForm = (
        <SelectValue
          label="&nbsp;"
          value={props.searchCriterion.value}
          index={props.index}
          modifySearchParam={props.modifySearchParam}
          options={SearchTypesEnum.properties[props.searchType].options}
        />);
      break;
    default:
      break;
  }

  return (
    <div className="row search-row">
      <div className="col-xs-1" style={{ marginTop: '33px', marginBottom: '5px' }}>
        <button
          className="btn btn-info btn-xs btn-add-search-row"
          onClick={props.addRow}
        ><span className="glyphicon glyphicon-plus" aria-hidden="true" />
        </button>
      </div>
      <div className="col-xs-1" style={{ marginTop: '33px', marginBottom: '5px' }}>
        <button
          className="btn btn-info btn-xs btn-remove-search-row"
          onClick={() => props.removeRow(props.index)}
          disabled={props.removeDisabled}
        ><span className="glyphicon glyphicon-minus" aria-hidden="true" />
        </button>
      </div>
      <div className="col-xs-4">
        <Select
          colSize={12}
          label="Search Criterion"
          selectedValue={String(props.searchType)}
          options={searchCriteriaOptions(props.allowedSearchTypes)}
          onChange={(event) => {
            props.modifySearchType(props.index, event.target.value);
          }}
        />
      </div>
      {specificForm}
    </div>
  );
};

SearchRow.propTypes = {
  searchType: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  searchCriterion: PropTypes.objectOf(PropTypes.any).isRequired,
  minAllowedValue: PropTypes.number,
  maxAllowedValue: PropTypes.number,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  removeDisabled: PropTypes.bool.isRequired,
  modifySearchType: PropTypes.func.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

SearchRow.defaultProps = {
  minAllowedValue: 1,
  maxAllowedValue: 100,
};

export default SearchRow;

