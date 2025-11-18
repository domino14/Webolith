import { useCallback, useContext } from "react";
import { AppContext } from "../app_context";
import {
  Alert,
  Button,
  Code,
  Collapse,
  FileInput,
  Group,
  List,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useDeckSelector } from "./useDeckSelector";

type AlertValues = {
  shown: boolean;
  color?: string;
  text?: string;
};

type UploadCardboxTabProps = {
  onAlertChange: (alert: AlertValues) => void;
  alert: AlertValues;
  showLoader: boolean;
  setShowLoader: (loading: boolean) => void;
};

const UploadCardboxTab: React.FC<UploadCardboxTabProps> = ({
  onAlertChange,
  alert,
  showLoader,
  setShowLoader,
}) => {
  const { lexicon, jwt } = useContext(AppContext);
  const { selector: deckSelector } = useDeckSelector();
  const [openedInstr, { toggle: toggleInstr }] = useDisclosure(false);

  const uploadCardboxForm = useForm({
    initialValues: {
      cardbox: new Blob(),
    },
  });

  const processUploadedCardbox = useCallback(
    async (uploadedCardbox: ArrayBuffer) => {
      try {
        setShowLoader(true);
        onAlertChange({ shown: false });

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
        onAlertChange({
          color: "green",
          shown: true,
          text: result,
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
    [jwt, lexicon, onAlertChange, setShowLoader]
  );

  return (
    <>
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
          However, we can apply some approximations. The main parameters that
          FSRS needs in order to calculate intervals are S (Stability) and D
          (Difficulty).
        </Text>
        <Text mt="lg">
          <strong>Stability</strong> is defined as the number of days that pass
          between recall for a particular card going from 100% to 90%. Leitner
          doesn't use this parameter, but we are making the assumption that the
          very last interval (i.e. the time difference between the last time
          the question was answered correctly, and the time that the question
          is due) is a good proxy for stability.
        </Text>
        <Text mt="lg">
          <strong>Difficulty</strong> is also a slightly arbitrary parameter;
          it is a number that is clamped between 0 and 10. We will use the
          following formula to calculate difficulty:
        </Text>
        <Code mt="lg">
          Difficulty = ((5 + numTimesMissed) - (0.5 x
          numTimesCorrect)).clamp(0, 10)
        </Code>
        <Text mt="lg">
          After importing your cardbox, the schedules will change gradually and
          become more optimized as the FSRS algorithm begins to be used. The S
          and D parameters will be recalculated as you continue to quiz, as
          well.
        </Text>
        <Text mt="lg">
          If you have any cards already in your WordVault, they will NOT be
          overwritten by your Zyzzyva Cardbox cards. Make sure this is what you
          want!
        </Text>
        <Text mt="lg">A couple more important notes:</Text>
        <List spacing="md" mt="lg" type="ordered">
          <List.Item>
            <Text>
              All of your cards in your cardbox will be imported, even those
              you haven't quizzed in a long time. WordVault will begin quizzing
              you on these if they are overdue. Please delete any cards you
              don't actually need, prior to import.
            </Text>
          </List.Item>
          <List.Item>
            <Text>
              You can't quiz on subsets of cards at this time; only your entire
              WordVault as its cards become due.
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
              onAlertChange({
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
            {deckSelector}
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
    </>
  );
};

export default UploadCardboxTab;
