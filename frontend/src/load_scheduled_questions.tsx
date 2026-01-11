import { Alert, Button, Group, Select, Text } from "@mantine/core";
import { useContext, useEffect, useMemo, useState } from "react";
import FSRSCards from "./fsrs_cards";
import { Link } from "react-router-dom";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { LoginState, MaxNonmemberCards } from "./constants";
import { IconDatabaseDollar } from "@tabler/icons-react";

export default function LoadScheduledQuestions() {
  const [cardsOngoing, setCardsOngoing] = useState(false);

  const [overdueCountByDeckId, setOverdueCountByDeckID] = useState<
    Map<bigint | null, number> | undefined
  >(undefined);

  const { lexicon, loggedIn, username, isMember, wordVaultClient, decksById } =
    useContext(AppContext);

  const [deckId, setDeckId] = useState<bigint | null>(null);
  const [totalCardCount, setTotalCardCount] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (lexicon === "" || cardsOngoing || loggedIn != LoginState.LoggedIn) {
      return;
    }

    // poll for how many cards there are
    const getDueCounts = async () => {
      if (!wordVaultClient) {
        return;
      }
      try {
        const { breakdowns } = await wordVaultClient.nextScheduledCountByDeck({
          onlyOverdue: true,
          lexicon,
        });

        setOverdueCountByDeckID(
          new Map(
            breakdowns?.map((c) => [
              c.deckId ?? null,
              c.breakdown["overdue"] ?? 0,
            ])
          )
        );

        const totalCount = await wordVaultClient.getCardCount({});
        setTotalCardCount(totalCount.totalCards);
      } catch (error) {
        notifications.show({
          title: "error",
          message: "Error getting due count: " + String(error),
          color: "red",
        });
      }
    };

    getDueCounts();
  }, [cardsOngoing, lexicon, loggedIn, wordVaultClient]);

  const totalOverdueCount = useMemo(() => {
    let totalOverdueCount = 0;

    for (const [, count] of overdueCountByDeckId ?? []) {
      totalOverdueCount += count;
    }

    return totalOverdueCount;
  }, [overdueCountByDeckId]);

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
          deckId={deckId}
        />
      ) : overdueCountByDeckId != undefined ? (
        <>
          <Text>Hi, {username}!</Text>
          <Text>
            You have {totalOverdueCount} card
            {totalOverdueCount != 1 ? "s" : ""} that{" "}
            {totalOverdueCount != 1 ? "are" : "is"} now due in the lexicon{" "}
            {lexicon}.
          </Text>
          {totalOverdueCount !== 0 && (
            <Group mt="lg">
              {decksById.size > 0 && (
                <Select
                  data={[
                    {
                      value: "",
                      label: "Default Deck",
                    },
                    ...Array.from(decksById.entries()).map(([id, deck]) => ({
                      value: id.toString(),
                      label: deck.name,
                    })),
                  ]}
                  renderOption={({ option }) => {
                    const overdueCount =
                      overdueCountByDeckId?.get(
                        option.value === "" || !option.value
                          ? 0n
                          : BigInt(option.value)
                      ) ?? 0;
                    return (
                      <Group>
                        <Text>
                          {option.label}
                          <Text size="sm" c="dimmed">
                            ({overdueCount} due)
                          </Text>
                        </Text>
                      </Group>
                    );
                  }}
                  value={deckId?.toString() ?? ""}
                  onChange={(value) => setDeckId(value ? BigInt(value) : null)}
                />
              )}

              <Button onClick={() => setCardsOngoing(true)}>
                Start studying
              </Button>
            </Group>
          )}
          {totalOverdueCount === 0 && (
            <Text>
              Why not <Link to="/word-search">add some more?</Link>
            </Text>
          )}
        </>
      ) : null}
      {/*
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
      )*/}
    </div>
  );
}
