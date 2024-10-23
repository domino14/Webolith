import { Button, Text } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import FSRSCards from "./fsrs_cards";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { LoginState } from "./constants";

export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);
  const [cardsToLoad, setCardsToLoad] = useState<number | undefined>(undefined);
  const { lexicon, loggedIn, username } = useContext(AppContext);
  const wordvaultClient = useClient(WordVaultService);

  useEffect(() => {
    if (lexicon === "" || cardsOngoing || loggedIn != LoginState.LoggedIn) {
      return;
    }

    // poll for how many cards there are
    const getDueCount = async () => {
      try {
        const counts = await wordvaultClient.nextScheduledCount({
          onlyOverdue: true,
          lexicon,
        });
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
  }, [cardsOngoing, lexicon, loggedIn, wordvaultClient]);

  return (
    <div>
      {cardsOngoing ? (
        <FSRSCards setFinishedCards={() => setCardsOngoing(false)} />
      ) : (
        <>
          <Text>Hi, {username}!</Text>
          <Text>
            You have {cardsToLoad} card{cardsToLoad != 1 ? "s" : ""} that{" "}
            {cardsToLoad != 1 ? "are" : "is"} now due in the lexicon {lexicon}.
          </Text>
          {cardsToLoad === 0 ? (
            <Text>
              Why not <Link to="/word-search">add some more?</Link>
            </Text>
          ) : (
            <Button mt={16} onClick={() => setCardsOngoing(true)}>
              Start studying
            </Button>
          )}
        </>
      )}
    </div>
  );
}
