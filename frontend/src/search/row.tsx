import React from "react";
import {
  Select,
  NumberInput,
  TextInput,
  Group,
  CloseButton,
  Checkbox,
} from "@mantine/core";
import {
  SearchTypesEnum,
  searchCriteriaOptions,
  SearchTypesInputs,
  optionType,
  SearchCriterion,
} from "./types";
import { SearchRequest_HookType } from "../gen/rpc/wordsearcher/searcher_pb";

// Utility function to convert options
const convertOptions = (
  options: [string, string][]
): { value: string; label: string }[] =>
  options.map((el) => ({
    value: el[0],
    label: el[1],
  }));

// SelectValue Component
interface SelectValueProps {
  index: number;
  label: string;
  value: string;
  options: [string, string][];
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
}

const SelectValue: React.FC<SelectValueProps> = ({
  index,
  label,
  value,
  options,
  modifySearchParam,
}) => (
  <Select
    label={label}
    value={value}
    size="lg"
    data={convertOptions(options)}
    onChange={(selectedValue) => {
      modifySearchParam(index, "value", selectedValue || "");
    }}
  />
);

// NumberValue Component
interface NumberValueProps {
  index: number;
  label: string;
  paramName: string;
  defaultValue: number;
  minAllowed: number;
  maxAllowed: number;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
}

const NumberValue: React.FC<NumberValueProps> = ({
  index,
  label,
  paramName,
  defaultValue,
  minAllowed,
  maxAllowed,
  modifySearchParam,
}) => (
  <NumberInput
    label={label}
    value={defaultValue}
    min={minAllowed}
    max={maxAllowed}
    size="lg"
    onChange={(value) => modifySearchParam(index, paramName, value ?? "")}
  />
);

// MinMaxValues Component
interface MinMaxValuesProps {
  index: number;
  minValue: number;
  maxValue: number;
  minAllowed: number;
  maxAllowed: number;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
}

const MinMaxValues: React.FC<MinMaxValuesProps> = ({
  index,
  minValue,
  maxValue,
  minAllowed,
  maxAllowed,
  modifySearchParam,
}) => (
  <>
    <NumberValue
      index={index}
      label="Min"
      paramName="minValue"
      defaultValue={minValue}
      minAllowed={minAllowed}
      maxAllowed={maxAllowed}
      modifySearchParam={modifySearchParam}
    />
    <NumberValue
      index={index}
      label="Max"
      paramName="maxValue"
      defaultValue={maxValue}
      minAllowed={minAllowed}
      maxAllowed={maxAllowed}
      modifySearchParam={modifySearchParam}
    />
  </>
);

// StringValue Component
interface StringValueProps {
  index: number;
  value: string;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
}

const StringValue: React.FC<StringValueProps> = ({
  index,
  value,
  modifySearchParam,
}) => (
  <TextInput
    label="Value"
    size="lg"
    value={value}
    onChange={(event) =>
      modifySearchParam(index, "value", event.currentTarget.value)
    }
  />
);

// HooksValue Component
interface HooksValueProps {
  index: number;
  hookType: number;
  hooks: string;
  notCondition: boolean;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
}

const HooksValue: React.FC<HooksValueProps> = ({
  index,
  hookType,
  hooks,
  notCondition,
  modifySearchParam,
}) => {
  const hookTypeOptions = [
    { value: String(SearchRequest_HookType.FRONT_HOOKS), label: "Front Hooks" },
    { value: String(SearchRequest_HookType.BACK_HOOKS), label: "Back Hooks" },
  ];

  return (
    <Group>
      <Select
        label="Hook Type"
        value={String(hookType)}
        size="lg"
        data={hookTypeOptions}
        onChange={(selectedValue) => {
          modifySearchParam(index, "hookType", selectedValue || "0");
        }}
      />
      <TextInput
        label="Hooks"
        size="lg"
        value={hooks}
        onChange={(event) =>
          modifySearchParam(index, "hooks", event.currentTarget.value)
        }
      />
      <Checkbox
        label="NOT"
        checked={notCondition}
        onChange={(event) =>
          modifySearchParam(index, "notCondition", event.currentTarget.checked)
        }
        mt={25}
      />
    </Group>
  );
};

// SearchRow Component
interface SearchRowProps {
  index: number;
  searchCriterion: SearchCriterion;
  minAllowedValue?: number;
  maxAllowedValue?: number;
  removeRow: (index: number) => void;
  removeDisabled: boolean;
  modifySearchType: (index: number, value: number) => void;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
  allowedSearchTypes: Set<number>;
}

const SearchRow: React.FC<SearchRowProps> = ({
  index,
  searchCriterion,
  minAllowedValue = 1,
  maxAllowedValue = 100,
  removeRow,
  removeDisabled,
  modifySearchType,
  modifySearchParam,
  allowedSearchTypes,
}) => {
  let specificForm: React.ReactNode;

  switch (SearchTypesEnum.properties[searchCriterion.searchType].inputType) {
    case SearchTypesInputs.TWO_NUMBERS:
      specificForm = (
        <MinMaxValues
          index={index}
          minValue={searchCriterion.options.minValue as number}
          maxValue={searchCriterion.options.maxValue as number}
          minAllowed={minAllowedValue}
          maxAllowed={maxAllowedValue}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.ONE_NUMBER:
      specificForm = (
        <NumberValue
          index={index}
          label="Value"
          paramName="value"
          defaultValue={searchCriterion.options.value as number}
          minAllowed={minAllowedValue}
          maxAllowed={maxAllowedValue}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.ONE_STRING:
      specificForm = (
        <StringValue
          index={index}
          value={searchCriterion.options.value as string}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.SELECT:
      specificForm = (
        <SelectValue
          index={index}
          label=" "
          value={searchCriterion.options.value as string}
          options={
            SearchTypesEnum.properties[searchCriterion.searchType].options as [
              string,
              string
            ][]
          }
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.HOOKS:
      specificForm = (
        <HooksValue
          index={index}
          hookType={searchCriterion.options.hookType as number}
          hooks={searchCriterion.options.hooks as string}
          notCondition={searchCriterion.options.notCondition as boolean}
          modifySearchParam={modifySearchParam}
        />
      );
      break;
    case SearchTypesInputs.NONE:
    default:
      specificForm = null;
      break;
  }

  return (
    <Group>
      <Group wrap="nowrap">
        <Select
          w="100%"
          label="Search Criterion"
          value={String(searchCriterion.searchType)}
          data={searchCriteriaOptions(allowedSearchTypes).map((el) => ({
            value: el.value,
            label: el.displayValue,
          }))}
          onChange={(selectedValue) => {
            modifySearchType(index, parseInt(selectedValue || "0", 10));
          }}
          size="lg"
        />
      </Group>
      <Group wrap="nowrap" align="center">
        {specificForm}
        <CloseButton
          variant=""
          onClick={() => removeRow(index)}
          disabled={removeDisabled}
          mt={25}
          size="lg"
        />
      </Group>
    </Group>
  );
};

export default SearchRow;
