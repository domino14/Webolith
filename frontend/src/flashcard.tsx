// Flashcard.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Text, Group, Center, Stack } from "@mantine/core";
import { Card as WordVaultCard } from "./gen/rpc/wordvault/api_pb";

interface FlashcardProps {
  cards: WordVaultCard[];
}

interface HistoryEntry {
  cardIndex: number;
  response: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ cards }) => {
  const [flipped, setFlipped] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  const handleResponse = useCallback(
    (response: string) => {
      const card = cards[currentCardIndex];
      submitResponse(card, response);
      setHistory((prevHistory) => [
        ...prevHistory,
        { cardIndex: currentCardIndex, response },
      ]);
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prevIndex) => prevIndex + 1);
        setFlipped(false);
      } else {
        // End of deck
        console.log("End of deck");
      }
    },
    [cards, currentCardIndex]
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
            handleResponse("missed");
            break;
          case "2":
            handleResponse("hard");
            break;
          case "3":
            handleResponse("good");
            break;
          case "4":
            handleResponse("easy");
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
  }, [flipped, handleResponse, handleUndo]);

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
        style={{ maxWidth: 600, width: "100%" }}
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
          <Stack align="center" gap="md">
            {card.alphagram?.words.map((word) => (
              <div key={word.word}>
                <Text size="lg" fw={500} ta="center">
                  {word.word}
                </Text>
                <Text size="lg" c="dimmed" ta="center">
                  {word.definition}
                </Text>
              </div>
            ))}
            <Group mt="md">
              <Button onClick={() => handleResponse("missed")} size="lg">
                Missed
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (1)
                </Text>
              </Button>
              <Button onClick={() => handleResponse("hard")} size="lg">
                Hard
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (2)
                </Text>
              </Button>
              <Button onClick={() => handleResponse("good")} size="lg">
                Good
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (3)
                </Text>
              </Button>
              <Button onClick={() => handleResponse("easy")} size="lg">
                Easy
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (4)
                </Text>
              </Button>
            </Group>
          </Stack>
        )}
      </Card>

      {/* Previous card summary */}
      {previousCardEntry && previousCard && (
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ maxWidth: 600, width: "100%", marginTop: "20px" }}
        >
          <Group style={{ justifyContent: "space-between", width: "100%" }}>
            <Text size="md" fw={500}>
              Previous Card:
            </Text>
            <Button onClick={handleUndo} size="xs">
              Undo
              <Text component="span" c="dimmed" size="sm">
                &nbsp; (U)
              </Text>
            </Button>
          </Group>
          <Stack align="center" gap="sm">
            <Text size="lg" fw={500} ta="center">
              {previousCard.alphagram?.alphagram.toUpperCase()}
            </Text>
            <Text size="sm" ta="center">
              Response: {previousCardEntry.response}
            </Text>
            <Text size="sm" ta="center">
              Next Due Date: [Stub]
            </Text>
            <Text size="sm" ta="center">
              Times Solved: [Stub], Times Missed: [Stub]
            </Text>
          </Stack>
        </Card>
      )}

      {/* Progress summary */}
      <Center style={{ marginTop: "20px" }}>
        <Text size="md">
          Card {currentCardIndex + 1} of {cards.length}
        </Text>
      </Center>
    </Center>
  );
};

// Stub function to handle user responses
function submitResponse(card: WordVaultCard, response: string): void {
  console.log(`User marked card ${card.alphagram} as ${response}`);
}

export default Flashcard;
