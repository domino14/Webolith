import {
  Card,
  Stack,
  Group,
  Button,
  Center,
  Loader,
  Text,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { Card as WordVaultCard, Score } from "./gen/rpc/wordvault/api_pb";
import React, { useContext } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { IconArrowsShuffle, IconArrowUp } from "@tabler/icons-react";
import { AppContext } from "./app_context";

interface FlashcardProps {
  flipped: boolean;
  currentCard: WordVaultCard;
  handleFlip: () => void;
  handleScore: (score: Score) => Promise<void>;
  showLoader: boolean;
  onShuffle: () => void;
  onCustomArrange: () => void;
  displayQuestion: string;
  origDisplayQuestion: string;
  isPaywalled: boolean;
  missedWords?: Set<string>;
}

const Flashcard: React.FC<FlashcardProps> = ({
  flipped,
  handleFlip,
  currentCard,
  handleScore,
  showLoader,
  onShuffle,
  onCustomArrange,
  displayQuestion,
  origDisplayQuestion,
  missedWords,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const smallScreen = useMediaQuery("(max-width: 40em)");
  const { displaySettings } = useContext(AppContext);
  const backgroundColor = isDark ? theme.colors.dark[8] : theme.colors.gray[0];

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      m="md"
      withBorder
      style={{
        maxWidth: 600,
        width: "100%",
        backgroundColor: backgroundColor,
      }}
    >
      {!flipped ? (
        // Front side
        <Stack align="center" gap="md">
          <Group>
            <Button
              variant="transparent"
              size="xs"
              c={isDark ? theme.colors.gray[8] : theme.colors.gray[5]}
              onClick={onShuffle}
            >
              <IconArrowsShuffle />
            </Button>
            <Text
              size="xl"
              fw={700}
              ta="center"
              style={{ fontFamily: displaySettings.fontStyle }}
            >
              {displayQuestion}
            </Text>
            <Button
              variant="transparent"
              size="xs"
              c={isDark ? theme.colors.gray[8] : theme.colors.gray[5]}
              onClick={onCustomArrange}
            >
              <IconArrowUp />
            </Button>{" "}
          </Group>
          {currentCard.alphagram?.words.length &&
            displaySettings.showNumAnagrams && (
              <Text size="xl" c="dimmed" ta="center">
                Words: {currentCard.alphagram?.words.length}
              </Text>
            )}
          <Group mt="md">
            <Button onClick={handleFlip} size="lg">
              Show answer
              {!smallScreen && (
                <Text component="span" size="sm">
                  &nbsp; (0)
                </Text>
              )}
            </Button>
          </Group>
        </Stack>
      ) : (
        // Back side
        <Stack align="center" gap="sm">
          <Text
            size="xl"
            fw={700}
            ta="center"
            mb="md"
            style={{ fontFamily: displaySettings.fontStyle }}
          >
            {origDisplayQuestion}
          </Text>
          {currentCard.alphagram?.words.map((word) => {
            const highlightAsMissed =
              missedWords !== undefined &&
              currentCard.alphagram?.words &&
              missedWords.size < currentCard.alphagram.words.length &&
              missedWords.has(word.word);

            return (
              <div key={word.word}>
                <Center>
                  <Text span c="dimmed" size="md" fw={500} mr="xs">
                    {word.frontHooks}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.innerFrontHook ? "·" : ""}
                  </Text>
                  <Text
                    span
                    size="md"
                    c={highlightAsMissed ? "red" : undefined}
                    fw={highlightAsMissed ? 700 : 500}
                    td={highlightAsMissed ? "underline" : undefined}
                  >
                    {word.word}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.innerBackHook ? "·" : ""}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500} ml="xs">
                    {word.lexiconSymbols}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.backHooks}
                  </Text>
                </Center>
                <Text size="md" c="dimmed">
                  {word.definition}
                </Text>
              </div>
            );
          })}
          <Group mt="sm" justify="space-evenly">
            <Button
              color="red"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.AGAIN)}
              size={smallScreen ? "xs" : "lg"}
            >
              Missed
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (1)
                </Text>
              )}
            </Button>
            <Button
              color="yellow"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.HARD)}
              size={smallScreen ? "xs" : "lg"}
            >
              Hard
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (2)
                </Text>
              )}
            </Button>
            <Button
              color="green"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.GOOD)}
              size={smallScreen ? "xs" : "lg"}
            >
              Good
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (3)
                </Text>
              )}
            </Button>
            <Button
              color="gray"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.EASY)}
              size={smallScreen ? "xs" : "lg"}
            >
              Easy
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (4)
                </Text>
              )}
            </Button>
          </Group>
          {showLoader ? <Loader color="blue" /> : null}
        </Stack>
      )}
    </Card>
  );
};

export default Flashcard;
