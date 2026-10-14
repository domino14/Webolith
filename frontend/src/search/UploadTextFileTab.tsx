import { useCallback, useContext } from "react";
import { AppContext } from "../app_context";
import {
  Button,
  FileInput,
  Group,
  Loader,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Code, ConnectError } from "@connectrpc/connect";
import { SearchRequest_Condition } from "../gen/rpc/wordsearcher/searcher_pb";
import { useDeckSelector } from "./useDeckSelector";
import { notifyCardActionError } from "./notify_error";

type UploadTextFileTabProps = {
  showLoader: boolean;
  setShowLoader: (loading: boolean) => void;
};

const UploadTextFileTab: React.FC<UploadTextFileTabProps> = ({
  showLoader,
  setShowLoader,
}) => {
  const { lexicon, wordVaultClient } = useContext(AppContext);
  const { value: deck, selector: deckSelector } = useDeckSelector();

  const uploadWordListForm = useForm({
    initialValues: {
      textfile: new Blob(),
    },
  });

  const processUploadedFile = useCallback(
    async (uploadedList: string[]) => {
      if (!wordVaultClient) {
        notifications.show({
          color: "red",
          title: "Error",
          message: "Word database connection not available, try refreshing",
        });
        return;
      }

      try {
        setShowLoader(true);
        const deckId = deck.all ? 0n : deck.id;
        const wvResp = await wordVaultClient.addCards({
          lexicon,
          deckId: deckId === 0n ? undefined : deckId,
          searchParams: [
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
        notifications.show({
          color: "green",
          message: `Uploaded ${wvResp.numCardsAdded} cards to your WordVault`,
        });
      } catch (e) {
        if (e instanceof ConnectError && e.code === Code.NotFound) {
          notifications.show({
            color: "yellow",
            message: "Your uploaded list had no valid alphagrams.",
          });
        } else {
          notifyCardActionError(e);
        }
      } finally {
        setShowLoader(false);
      }
    },
    [lexicon, wordVaultClient, setShowLoader, deck]
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
                notifications.show({
                  color: "red",
                  title: "Error",
                  message: "File could not be read as text.",
                });
              }
            };

            reader.onerror = function () {
              notifications.show({
                color: "red",
                title: "Error",
                message: String(reader.error),
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
    </>
  );
};

export default UploadTextFileTab;
