import { Button, Text } from "@mantine/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import Flashcard from "./flashcard";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { Card } from "./gen/rpc/wordvault/api_pb";

export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);
  const [cardsToLoad, setCardsToLoad] = useState(0);
  const { jwt, lexicon } = useContext(AppContext);
  const wordvaultClient = useClient(WordVaultService);

  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    if (jwt === "" || cardsOngoing) {
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
        console.error("Error getting due count:", error);
      }
    };

    getDueCount();
  }, [jwt, cardsOngoing, lexicon, wordvaultClient]);

  return (
    <div>
      {cardsOngoing ? (
        <Flashcard cards={cards} />
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
  cardsToLoad: number;
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
        { lexicon, limit: 250 },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setCards(cards.cards);
    } catch (error) {
      console.error("error loading cards", error);
    }
  }, [wordvaultClient, lexicon, jwt, setCards]);
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
        <Button onClick={loadScheduledCards}>Load cards</Button>
      )}
    </>
  );
};
