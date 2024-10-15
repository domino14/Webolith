// Flashcard.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { Button, Center, Text } from "@mantine/core";
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
import Flashcard from "./flashcard";

interface FSRSCardsProps {
  setFinishedCards: () => void;
}

const FSRSCards: React.FC<FSRSCardsProps> = ({ setFinishedCards }) => {
  const [flipped, setFlipped] = useState(false);
  const [previousCard, setPreviousCard] = useState<HistoryEntry | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const wordvaultClient = useClient(WordVaultService);
  const [showLoadMoreLink, setShowLoadMoreLink] = useState(false);
  const { lexicon } = useContext(AppContext);

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
        <Flashcard
          flipped={flipped}
          handleFlip={handleFlip}
          currentCard={currentCard}
          handleScore={handleScore}
          showLoader={showLoader}
        />
      )}

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
