// Flashcard.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Card,
  Button,
  Text,
  Group,
  Center,
  Stack,
  Alert,
  useMantineTheme,
  Loader,
} from "@mantine/core";
import {
  Score,
  ScoreCardResponse,
  Card as WordVaultCard,
} from "./gen/rpc/wordvault/api_pb";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { AppContext } from "./app_context";
import { Timestamp } from "@bufbuild/protobuf";
import { notifications } from "@mantine/notifications";

interface FlashcardProps {
  cards: WordVaultCard[];
}

interface HistoryEntry {
  cardIndex: number;
  score: Score;
  nextScheduled: Timestamp;
}

const Flashcard: React.FC<FlashcardProps> = ({ cards }) => {
  const [flipped, setFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showLoader, setShowLoader] = useState(false);
  const theme = useMantineTheme();
  const wordvaultClient = useClient(WordVaultService);
  const { lexicon, jwt } = useContext(AppContext);

  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  const handleScore = useCallback(
    async (score: Score) => {
      const card = cards[currentCardIndex];
      setShowLoader(true);
      let scoreResponse: ScoreCardResponse;
      try {
        scoreResponse = await wordvaultClient.scoreCard(
          {
            score: score,
            lexicon: lexicon,
            alphagram: card.alphagram?.alphagram,
          },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
      } catch (e) {
        notifications.show({
          color: "red",
          title: "Error",
          message: String(e),
        });
        return;
      } finally {
        setShowLoader(false);
      }

      setHistory((prevHistory) => [
        ...prevHistory,
        {
          cardIndex: currentCardIndex,
          score,
          nextScheduled: scoreResponse.nextScheduled!,
        },
      ]);
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prevIndex) => prevIndex + 1);
        setFlipped(false);
      } else {
        // End of deck
        console.log("End of deck");
      }
    },
    [cards, currentCardIndex, lexicon, jwt, wordvaultClient]
  );

  const handleUndo = useCallback(() => {
    if (history.length > 0 && currentCardIndex > 0) {
      setHistory((prevHistory) => prevHistory.slice(0, -1));
      setCurrentCardIndex((prevIndex) => prevIndex - 1);
      setFlipped(false);
    }
  }, [history, currentCardIndex]);

  const card = cards[currentCardIndex];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!flipped) {
        if (event.key.toLowerCase() === "f") {
          handleFlip();
        }
      } else {
        switch (event.key) {
          case "1":
            handleScore(Score.AGAIN);
            break;
          case "2":
            handleScore(Score.HARD);
            break;
          case "3":
            handleScore(Score.GOOD);
            break;
          case "4":
            handleScore(Score.EASY);
            break;
          default:
            break;
        }
      }
      if (event.key.toLowerCase() === "u") {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [flipped, handleScore, handleUndo]);

  const previousCardEntry =
    history.length > 0 ? history[history.length - 1] : null;
  const previousCard = previousCardEntry
    ? cards[previousCardEntry.cardIndex]
    : null;

  return (
    <Center style={{ width: "100%", height: "100%", flexDirection: "column" }}>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          maxWidth: 600,
          width: "100%",
          backgroundColor: theme.colors.dark[8],
        }}
      >
        {!flipped ? (
          // Front side
          <Stack align="center" gap="md">
            <Text size="xl" fw={700} ta="center">
              {card.alphagram?.alphagram.toUpperCase()}
            </Text>
            {card.alphagram?.words.length && (
              <Text size="xl" c="dimmed" ta="center">
                Words: {card.alphagram?.words.length}
              </Text>
            )}
            <Group mt="md">
              <Button onClick={handleFlip} size="lg">
                Show answer
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (F)
                </Text>
              </Button>
            </Group>
          </Stack>
        ) : (
          // Back side
          <Stack align="center" gap="sm">
            {card.alphagram?.words.map((word) => (
              <div key={word.word}>
                <Center>
                  <Text span c="dimmed" size="md" fw={500} mr="xs">
                    {word.frontHooks}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.innerFrontHook ? "·" : ""}
                  </Text>
                  <Text span size="md" fw={500}>
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
            ))}
            <Group mt="sm">
              <Button
                color="red"
                variant="light"
                onClick={() => handleScore(Score.AGAIN)}
                size="lg"
              >
                Missed
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (1)
                </Text>
              </Button>
              <Button
                color="yellow"
                variant="light"
                onClick={() => handleScore(Score.HARD)}
                size="lg"
              >
                Hard
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (2)
                </Text>
              </Button>
              <Button
                color="green"
                variant="light"
                onClick={() => handleScore(Score.GOOD)}
                size="lg"
              >
                Good
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (3)
                </Text>
              </Button>
              <Button
                color="gray"
                variant="light"
                onClick={() => handleScore(Score.EASY)}
                size="lg"
              >
                Easy
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (4)
                </Text>
              </Button>
            </Group>
            {showLoader ? <Loader color="blue" /> : null}
          </Stack>
        )}
      </Card>
      {/* Progress summary */}
      <Center style={{ marginTop: "20px" }}>
        <Text size="md">
          Card {currentCardIndex + 1} of {cards.length}
        </Text>
      </Center>
      {/* Previous card summary */}
      {previousCardEntry && previousCard && (
        <Alert
          title="Previous Card"
          color="dark"
          style={{ maxWidth: 600, width: "100%", marginTop: "20px" }}
          closeButtonLabel="Undo (U)"
        >
          <Group style={{ justifyContent: "space-between", width: "100%" }}>
            <Stack gap={0}>
              <Text size="md" fw={500}>
                {previousCard.alphagram?.alphagram.toUpperCase()}
              </Text>
              <Text size="sm" c="dimmed">
                Score:{" "}
                <Text
                  size="sm"
                  span
                  c={previousCardEntry.score === Score.AGAIN ? "red" : "green"}
                >
                  {Score[previousCardEntry.score]}
                </Text>
              </Text>
              <Text size="sm" c="dimmed">
                Next Due Date:{" "}
                {previousCardEntry.nextScheduled.toDate().toLocaleDateString()}
              </Text>
              <Text size="sm" c="dimmed">
                Times Solved: [Stub], Times Missed: [Stub]
              </Text>
            </Stack>
            <Button onClick={handleUndo} size="xs">
              Undo
              <Text component="span" c="dimmed" size="sm">
                &nbsp; (U)
              </Text>
            </Button>
          </Group>
        </Alert>
      )}
    </Center>
  );
};

export default Flashcard;
