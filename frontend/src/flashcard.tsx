// Flashcard.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Text, Group, Center, Stack } from "@mantine/core";
import { Card as WordVaultCard } from "./gen/rpc/wordvault/api_pb";

interface FlashcardProps {
  cards: WordVaultCard[];
}

const Flashcard: React.FC<FlashcardProps> = ({ cards }) => {
  const [flipped, setFlipped] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  const handlePrev = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlipped(false);
    }
  }, [currentCardIndex]);

  const handleResponse = useCallback(
    (response: string) => {
      submitResponse(cards[currentCardIndex], response);
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setFlipped(false);
      }
    },
    [cards, currentCardIndex]
  );

  const card = cards[currentCardIndex];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!flipped) {
        if (event.key.toLowerCase() === "f") {
          handleFlip();
        } else if (event.key.toLowerCase() === "p") {
          handlePrev();
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
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [flipped, currentCardIndex, handlePrev, handleResponse]);

  return (
    <Center style={{ width: "100%", height: "100%" }}>
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
                Flip
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (F)
                </Text>
              </Button>
              <Button
                onClick={handlePrev}
                disabled={currentCardIndex === 0}
                size="lg"
              >
                Previous
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (P)
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
    </Center>
  );
};

// Stub function to handle user responses
function submitResponse(card: WordVaultCard, response: string): void {
  console.log(`User marked card ${card.alphagram} as ${response}`);
}

export default Flashcard;
