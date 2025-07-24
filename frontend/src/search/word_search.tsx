import { useCallback, useContext, useState } from "react";
import {
  SearchTypesEnum,
  SearchCriterion,
  lexiconSearchCriterion,
} from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import SearchRows from "./rows";
import {
  Alert,
  Badge,
  Button,
  Center,
  Code,
  Collapse,
  Divider,
  FileInput,
  Group,
  List,
  Loader,
  Modal,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

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
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
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

const WordSearchForm: React.FC = () => {
  const { lexicon, jwt, wordVaultClient, wordServerClient, decksById } =
    useContext(AppContext);
  const [alert, setAlert] = useState<AlertValues>({
    shown: false,
    color: "green",
    text: "",
  });
  const [showLoader, setShowLoader] = useState(false);
  const [deckId, setDeckId] = useState<bigint | null>(null);
  const [openedInstr, { toggle: toggleInstr }] = useDisclosure(false);
  const [deleteAllTextInput, setDeleteAllTextInput] = useState("");
  const [
    openedSearchDelete,
    { close: closeSearchDelete, open: openSearchDelete },
  ] = useDisclosure(false);

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

  const processUploadedFile = useCallback(
    async (uploadedList: string[]) => {
      if (!wordVaultClient || !wordServerClient) {
        setAlert({
          color: "red",
          shown: true,
          text: "Word database connection not available, try refreshing",
        });
        return;
      }

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
    [wordServerClient, lexicon, wordVaultClient],
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
            `HTTP error! Status: ${response.status}, Message: ${errorText}`,
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
    [jwt, lexicon],
  );

  const sendDelete = useCallback(
    async (onlyNew: boolean, allCards?: boolean, alphagramList?: string[]) => {
      if (!wordVaultClient) {
        return;
      }
      try {
        setShowLoader(true);
        const resp = await wordVaultClient.delete({
          lexicon,
          onlyNewQuestions: onlyNew,
          allQuestions: allCards,
          onlyAlphagrams: alphagramList,
        });
        notifications.show({
          color: "green",
          message: `Deleted ${resp.numDeleted} cards.`,
        });
      } catch (e) {
        notifications.show({
          color: "red",
          title: "Error",
          message: String(e),
        });
      } finally {
        setShowLoader(false);
      }
    },
    [lexicon, wordVaultClient],
  );

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const addToWordVault = useCallback(async () => {
    if (!lexicon || !wordServerClient || !wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);
      setAlert((prev) => ({ ...prev, shown: false }));

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);
      console.log("Adding cards!!", { deckId });
      const addResp = await wordVaultClient.addCards({
        lexicon,
        deckId: deckId ?? undefined,
        alphagrams: searchResponse.alphagrams.map((a) => a.alphagram),
      });

      setAlert({
        color: "green",
        shown: true,
        text: `Added ${addResp.numCardsAdded} cards to WordVault.`,
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
  }, [
    lexicon,
    searchCriteria,
    wordServerClient,
    wordVaultClient,
    setAlert,
    deckId,
  ]);

  const deleteFromWordVault = useCallback(async () => {
    if (!lexicon || !wordServerClient) {
      return;
    }
    try {
      setShowLoader(true);
      setAlert((prev) => ({ ...prev, shown: false }));

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);

      if (searchResponse.alphagrams.length === 0) {
        throw new Error("No cards to delete.");
      }
      await sendDelete(
        false,
        false,
        searchResponse.alphagrams.map((a) => a.alphagram),
      );
    } catch (e) {
      setAlert({
        color: "red",
        shown: true,
        text: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [lexicon, sendDelete, searchCriteria, wordServerClient, setAlert]);

  const deckIdSelect =
    decksById.size >= 1 ? (
      <Select
        value={deckId?.toString() ?? ""}
        onChange={(value) =>
          setDeckId(
            value == "" || value == null ? null : BigInt(parseInt(value)),
          )
        }
        data={[
          { value: "", label: "Default Deck" },
          ...[...decksById.values()].map((deck) => ({
            value: deck.id.toString(),
            label: deck.name,
          })),
        ]}
        style={{ minWidth: 200 }}
        placeholder="Select deck"
        size="lg"
      />
    ) : null;

  return (
    <>
      <Modal
        opened={openedSearchDelete}
        withCloseButton
        onClose={closeSearchDelete}
        title="Delete some cards?"
      >
        <Text size="lg" m="lg">
          Are you sure? This will delete the cards matching your search criteria
          from WordVault. This can't be undone!
        </Text>
        <Group gap="lg" m="lg">
          <Button
            onClick={() => {
              deleteFromWordVault();
              closeSearchDelete();
            }}
            color="pink"
          >
            Yes, delete matching cards
          </Button>
          <Button onClick={closeSearchDelete}>Nevermind</Button>
        </Group>
      </Modal>

      <Tabs
        variant="default"
        defaultValue="search"
        onChange={() => setAlert((prev) => ({ ...prev, shown: false }))}
      >
        <Tabs.List>
          <Tabs.Tab value="search">Search</Tabs.Tab>
          <Tabs.Tab value="upload-list">Upload text file</Tabs.Tab>
          <Tabs.Tab value="upload-cardbox">
            Upload Zyzzyva Cardbox
            <Badge color="green" ml="md">
              New
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="delete-cards" c="red">
            Bulk card deletion
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
            <Group mb="lg">
              {deckIdSelect}
              <Button
                variant="light"
                color="blue"
                style={{ maxWidth: 250 }}
                onClick={addToWordVault}
                size="lg"
              >
                Add to WordVault
              </Button>
            </Group>
            {alert.shown && (
              <Alert variant="light" color={alert.color} mt="lg">
                {alert.text}
              </Alert>
            )}

            <Text size="lg" mb="lg">
              OR
            </Text>

            <Button
              variant="light"
              color="red"
              style={{ maxWidth: 250 }}
              onClick={openSearchDelete}
            >
              Delete from WordVault
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
                label="Select a file"
                description={`File must be plain text, with one word or alphagram per line. These must be valid in ${lexicon}.`}
                placeholder="Click to upload..."
                size="lg"
                maw={500}
                m="md"
              />
              <Group m="md">
                {deckIdSelect}
                <Button
                  variant="light"
                  color="blue"
                  type="submit"
                  style={{ maxWidth: 250 }}
                  size="lg"
                >
                  Upload into WordVault
                </Button>
              </Group>
            </form>
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
          {alert.shown && (
            <Alert variant="light" color={alert.color} mt="lg">
              {alert.text}
            </Alert>
          )}
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
              If you have any cards already in your WordVault, they will NOT be
              overwritten by your Zyzzyva Cardbox cards. Make sure this is what
              you want!
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
                <Text>
                  You can't quiz on subsets of cards at this time; only your
                  entire WordVault as its cards become due.
                </Text>
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
                label="Select a file"
                description={`Upload your Anagrams.db file from Zyzzyva. This cardbox must consist of words that are valid in ${lexicon}.`}
                placeholder="Click to upload..."
                maw={500}
                size="lg"
                m="md"
              />
              <Group m="md">
                {deckIdSelect}
                <Button
                  variant="light"
                  color="blue"
                  type="submit"
                  disabled={showLoader}
                  size="lg"
                >
                  Import Cardbox into WordVault
                </Button>
              </Group>
            </form>
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
          {alert.shown && (
            <Alert variant="light" color={alert.color} mt="lg">
              {alert.text}
            </Alert>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="delete-cards">
          <Text m="xl">
            If you wish to delete a specific set of cards, click on Search above
            and then the "Delete from WordVault" button.
          </Text>
          <Text m="xl">
            If you've accidentally added too many cards, you can delete the new
            ones here. That is, the ones that you have not yet quizzed on.
          </Text>
          <Text m="xl" fw={700} c="red">
            This is not undoable. Make sure you want to delete these new cards!
            You can always re-add them later.
          </Text>

          <Button color="pink" m="xl" onClick={() => sendDelete(true)}>
            Delete new cards
          </Button>

          <Divider m="xl" />

          <Center>
            <Text fw={700} m="xl" c="red" size="xl">
              DANGER ZONE
            </Text>
          </Center>
          <Text m="xl">
            Maybe you wish to start over new? You can delete ALL your cards.
          </Text>
          <Text m="xl" fw={700} c="red">
            This is not undoable. You will lose all your history! Make sure you
            actually want to delete all your cards!
          </Text>
          <Stack m="xl">
            <TextInput
              label="Type in DELETE ALL CARDS"
              value={deleteAllTextInput}
              onChange={(e) => setDeleteAllTextInput(e.target.value)}
            />
            <Button
              color="red"
              onClick={() => sendDelete(false, true)}
              disabled={deleteAllTextInput !== "DELETE ALL CARDS"}
            >
              Delete ALL cards
            </Button>
            <Text c="dimmed" size="xs">
              This is one doodle that can't be undid, home skillet.
            </Text>
            {showLoader ? <Loader color="blue" type="bars" /> : null}
          </Stack>
          {alert.shown && (
            <Alert variant="light" color={alert.color} mt="lg">
              {alert.text}
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  );
};

export default WordSearchForm;
