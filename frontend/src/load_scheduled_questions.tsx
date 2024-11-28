import {
  Alert,
  Button,
  Collapse,
  Group,
  Image,
  List,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useContext, useEffect, useMemo, useState } from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import FSRSCards from "./fsrs_cards";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { LoginState, MaxNonmemberCards } from "./constants";
import { IconAlertCircleFilled, IconDatabaseDollar } from "@tabler/icons-react";
import addCardsImg from "./assets/wordvault-adding-new-words.png";
import { useDisclosure } from "@mantine/hooks";
export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);
  const [cardsToLoad, setCardsToLoad] = useState<number | undefined>(undefined);
  const { lexicon, loggedIn, username, isMember } = useContext(AppContext);
  const [totalCardCount, setTotalCardCount] = useState<number | undefined>(
    undefined
  );
  const wordvaultClient = useClient(WordVaultService);
  const [openedInstr, { toggle: toggleInstr }] = useDisclosure(false);
  const theme = useMantineTheme();

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
      {lexicon.startsWith("CSW") && (
        <>
          <Group gap="sm">
            <IconAlertCircleFilled color={theme.colors.red[6]} />
            <Text mt="lg" mb="sm" onClick={() => toggleInstr()}>
              Aerolith recently added CSW24. If you had a CSW21 WordVault, it
              was migrated to CSW24. (Click to read more):
            </Text>
          </Group>
          <Collapse in={openedInstr}>
            <List mb="sm">
              <List.Item>
                All new words in CSW24 that have an anagram already present in
                your WordVault have had their associated questions reset. These
                questions will be revisited within the coming week, with their
                "stability" set to 1.
              </List.Item>
              <List.Item>
                Any CSW24 deletions (a small number overall) resulted in the
                card being completely removed, but only if the card had no other
                undeleted anagrams that were also in your WordVault.
              </List.Item>
            </List>
            <Text mb="sm">
              If you want to study the new words, these will *not* automatically
              be added to your WordVault. Please add them using the Manage
              WordVault Cards button. The following is an example setting with
              an explanation.
            </Text>
            <Image src={addCardsImg} maw={1200} />
            <Text m="lg">
              The above search adds all new CSW21 words to your WordVault. Note
              that if you already have some of the old anagrams - for example,
              if STANDEN is in your WordVault, then the new word STANNED will
              not be added as a separate card. The migration process described
              above though will have already modified your ADENNST card to add
              the new anagram and schedule it again for the near future.
            </Text>
          </Collapse>
        </>
      )}
    </div>
  );
}
