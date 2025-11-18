import { useCallback, useContext } from "react";
import { AppContext } from "../app_context";
import {
  Alert,
  Button,
  FileInput,
  Group,
  Loader,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";
import { useDeckSelector } from "./useDeckSelector";

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
  const { lexicon, wordVaultClient, wordServerClient } =
    useContext(AppContext);
  const { value: deck, selector: deckSelector } = useDeckSelector();

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
        const deckId = deck.all ? 0n : deck.id;
        const wvResp = await wordVaultClient.addCards({
          lexicon,
          deckId: deckId === 0n ? undefined : deckId,
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
    [wordServerClient, lexicon, wordVaultClient, onAlertChange, setShowLoader, deck]
  );

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
            {deckSelector}
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
