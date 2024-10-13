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
  Popover,
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
import { useMediaQuery } from "@mantine/hooks";

interface FlashcardProps {
  cards: WordVaultCard[];
  setFinishedCards: () => void;
}

interface HistoryEntry {
  cardIndex: number;
  score: Score;
  nextScheduled: Timestamp;
  cardRepr: { [key: string]: string };
}

const Flashcard: React.FC<FlashcardProps> = ({ cards, setFinishedCards }) => {
  const [flipped, setFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [previousCard, setPreviousCard] = useState<HistoryEntry | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const theme = useMantineTheme();
  const wordvaultClient = useClient(WordVaultService);
  const [showLoadMoreLink, setShowLoadMoreLink] = useState(false);
  const { lexicon, jwt } = useContext(AppContext);
  const smallScreen = useMediaQuery("(max-width: 40em)");
  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  useEffect(() => {
    if (currentCardIndex !== cards.length) {
      setShowLoadMoreLink(false);
    }
  }, [currentCardIndex, cards.length]);

  const handleScore = useCallback(
    async (score: Score) => {
      const card = cards[currentCardIndex];
      if (!card) {
        return;
      }
      setShowLoader(true);
      let scoreResponse: ScoreCardResponse;
      try {
        scoreResponse = await wordvaultClient.scoreCard({
          score: score,
          lexicon: lexicon,
          alphagram: card.alphagram?.alphagram,
        });
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

      setPreviousCard({
        cardIndex: currentCardIndex,
        score,
        nextScheduled: scoreResponse.nextScheduled!,
        cardRepr: JSON.parse(
          new TextDecoder().decode(scoreResponse.cardJsonRepr)
        ),
      });
      setCurrentCardIndex((prevIndex) => prevIndex + 1);

      if (currentCardIndex < cards.length - 1) {
        setFlipped(false);
      } else {
        // End of deck
        setShowLoadMoreLink(true);
      }
    },
    [cards, currentCardIndex, lexicon, jwt, wordvaultClient]
  );

  const handleRescore = useCallback(
    async (score: Score) => {
      const card = cards[currentCardIndex - 1];
      setShowLoader(true);
      let scoreResponse: ScoreCardResponse;
      try {
        scoreResponse = await wordvaultClient.editLastScore({
          newScore: score,
          lexicon: lexicon,
          alphagram: card.alphagram?.alphagram,
          lastCardRepr: card.cardJsonRepr,
        });
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
      setPreviousCard({
        cardIndex: currentCardIndex - 1,
        score: score,
        nextScheduled: scoreResponse.nextScheduled!,
        cardRepr: JSON.parse(
          new TextDecoder().decode(scoreResponse.cardJsonRepr)
        ),
      });
    },
    [cards, currentCardIndex, lexicon, jwt, wordvaultClient]
  );

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
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [flipped, handleScore]);

  return (
    <Center style={{ width: "100%", height: "100%", flexDirection: "column" }}>
      {card && (
        <>
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
                    {!smallScreen && (
                      <Text component="span" size="sm">
                        &nbsp; (F)
                      </Text>
                    )}
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
                    variant="light"
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
                    variant="light"
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
                    variant="light"
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

          <Center style={{ marginTop: "20px" }}>
            <Text size="md">
              Card {currentCardIndex + 1} of {cards.length}
            </Text>
          </Center>
        </>
      )}
      {/* Previous card summary */}
      {previousCard && currentCardIndex > 0 && (
        <PreviousCard
          entry={previousCard}
          alphagram={cards[currentCardIndex - 1].alphagram!.alphagram}
          handleRescore={handleRescore}
        />
      )}
      {showLoadMoreLink && (
        <Button onClick={setFinishedCards}>Load more cards</Button>
      )}
    </Center>
  );
};

interface PreviousCardProps {
  entry: HistoryEntry;
  alphagram: string;
  handleRescore: (score: Score) => void;
}

const PreviousCard: React.FC<PreviousCardProps> = ({
  entry,
  alphagram,
  handleRescore,
}) => {
  const [editPopoverOpened, setEditPopoverOpened] = useState(false);

  return (
    <Alert
      title="Previous Card"
      color="dark"
      style={{ maxWidth: 600, width: "100%", marginTop: "20px" }}
    >
      <Group style={{ justifyContent: "space-between", width: "100%" }}>
        <Stack gap={0}>
          <Text size="md" fw={500}>
            {alphagram}
          </Text>
          <Text size="sm" c="dimmed">
            Score:{" "}
            <Text
              size="sm"
              span
              c={entry.score === Score.AGAIN ? "red" : "green"}
            >
              {Score[entry.score] === "AGAIN" ? "MISSED" : Score[entry.score]}
            </Text>
          </Text>
          <Text size="sm" c="dimmed">
            Next Due Date: {entry.nextScheduled.toDate().toLocaleDateString()}
          </Text>
          <Text size="sm" c="dimmed">
            Times Seen: {entry.cardRepr["Reps"]}
          </Text>
          <Text>Times Forgotten: {entry.cardRepr["Lapses"]}</Text>
        </Stack>
        <Popover
          trapFocus
          position="top"
          shadow="md"
          opened={editPopoverOpened}
          onChange={setEditPopoverOpened}
        >
          <Popover.Target>
            <Button size="xs" onClick={() => setEditPopoverOpened(true)}>
              Undo
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Text>Set new rating for this card ({alphagram})</Text>
            <Group mt="sm">
              <Button
                color="red"
                variant="light"
                onClick={() => {
                  handleRescore(Score.AGAIN);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Missed
              </Button>
              <Button
                color="yellow"
                variant="light"
                onClick={() => {
                  handleRescore(Score.HARD);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Hard
              </Button>
              <Button
                color="green"
                variant="light"
                onClick={() => {
                  handleRescore(Score.GOOD);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Good
              </Button>
              <Button
                color="gray"
                variant="light"
                onClick={() => {
                  handleRescore(Score.EASY);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Easy
              </Button>
            </Group>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Alert>
  );
};

export default Flashcard;
