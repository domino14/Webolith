// Flashcard.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  Badge,
  Button,
  Center,
  Group,
  Kbd,
  Text,
  TextInput,
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
import PreviousCard, { HistoryEntry } from "./previous_card";
import Flashcard from "./flashcard";

interface FSRSCardsProps {
  setFinishedCards: () => void;
  isPaywalled: boolean;
}

const FSRSCards: React.FC<FSRSCardsProps> = ({
  setFinishedCards,
  isPaywalled,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [previousCard, setPreviousCard] = useState<HistoryEntry | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const wordvaultClient = useClient(WordVaultService);
  const [typingMode, setTypingMode] = useState(false);
  const [typeInputValue, setTypeInputValue] = useState("");
  const [showLoadMoreLink, setShowLoadMoreLink] = useState(false);
  const { lexicon, displaySettings } = useContext(AppContext);
  const [correctGuesses, setCorrectGuesses] = useState(new Set<string>());
  const [displayQuestion, setDisplayQuestion] = useState("");

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

  // Note: shuffle/customarrange/split/etc won't work for multi-rune
  // character sets like Spanish/Catalan. We probably need to make a
  // custom library for these like the alphabets FE code in liwords.

  const shuffle = (letters: string[]): string => {
    // Fisher-Yates shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join("");
  };

  const alphagramLetters = useMemo(() => {
    if (!currentCard || !currentCard.alphagram) {
      return [];
    }
    return currentCard.alphagram.alphagram.split("");
  }, [currentCard]);

  const customArrange = useCallback(
    (letters: string[], origAlphagram: string): string => {
      const customOrder = displaySettings.customOrder;

      if (!customOrder) {
        return origAlphagram;
      }

      // Create a priority map based on customOrder
      const orderMap: { [key: string]: number } = {};
      for (let i = 0; i < customOrder.length; i++) {
        orderMap[customOrder[i]] = i; // Assign a priority based on customOrder index
      }

      // Sort letters based on custom order, then alphabetically
      letters.sort((a, b) => {
        const priorityA =
          orderMap[a] !== undefined ? orderMap[a] : customOrder.length;
        const priorityB =
          orderMap[b] !== undefined ? orderMap[b] : customOrder.length;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.localeCompare(b); // Alphabetical order for letters outside customOrder
      });
      return letters.join("");
    },
    [displaySettings.customOrder]
  );

  useEffect(() => {
    if (!currentCard || !currentCard.alphagram) {
      return;
    }
    setCorrectGuesses(new Set<string>());
    setDisplayQuestion(
      customArrange(alphagramLetters, currentCard.alphagram.alphagram)
    );
  }, [currentCard, alphagramLetters, customArrange]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentCard || !currentCard.alphagram) {
        return;
      }
      if (event.key === "/") {
        event.preventDefault(); // Prevents the '/' from appearing in the input
        setTypingMode((t) => !t);
        return;
      }
      if (!flipped) {
        switch (event.key) {
          case "0":
            event.preventDefault();
            handleFlip();
            break;
          case "f":
          case "F":
            if (!typingMode) {
              event.preventDefault();
              handleFlip();
            }
            break;

          case "1":
            event.preventDefault();
            setDisplayQuestion(shuffle(alphagramLetters));
            break;
          case "2":
            event.preventDefault();
            setDisplayQuestion(
              customArrange(alphagramLetters, currentCard.alphagram.alphagram)
            );
            break;
        }
      } else {
        switch (event.key) {
          case "1":
            event.preventDefault();
            handleScore(Score.AGAIN);
            break;
          case "2":
            event.preventDefault();
            handleScore(Score.HARD);
            break;
          case "3":
            event.preventDefault();
            handleScore(Score.GOOD);
            break;
          case "4":
            event.preventDefault();
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
  }, [
    flipped,
    handleScore,
    typingMode,
    currentCard,
    alphagramLetters,
    customArrange,
  ]);

  const handleGuessEntered = useCallback(() => {
    if (!currentCard || !currentCard.alphagram || flipped) {
      return;
    }
    // Normalize input
    const guess = typeInputValue.trim().toUpperCase();
    let updatedCorrectGuesses;
    // Check if the guess is correct and not already in the set
    if (
      currentCard.alphagram.words.some((wordObj) => wordObj.word === guess) &&
      !correctGuesses.has(guess)
    ) {
      // Create a new Set and add the guess
      updatedCorrectGuesses = new Set(correctGuesses).add(guess);
      setCorrectGuesses(updatedCorrectGuesses);
    }
    // Clear the input
    setTypeInputValue("");
    if (updatedCorrectGuesses?.size === currentCard.alphagram.words.length) {
      // we solved the card; flip it.
      handleFlip();
    }
  }, [currentCard, correctGuesses, typeInputValue, flipped]);

  const sortedGuesses = useMemo(() => {
    return Array.from(correctGuesses).sort((a, b) => a.localeCompare(b));
  }, [correctGuesses]);

  return (
    <Center style={{ width: "100%", height: "100%", flexDirection: "column" }}>
      {typingMode && (
        <>
          <TextInput
            m="md"
            autoFocus
            placeholder="Guess..."
            onChange={(e) => setTypeInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") {
                  e.preventDefault();
                }
                handleGuessEntered();
              }
            }}
            value={typeInputValue}
          />
          <Group>
            {sortedGuesses.length > 0 &&
              sortedGuesses.map((guess) => (
                <Badge variant="light" color="green" size="lg" key={guess}>
                  {guess}
                </Badge>
              ))}
          </Group>
        </>
      )}
      {currentCard && (
        <Flashcard
          isPaywalled={isPaywalled}
          flipped={flipped}
          handleFlip={handleFlip}
          currentCard={currentCard}
          handleScore={handleScore}
          showLoader={showLoader}
          displayQuestion={displayQuestion}
          origDisplayQuestion={customArrange(
            alphagramLetters,
            currentCard.alphagram?.alphagram ?? ""
          )}
          onShuffle={() => setDisplayQuestion(shuffle(alphagramLetters))}
          onCustomArrange={() =>
            setDisplayQuestion(
              customArrange(
                alphagramLetters,
                currentCard.alphagram?.alphagram ?? ""
              )
            )
          }
        />
      )}

      <Text c="dimmed">
        Type{" "}
        <Kbd
          style={{ cursor: "pointer" }}
          onClick={() => setTypingMode((t) => !t)}
        >
          /
        </Kbd>{" "}
        to toggle typing mode.
      </Text>

      <Center style={{ marginTop: "20px" }}>
        <Text size="md">Cards left: {overdueCount}</Text>
      </Center>
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

export default FSRSCards;
