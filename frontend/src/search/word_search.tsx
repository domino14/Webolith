import { useCallback, useContext, useState } from "react";
import { SearchTypesEnum, SearchCriterion } from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import Cookies from "js-cookie";
import SearchRows from "./rows";
import {
  Alert,
  Button,
  Code,
  Collapse,
  FileInput,
  List,
  Loader,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useClient } from "../use_client";
import { QuestionSearcher } from "../gen/rpc/wordsearcher/searcher_connect";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";
import { WordVaultService } from "../gen/rpc/wordvault/api_connect";
import { useDisclosure } from "@mantine/hooks";

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

type AlertValues = {
  shown: boolean;
  color?: string;
  text?: string;
};

const AddWordvaultURL = "/cards/api/add_to_wordvault";

const WordSearchForm: React.FC = () => {
  const { lexicon, jwt } = useContext(AppContext);
  const [alert, setAlert] = useState<AlertValues>({
    shown: false,
    color: "green",
    text: "",
  });
  const [showLoader, setShowLoader] = useState(false);
  const [openedInstr, { toggle: toggleInstr }] = useDisclosure(false);

  const uploadWordListForm = useForm({
    initialValues: {
      textfile: new Blob(),
    },
  });

  const uploadCardboxForm = useForm({
    initialValues: {
      cardbox: new Blob(),
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

  const processUploadedCardbox = useCallback(
    async (uploadedCardbox: ArrayBuffer) => {
      try {
        setShowLoader(true);
        setAlert((prev) => ({ ...prev, shown: false }));

        // Step 1: Convert ArrayBuffer to Blob
        const blob = new Blob([uploadedCardbox], {
          type: "application/octet-stream",
        });

        // Step 2: Create a FormData object and append the file
        const formData = new FormData();
        formData.append("file", blob, "cardbox.sqlite");
        formData.append("lexicon", lexicon);

        // Step 4: Use fetch to send a POST request
        const response = await fetch("/word_db_server/import-cardbox/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
            // Note: Do not set the 'Content-Type' header when sending FormData with fetch
            // The browser will automatically set it, including the correct boundary
          },
          body: formData,
        });

        if (!response.ok) {
          // Handle HTTP errors
          const errorText = await response.text();
          throw new Error(
            `HTTP error! Status: ${response.status}, Message: ${errorText}`
          );
        }

        // Process the successful response
        const result = await response.text();
        setAlert({
          color: "green",
          shown: true,
          text: result,
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
    [jwt, lexicon]
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
      <Tabs variant="default" defaultValue="search">
        <Tabs.List>
          <Tabs.Tab value="search">Search</Tabs.Tab>
          <Tabs.Tab value="upload-list">Upload text file</Tabs.Tab>
          <Tabs.Tab value="upload-cardbox" disabled>
            Upload Zyzzyva Cardbox (Coming soon){" "}
            {/* <Badge color="green" ml="md">
              New
            </Badge> */}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="search">
          <Stack mt="lg">
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
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="upload-list">
          <Stack mt="lg">
            <form
              encType="multipart/form-data"
              onSubmit={uploadWordListForm.onSubmit((values) => {
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
                {...uploadWordListForm.getInputProps("textfile")}
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
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="upload-cardbox">
          <Text mt="lg">
            You can also upload a Zyzzyva cardbox. Please read some more details
            about how this works.
          </Text>
          <Button mt="lg" onClick={toggleInstr} variant="subtle">
            About importing Zyzzyva cardboxes
          </Button>

          <Collapse in={openedInstr}>
            <Text mt="lg">
              <a
                href="https://www.scrabbleplayers.org/w/NASPA_Zyzzyva:_The_Last_Word_in_Word_Study"
                target="_blank"
              >
                Zyzzyva
              </a>{" "}
              uses an older algorithm for spaced repetition called the Leitner
              cardbox system. It is not directly compatible with WordVault's
              algorithm (FSRS) and is significantly less efficient.
            </Text>
            <Text mt="lg">
              However, we can apply some approximations. The main parameters
              that FSRS needs in order to calculate intervals are S (Stability)
              and D (Difficulty).
            </Text>
            <Text mt="lg">
              <strong>Stability</strong> is defined as the number of days that
              pass between recall for a particular card going from 100% to 90%.
              Leitner doesn't use this parameter, but we are making the
              assumption that the very last interval (i.e. the time difference
              between the last time the question was answered correctly, and the
              time that the question is due) is a good proxy for stability.
            </Text>
            <Text mt="lg">
              <strong>Difficulty</strong> is also a slightly arbitrary
              parameter; it is a number that is clamped between 0 and 10. We
              will use the following formula to calculate difficulty:
            </Text>
            <Code mt="lg">
              Difficulty = ((5 + numTimesMissed) - (0.5 x
              numTimesCorrect)).clamp(0, 10)
            </Code>
            <Text mt="lg">
              After importing your cardbox, the schedules will change gradually
              and become more optimized as the FSRS algorithm begins to be used.
              The S and D parameters will be recalculated as you continue to
              quiz, as well.
            </Text>
            <Text mt="lg">
              Importing a cardbox will overwrite any of your existing cards that
              are also in the cardbox. Make sure you want to do this!
            </Text>
            <Text mt="lg">A couple more important notes:</Text>
            <List spacing="md" mt="lg" type="ordered">
              <List.Item>
                <Text>
                  All of your cards in your cardbox will be imported, even those
                  you haven't quizzed in a long time. WordVault will begin
                  quizzing you on these if they are overdue. Please delete any
                  cards you don't actually need, prior to import.
                </Text>
              </List.Item>
              <List.Item>
                <Text>Placeholdr.</Text>
              </List.Item>
            </List>
          </Collapse>

          <Stack mt="lg">
            <form
              encType="multipart/form-data"
              onSubmit={uploadCardboxForm.onSubmit((values) => {
                console.log(values.cardbox);
                const reader = new FileReader();
                reader.readAsArrayBuffer(values.cardbox);

                reader.onload = function () {
                  processUploadedCardbox(reader.result as ArrayBuffer);
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
                {...uploadCardboxForm.getInputProps("cardbox")}
                label={`Upload your Anagrams.db file from Zyzzyva. This cardbox must consist of words that are valid in ${lexicon}.`}
                placeholder="Click to upload..."
                maw={300}
                m="sm"
              />
              <Button
                variant="light"
                color="blue"
                type="submit"
                maw={450}
                m="sm"
                disabled={showLoader}
              >
                Import Cardbox into WordVault
              </Button>
            </form>
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
        </Tabs.Panel>
      </Tabs>
      {alert.shown && (
        <Alert variant="light" color={alert.color} mt="lg">
          {alert.text}
        </Alert>
      )}
    </>
  );
};

export default WordSearchForm;
