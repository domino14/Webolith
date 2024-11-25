import React from "react";
import { SearchTypesEnum, SearchCriterion, optionType } from "./types";
import SearchRow from "./row";
import { Button, Divider, Group, Stack } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

interface SearchRowsProps {
  criteria: SearchCriterion[];
  modifySearchType: (index: number, value: number) => void;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
  addSearchRow: () => void;
  removeSearchRow: (index: number) => void;
  allowedSearchTypes: Set<number>;
}

const SearchRows: React.FC<SearchRowsProps> = (props) => {
  return (
    <Stack>
      {props.criteria.map((criterion, idx) => (
        <React.Fragment key={`fragment${idx}`}>
          <SearchRow
            index={idx}
            searchCriterion={criterion}
            minAllowedValue={
              SearchTypesEnum.properties[criterion.searchType].minAllowed
            }
            maxAllowedValue={
              SearchTypesEnum.properties[criterion.searchType].maxAllowed
            }
            removeRow={props.removeSearchRow}
            removeDisabled={idx === 0 && props.criteria.length === 1}
            modifySearchType={props.modifySearchType}
            modifySearchParam={props.modifySearchParam}
            allowedSearchTypes={props.allowedSearchTypes}
          />
        </React.Fragment>
      ))}

      <Group>
        <Button
          variant="transparent"
          onClick={props.addSearchRow}
          color="gray"
          size="compact-lg"
          leftSection={<IconPlus />}
        >
          Add Criterion
        </Button>
      </Group>

      <Divider my="md" />
    </Stack>
  );
};

export default SearchRows;
