import { Alert, Button, Text } from "@mantine/core";
import { useContext, useEffect, useMemo, useState } from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import FSRSCards from "./fsrs_cards";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { LoginState, MaxNonmemberCards } from "./constants";
import { IconDatabaseDollar } from "@tabler/icons-react";

export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);
  const [cardsToLoad, setCardsToLoad] = useState<number | undefined>(undefined);
  const { lexicon, loggedIn, username, isMember } = useContext(AppContext);
  const [totalCardCount, setTotalCardCount] = useState<number | undefined>(
    undefined
  );
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
        const totalCount = await wordvaultClient.getCardCount({});
        setTotalCardCount(totalCount.totalCards);
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

  const isPaywalled = useMemo(() => {
    return (
      totalCardCount != undefined &&
      totalCardCount > MaxNonmemberCards &&
      !isMember
    );
  }, [isMember, totalCardCount]);

  return (
    <div>
      {isPaywalled && (
        <Alert
          color="red"
          title="Card limit reached"
          icon={<IconDatabaseDollar />}
        >
          <Text>
            You have reached the card limit for nonmembers. If you are finding
            Aerolith to be useful, please{" "}
            <a href="/supporter">upgrade your membership</a>.
          </Text>
          <Text mt="lg">We really appreciate your support.</Text>
        </Alert>
      )}
      {cardsOngoing ? (
        <FSRSCards
          isPaywalled={isPaywalled}
          setFinishedCards={() => setCardsOngoing(false)}
        />
      ) : cardsToLoad != undefined ? (
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
      ) : null}
    </div>
  );
}
