import { useCallback, useContext, useState } from "react";
import { AppContext } from "../app_context";
import {
  Alert,
  Button,
  FileInput,
  Group,
  Loader,
  Select,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";

// Deck selector constants
const DEFAULT_DECK_OPTION_VALUE = "DEFAULT";

type AlertValues = {
  shown: boolean;
  color?: string;
  text?: string;
};

type UploadTextFileTabProps = {
  onAlertChange: (alert: AlertValues) => void;
  alert: AlertValues;
  showLoader: boolean;
  setShowLoader: (loading: boolean) => void;
};

const UploadTextFileTab: React.FC<UploadTextFileTabProps> = ({
  onAlertChange,
  alert,
  showLoader,
  setShowLoader,
}) => {
  const { lexicon, wordVaultClient, wordServerClient, decksById } =
    useContext(AppContext);
  const [deckId, setDeckId] = useState<bigint | null>(null);

  const uploadWordListForm = useForm({
    initialValues: {
      textfile: new Blob(),
    },
  });

  const processUploadedFile = useCallback(
    async (uploadedList: string[]) => {
      if (!wordVaultClient || !wordServerClient) {
        onAlertChange({
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
          deckId: deckId ?? undefined,
          alphagrams: alphagramResp.alphagrams.map((a) => a.alphagram),
        });
        onAlertChange({
          color: "green",
          shown: true,
          text: `Uploaded ${wvResp.numCardsAdded} cards to your WordVault`,
        });
      } catch (e) {
        onAlertChange({
          color: "red",
          shown: true,
          text: String(e),
        });
      } finally {
        setShowLoader(false);
      }
    },
    [wordServerClient, lexicon, wordVaultClient, onAlertChange, setShowLoader, deckId]
  );

  const deckIdSelect =
    decksById.size >= 1 ? (
      <Select
        value={deckId === null ? DEFAULT_DECK_OPTION_VALUE : deckId.toString()}
        onChange={(value) =>
          setDeckId(
            value === DEFAULT_DECK_OPTION_VALUE || value == null
              ? null
              : BigInt(parseInt(value))
          )
        }
        data={[
          { value: DEFAULT_DECK_OPTION_VALUE, label: "Default Deck" },
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
                onAlertChange({
                  color: "red",
                  shown: true,
                  text: "File could not be read as text.",
                });
              }
            };

            reader.onerror = function () {
              onAlertChange({
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
    </>
  );
};

export default UploadTextFileTab;
