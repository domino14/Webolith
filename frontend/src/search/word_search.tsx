import { useCallback, useContext, useState } from "react";
import { SearchTypesEnum, SearchCriterion } from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import Cookies from "js-cookie";
import SearchRows from "./rows";
import { Alert, Button, Stack } from "@mantine/core";

const allowedSearchTypes = new Set([
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.TAGS,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.NOT_IN_LEXICON,
  SearchTypesEnum.DIFFICULTY_RANGE,
  SearchTypesEnum.PROBABILITY_LIMIT,
  SearchTypesEnum.MATCHING_ANAGRAM,
]);

const initialCriteria = [
  new SearchCriterion(SearchTypesEnum.LENGTH, {
    minValue: 7,
    maxValue: 7,
  }),
  new SearchCriterion(SearchTypesEnum.PROBABILITY, {
    minValue: 1,
    maxValue: 200,
  }),
];

const AddWordvaultURL = "/cards/api/add_to_wordvault";

const WordSearchForm: React.FC = () => {
  const { lexicon } = useContext(AppContext);
  const [alert, setAlert] = useState({
    shown: false,
    color: "green",
    text: "",
  });

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const addToWordVault = useCallback(async () => {
    try {
      setAlert((prev) => ({ ...prev, shown: false }));
      const searchParams = {
        searchCriteria: searchCriteria.map((s) => s.toJSObj()),
        lexicon,
      };

      // XXX: consider just searching from word_db_server directly.
      // This goes out to the aerolith API but shouldn't need to.
      const response = await fetch(AddWordvaultURL, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken") ?? "",
        }),
        credentials: "include",
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data);
      }
      setAlert({
        color: "green",
        shown: true,
        text: data.msg,
      });
    } catch (e) {
      setAlert({
        color: "red",
        shown: true,
        text: String(e),
      });
    }
  }, [lexicon, searchCriteria, setAlert]);

  return (
    <Stack>
      <SearchRows
        criteria={searchCriteria}
        addSearchRow={addSearchRow}
        removeSearchRow={removeSearchRow}
        modifySearchType={searchTypeChange}
        modifySearchParam={searchParamChange}
        allowedSearchTypes={allowedSearchTypes}
      />

      <Button
        variant="light"
        color="blue"
        style={{ maxWidth: 200 }}
        onClick={addToWordVault}
      >
        Add to WordVault
      </Button>
      {alert.shown && (
        <Alert variant="light" color={alert.color}>
          {alert.text}
        </Alert>
      )}
    </Stack>
  );
};

export default WordSearchForm;
