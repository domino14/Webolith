// SearchRow.tsx

import React from "react";
import {
  Grid,
  Select,
  NumberInput,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import {
  SearchTypesEnum,
  searchCriteriaOptions,
  SearchTypesInputs,
  optionType,
  SearchCriterion,
} from "./types";

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
    value={value}
    onChange={(event) =>
      modifySearchParam(index, "value", event.currentTarget.value)
    }
  />
);

// SearchRow Component
interface SearchRowProps {
  index: number;
  searchCriterion: SearchCriterion;
  minAllowedValue?: number;
  maxAllowedValue?: number;
  addRow: () => void;
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
  addRow,
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
    case SearchTypesInputs.NONE:
    default:
      specificForm = null;
      break;
  }

  return (
    <Grid align="flex-start" justify="flex-start" className="search-row">
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <Group wrap="nowrap" align="center">
          <Button
            variant="light"
            color="blue"
            onClick={addRow}
            style={{ marginTop: 25 }}
          >
            <IconPlus size={16} />
          </Button>

          <Button
            variant="light"
            color="blue"
            onClick={() => removeRow(index)}
            disabled={removeDisabled}
            style={{ marginTop: 25 }}
          >
            <IconMinus size={16} />
          </Button>
          <Select
            label="Search Criterion"
            value={String(searchCriterion.searchType)}
            data={searchCriteriaOptions(allowedSearchTypes).map((el) => ({
              value: el.value,
              label: el.displayValue,
            }))}
            onChange={(selectedValue) => {
              modifySearchType(index, parseInt(selectedValue || "0", 10));
            }}
          />
        </Group>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <Group wrap="nowrap">{specificForm}</Group>
      </Grid.Col>
    </Grid>
  );
};

export default SearchRow;
