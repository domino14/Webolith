import { useCallback, useContext, useState } from "react";
import { SearchTypesEnum, SearchCriterion } from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import Cookies from "js-cookie";
import SearchRows from "./rows";
import {
  Alert,
  Button,
  Divider,
  FileInput,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useClient } from "../use_client";
import { QuestionSearcher } from "../gen/rpc/wordsearcher/searcher_connect";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";
import { WordVaultService } from "../gen/rpc/wordvault/api_connect";

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
  const [showLoader, setShowLoader] = useState(false);

  const uploadForm = useForm({
    initialValues: {
      textfile: new Blob(),
    },
  });

  const wordServerClient = useClient(QuestionSearcher);
  const wordVaultClient = useClient(WordVaultService);

  const processUploadedFile = useCallback(
    async (uploadedList: string[]) => {
      try {
        setShowLoader(true);
        const alphagramResp = await wordServerClient.search({
          searchparams: [
            {
              condition: SearchRequest_Condition.LEXICON,
              conditionparam: {
                value: {
                  value: lexicon,
                },
                case: "stringvalue",
              },
            },
            {
              condition:
                SearchRequest_Condition.UPLOADED_WORD_OR_ALPHAGRAM_LIST,
              conditionparam: {
                value: {
                  values: uploadedList,
                },
                case: "stringarray",
              },
            },
          ],
        });
        if (alphagramResp.alphagrams.length === 0) {
          throw new Error("Your uploaded list had no valid alphagrams.");
        }
        const wvResp = await wordVaultClient.addCards({
          lexicon,
          alphagrams: alphagramResp.alphagrams.map((a) => a.alphagram),
        });
        setAlert({
          color: "green",
          shown: true,
          text: `Uploaded ${wvResp.numCardsAdded} cards to your WordVault`,
        });
      } catch (e) {
        setAlert({
          color: "red",
          shown: true,
          text: String(e),
        });
      } finally {
        setShowLoader(false);
      }
    },
    [wordServerClient, lexicon, wordVaultClient]
  );

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const addToWordVault = useCallback(async () => {
    if (!lexicon) {
      return;
    }
    try {
      setShowLoader(true);
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
    } finally {
      setShowLoader(false);
    }
  }, [lexicon, searchCriteria, setAlert]);

  return (
    <>
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
        {showLoader ? <Loader color="blue" /> : null}
      </Stack>
      <Divider m="xl" />
      <Text>Or, you can upload your own text file</Text>
      <Stack>
        <form
          encType="multipart/form-data"
          onSubmit={uploadForm.onSubmit((values) => {
            console.log(values.textfile);
            const reader = new FileReader();
            reader.readAsText(values.textfile, "UTF-8");

            reader.onload = function () {
              // TypeScript safeguard: Ensure reader.result is a string
              if (typeof reader.result === "string") {
                const result = reader.result;
                const lines = result.split("\n").map((line) => line.trim());
                const nonEmptyLines = lines.filter((line) => line !== "");
                processUploadedFile(nonEmptyLines);
              } else {
                setAlert({
                  color: "red",
                  shown: true,
                  text: "File could not be read as text.",
                });
              }
            };

            reader.onerror = function () {
              setAlert({
                color: "red",
                shown: true,
                text: String(reader.error),
              });
            };
          })}
        >
          <FileInput
            {...uploadForm.getInputProps("textfile")}
            label={`Upload a text file with words or alphagrams, one per line. These must be valid in ${lexicon}.`}
            placeholder="Click to upload..."
            maw={300}
            m="sm"
          />
          <Button
            variant="light"
            color="blue"
            type="submit"
            style={{ maxWidth: 200 }}
            m="sm"
          >
            Upload into WordVault
          </Button>
        </form>
      </Stack>
    </>
  );
};

export default WordSearchForm;
