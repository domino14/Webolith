import { Button, Loader, Text } from "@mantine/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import Flashcard from "./flashcard";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { Card } from "./gen/rpc/wordvault/api_pb";
import { notifications } from "@mantine/notifications";

const LoadLimit = 500;

export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);
  const [cardsToLoad, setCardsToLoad] = useState<number | undefined>(undefined);
  const { jwt, lexicon } = useContext(AppContext);
  const wordvaultClient = useClient(WordVaultService);

  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    if (jwt === "" || lexicon === "" || cardsOngoing) {
      return;
    }

    // poll for how many cards there are
    const getDueCount = async () => {
      try {
        const counts = await wordvaultClient.nextScheduledCount(
          {
            onlyOverdue: true,
            lexicon,
          },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        setCardsToLoad(counts.breakdown["overdue"]);
      } catch (error) {
        notifications.show({
          title: "error",
          message: "Error getting due count: " + String(error),
          color: "red",
        });
      }
    };

    getDueCount();
  }, [jwt, cardsOngoing, lexicon, wordvaultClient]);

  return (
    <div>
      {cardsOngoing ? (
        <Flashcard
          cards={cards}
          setFinishedCards={() => setCardsOngoing(false)}
        />
      ) : (
        <CardLoader
          jwt={jwt}
          cardsToLoad={cardsToLoad}
          lexicon={lexicon}
          setCards={(cards) => {
            setCards(cards);
            if (cards.length > 0) {
              setCardsOngoing(true);
            }
          }}
        />
      )}
    </div>
  );
}

// Define the prop types
interface CardLoaderProps {
  jwt: string;
  lexicon: string;
  cardsToLoad: number | undefined;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

const CardLoader: React.FC<CardLoaderProps> = ({
  jwt,
  lexicon,
  cardsToLoad,
  setCards,
}) => {
  const wordvaultClient = useClient(WordVaultService);

  const loadScheduledCards = useCallback(async () => {
    try {
      const cards = await wordvaultClient.getNextScheduled(
        { lexicon, limit: LoadLimit },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setCards(cards.cards);
    } catch (error) {
      notifications.show({
        title: "error",
        message: "Error loading cards: " + String(error),
        color: "red",
      });
    }
  }, [wordvaultClient, lexicon, jwt, setCards]);

  if (cardsToLoad === undefined) {
    return <Loader type="bars" />;
  }

  return (
    <>
      <Text>
        You have {cardsToLoad} cards that are due in the lexicon {lexicon}.
      </Text>
      {cardsToLoad === 0 ? (
        <Text>
          Why not <Link to="/word-search">add some more?</Link>
        </Text>
      ) : (
        <Button mt={16} onClick={loadScheduledCards}>
          Study {Math.min(LoadLimit, cardsToLoad)} cards
        </Button>
      )}
    </>
  );
};
