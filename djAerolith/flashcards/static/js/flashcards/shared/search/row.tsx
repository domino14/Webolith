import React from 'react';

import {
  SearchTypesEnum,
  searchCriteriaOptions,
  SearchTypesInputs,
} from './types';
import Select from '../forms/select';
import NumberInput from '../forms/number_input';
import TextInput from '../forms/text_input';
import Checkbox from '../forms/checkbox';

interface Option {
  value: string;
  displayValue: string;
}

const convertOptions = (options: [string, string][]): Option[] => options.map((el) => ({
  value: el[0],
  displayValue: el[1],
}));

interface SelectValueProps {
  index: number;
  label: string;
  value: string;
  options: [string, string][];
  modifySearchParam: (index: number, param: string, value: string) => void;
}

function SelectValue({
  index,
  label,
  value,
  options,
  modifySearchParam,
}: SelectValueProps) {
  return (
    <Select
      colSize={6}
      label={label}
      selectedValue={String(value)}
      options={convertOptions(options)}
      onChange={(event) => {
        modifySearchParam(index, 'value', event.target.value);
      }}
    />
  );
}

interface NumberValueProps {
  minAllowed: number;
  maxAllowed: number;
  defaultValue: number;
  modifySearchParam: (index: number, param: string, value: string) => void;
  index: number;
  paramName: string;
  label: string;
}

function NumberValue({
  minAllowed,
  maxAllowed,
  defaultValue,
  modifySearchParam,
  index,
  paramName,
  label,
}: NumberValueProps) {
  return (
    <NumberInput
      colSize={12}
      label={label}
      value={String(defaultValue)}
      minAllowed={minAllowed}
      maxAllowed={maxAllowed}
      onChange={(event) => modifySearchParam(
        index,
        paramName,
        event.target.value,
      )}
    />
  );
}

interface MinMaxValuesProps {
  minValue: number;
  maxValue: number;
  minAllowed: number;
  maxAllowed: number;
  modifySearchParam: (index: number, param: string, value: string) => void;
  index: number;
}

function MinMaxValues({
  minValue,
  maxValue,
  minAllowed,
  maxAllowed,
  modifySearchParam,
  index,
}: MinMaxValuesProps) {
  return (
    <div className="row">
      <div className="col-xs-6">
        <NumberValue
          label="Min"
          defaultValue={minValue}
          minAllowed={minAllowed}
          maxAllowed={maxAllowed}
          modifySearchParam={modifySearchParam}
          index={index}
          paramName="minValue"
        />
      </div>
      <div className="col-xs-6">
        <NumberValue
          label="Max"
          defaultValue={maxValue}
          minAllowed={minAllowed}
          maxAllowed={maxAllowed}
          modifySearchParam={modifySearchParam}
          index={index}
          paramName="maxValue"
        />
      </div>
    </div>
  );
}

interface StringValueProps {
  value: string;
  index: number;
  modifySearchParam: (index: number, param: string, value: string) => void;
}

function StringValue({ value, index, modifySearchParam }: StringValueProps) {
  return (
    <TextInput
      colSize={6}
      label="Value"
      value={value}
      onChange={(event) => modifySearchParam(
        index,
        'value',
        event.target.value,
      )}
    />
  );
}

interface HooksValueProps {
  hookType: number;
  hooks: string;
  notCondition: boolean;
  index: number;
  modifySearchParam: (index: number, param: string, value: string | boolean) => void;
}

function HooksValue({
  hookType,
  hooks,
  notCondition,
  index,
  modifySearchParam,
}: HooksValueProps) {
  const hookTypeOptions: [string, string][] = [
    ['0', 'Front Hooks'],
    ['1', 'Back Hooks'],
  ];

  return (
    <div className="row">
      <div className="col-xs-4">
        <Select
          colSize={12}
          label="Hook Type"
          selectedValue={String(hookType)}
          options={convertOptions(hookTypeOptions)}
          onChange={(event) => {
            modifySearchParam(index, 'hookType', event.target.value);
          }}
        />
      </div>
      <div className="col-xs-5">
        <TextInput
          colSize={12}
          label="Hooks"
          value={hooks}
          onChange={(event) => modifySearchParam(
            index,
            'hooks',
            event.target.value,
          )}
        />
      </div>
      <div className="col-xs-3" style={{ paddingTop: '25px' }}>
        <Checkbox
          label="NOT"
          on={notCondition}
          onChange={(event) => modifySearchParam(
            index,
            'notCondition',
            event.target.checked,
          )}
        />
      </div>
    </div>
  );
}

interface SearchCriterion {
  minValue?: number;
  maxValue?: number;
  value?: string | number;
  hookType?: number;
  hooks?: string;
  notCondition?: boolean;
  [key: string]: unknown;
}

interface SearchRowProps {
  searchType: number;
  index: number;
  searchCriterion: SearchCriterion;
  minAllowedValue?: number;
  maxAllowedValue?: number;
  addRow: () => void;
  removeRow: (index: number) => void;
  removeDisabled: boolean;
  modifySearchType: (index: number, searchType: string) => void;
  modifySearchParam: (index: number, param: string, value: string | boolean) => void;
  allowedSearchTypes: Set<number>;
}

function SearchRow({
  searchType,
  index,
  searchCriterion,
  minAllowedValue = 1,
  maxAllowedValue = 100,
  addRow,
  removeRow,
  removeDisabled,
  modifySearchType,
  modifySearchParam,
  allowedSearchTypes,
}: SearchRowProps) {
  let specificForm: React.ReactNode;

  switch (SearchTypesEnum.properties[searchType].inputType) {
    case SearchTypesInputs.TWO_NUMBERS:
      specificForm = (
        <MinMaxValues
          minValue={searchCriterion.minValue || 0}
          maxValue={searchCriterion.maxValue || 0}
          minAllowed={minAllowedValue}
          maxAllowed={maxAllowedValue}
          modifySearchParam={modifySearchParam}
          index={index}
        />
      );
      break;
    case SearchTypesInputs.ONE_NUMBER:
      specificForm = (
        <NumberValue
          label="Value"
          paramName="value"
          defaultValue={Number(searchCriterion.value) || 0}
          minAllowed={minAllowedValue}
          maxAllowed={maxAllowedValue}
          modifySearchParam={modifySearchParam}
          index={index}
        />
      );
      break;
    case SearchTypesInputs.ONE_STRING:
      specificForm = (
        <StringValue
          value={String(searchCriterion.value || '')}
          index={index}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.SELECT:
      specificForm = (
        <SelectValue
          label="&nbsp;"
          value={String(searchCriterion.value || '')}
          index={index}
          modifySearchParam={modifySearchParam}
          options={SearchTypesEnum.properties[searchType].options || []}
        />
      );
      break;
    case SearchTypesInputs.HOOKS:
      specificForm = (
        <HooksValue
          hookType={searchCriterion.hookType || 0}
          hooks={searchCriterion.hooks || ''}
          notCondition={searchCriterion.notCondition || false}
          index={index}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.NONE:
      specificForm = null;
      break;
    default:
      break;
  }

  return (
    <div className="row search-row" style={{ marginBottom: '15px' }}>
      <div className="col-xs-2">
        <div style={{ paddingTop: '25px' }}>
          <button
            type="button"
            className="btn btn-info btn-add-search-row"
            style={{ marginRight: '5px' }}
            onClick={addRow}
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-info btn-remove-search-row"
            onClick={() => removeRow(index)}
            disabled={removeDisabled}
          >
            −
          </button>
        </div>
      </div>
      <div className="col-xs-3">
        <Select
          colSize={12}
          label="Search Criterion"
          selectedValue={String(searchType)}
          options={searchCriteriaOptions(allowedSearchTypes)}
          onChange={(event) => {
            modifySearchType(index, event.target.value);
          }}
        />
      </div>
      <div className="col-xs-7">{specificForm}</div>
    </div>
  );
}

export default SearchRow;
