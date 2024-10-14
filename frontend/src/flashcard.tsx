// Flashcard.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Card,
  Button,
  Text,
  Group,
  Center,
  Stack,
  useMantineTheme,
  Loader,
  useMantineColorScheme,
} from "@mantine/core";
import {
  Score,
  ScoreCardResponse,
  Card as WordVaultCard,
} from "./gen/rpc/wordvault/api_pb";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import PreviousCard, { HistoryEntry } from "./previous_card";

interface FlashcardProps {
  setFinishedCards: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ setFinishedCards }) => {
  const [flipped, setFlipped] = useState(false);
  const [previousCard, setPreviousCard] = useState<HistoryEntry | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const theme = useMantineTheme();
  const wordvaultClient = useClient(WordVaultService);
  const [showLoadMoreLink, setShowLoadMoreLink] = useState(false);
  const { lexicon } = useContext(AppContext);
  const smallScreen = useMediaQuery("(max-width: 40em)");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [currentCard, setCurrentCard] = useState<WordVaultCard | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  const loadNewCard = useCallback(async () => {
    if (!lexicon || !wordvaultClient) {
      return;
    }
    // Load new card.
    setShowLoader(true);
    let nextCard;
    try {
      nextCard = await wordvaultClient.getSingleNextScheduled({
        lexicon: lexicon,
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
    if (nextCard.card) {
      setCurrentCard(nextCard.card);
      setFlipped(false);
    } else {
      setCurrentCard(null);
      setShowLoadMoreLink(true);
    }
    setOverdueCount(nextCard.overdueCount);
  }, [lexicon, wordvaultClient]);

  // Load a card upon first render.
  useEffect(() => {
    loadNewCard();
  }, [loadNewCard]);

  const handleScore = useCallback(
    async (score: Score) => {
      if (!currentCard) {
        return;
      }
      setShowLoader(true);
      let scoreResponse: ScoreCardResponse;
      try {
        scoreResponse = await wordvaultClient.scoreCard({
          score: score,
          lexicon: lexicon,
          alphagram: currentCard.alphagram?.alphagram,
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
        score,
        alphagram: currentCard.alphagram?.alphagram ?? "",
        nextScheduled: scoreResponse.nextScheduled!,
        cardRepr: JSON.parse(
          new TextDecoder().decode(scoreResponse.cardJsonRepr)
        ),
        previousCardRepr: JSON.parse(
          new TextDecoder().decode(currentCard.cardJsonRepr)
        ),
      });

      loadNewCard();
    },
    [currentCard, lexicon, loadNewCard, wordvaultClient]
  );

  const handleRescore = useCallback(
    async (score: Score) => {
      if (!previousCard) {
        return;
      }
      setShowLoader(true);
      let scoreResponse: ScoreCardResponse;
      try {
        scoreResponse = await wordvaultClient.editLastScore({
          newScore: score,
          lexicon: lexicon,
          alphagram: previousCard.alphagram,
          lastCardRepr: new TextEncoder().encode(
            JSON.stringify(previousCard.previousCardRepr)
          ),
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
        ...previousCard,
        score: score,
        nextScheduled: scoreResponse.nextScheduled!,
        cardRepr: JSON.parse(
          new TextDecoder().decode(scoreResponse.cardJsonRepr)
        ),
      });
    },
    [lexicon, wordvaultClient, previousCard]
  );

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
      {currentCard && (
        <>
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              maxWidth: 600,
              width: "100%",
              backgroundColor: isDark
                ? theme.colors.dark[8]
                : theme.colors.gray[0],
            }}
          >
            {!flipped ? (
              // Front side
              <Stack align="center" gap="md">
                <Text size="xl" fw={700} ta="center">
                  {currentCard.alphagram?.alphagram.toUpperCase()}
                </Text>
                {currentCard.alphagram?.words.length && (
                  <Text size="xl" c="dimmed" ta="center">
                    Words: {currentCard.alphagram?.words.length}
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
                {currentCard.alphagram?.words.map((word) => (
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

          <Center style={{ marginTop: "20px" }}>
            <Text size="md">Cards left: {overdueCount}</Text>
          </Center>
        </>
      )}
      {/* Previous card summary */}
      {previousCard && (
        <PreviousCard entry={previousCard} handleRescore={handleRescore} />
      )}
      {showLoadMoreLink && (
        <Button onClick={setFinishedCards}>Load more cards</Button>
      )}
    </Center>
  );
};

export default Flashcard;
